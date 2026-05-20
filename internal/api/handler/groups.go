package handler

import (
	"context"
	"encoding/json"
	"net/http"
	"strings"

	"github.com/go-chi/chi/v5"
	"go.mau.fi/whatsmeow/types"

	"github.com/leleuvilela/leniser-wpp/internal/sender"
	"github.com/leleuvilela/leniser-wpp/internal/storage"
)

// GroupsHandler serves all /api/v1/groups/* endpoints.
type GroupsHandler struct {
	groupRepo  storage.GroupRepo
	configRepo storage.ConfigRepo
	msgSender  sender.MessageSender
}

// NewGroupsHandler creates a GroupsHandler.
func NewGroupsHandler(groupRepo storage.GroupRepo, configRepo storage.ConfigRepo, s sender.MessageSender) *GroupsHandler {
	return &GroupsHandler{
		groupRepo:  groupRepo,
		configRepo: configRepo,
		msgSender:  s,
	}
}

type groupResponse struct {
	JID         string             `json:"jid"`
	Name        string             `json:"name"`
	Permissions []storage.Permission `json:"permissions"`
	Config      resolvedConfig     `json:"config"`
	CreatedAt   string             `json:"created_at"`
	UpdatedAt   string             `json:"updated_at"`
}

type resolvedConfig struct {
	BotPrefix            string `json:"bot_prefix"`
	SystemPrompt         string `json:"system_prompt"`
	ImageCooldownEnabled bool   `json:"image_cooldown_enabled"`
	ImageCooldownMinutes int    `json:"image_cooldown_minutes"`
}

func (h *GroupsHandler) buildResponse(ctx context.Context, g *storage.Group) (groupResponse, error) {
	global, err := h.configRepo.Get(ctx)
	if err != nil {
		return groupResponse{}, err
	}
	cfg := storage.ResolveConfig(global, g.Config)

	perms := g.Permissions
	if perms == nil {
		perms = []storage.Permission{}
	}

	return groupResponse{
		JID:         g.JID,
		Name:        g.Name,
		Permissions: perms,
		Config: resolvedConfig{
			BotPrefix:            cfg.BotPrefix,
			SystemPrompt:         cfg.SystemPrompt,
			ImageCooldownEnabled: cfg.ImageCooldownEnabled,
			ImageCooldownMinutes: cfg.ImageCooldownMinutes,
		},
		CreatedAt: g.CreatedAt.Format("2006-01-02T15:04:05Z"),
		UpdatedAt: g.UpdatedAt.Format("2006-01-02T15:04:05Z"),
	}, nil
}

// List handles GET /api/v1/groups.
func (h *GroupsHandler) List(w http.ResponseWriter, r *http.Request) {
	groups, err := h.groupRepo.List(r.Context())
	if err != nil {
		jsonError(w, "failed to list groups", http.StatusInternalServerError)
		return
	}
	out := make([]groupResponse, 0, len(groups))
	for _, g := range groups {
		resp, err := h.buildResponse(r.Context(), g)
		if err != nil {
			jsonError(w, "failed to build group response", http.StatusInternalServerError)
			return
		}
		out = append(out, resp)
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(out)
}

// Get handles GET /api/v1/groups/{jid}.
func (h *GroupsHandler) Get(w http.ResponseWriter, r *http.Request) {
	jid := chi.URLParam(r, "jid")
	g, err := h.groupRepo.Get(r.Context(), jid)
	if err != nil {
		jsonError(w, "failed to get group", http.StatusInternalServerError)
		return
	}
	if g == nil {
		jsonError(w, "group not found", http.StatusNotFound)
		return
	}
	resp, err := h.buildResponse(r.Context(), g)
	if err != nil {
		jsonError(w, "failed to build response", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}

var validPermissions = map[storage.Permission]bool{
	storage.PermMessageCreate: true,
	storage.PermSaveMessage:   true,
	storage.PermMessageRevoke: true,
}

// SetPermissions handles PUT /api/v1/groups/{jid}/permissions.
func (h *GroupsHandler) SetPermissions(w http.ResponseWriter, r *http.Request) {
	jid := chi.URLParam(r, "jid")
	var body struct {
		Permissions []storage.Permission `json:"permissions"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		jsonError(w, "invalid body", http.StatusBadRequest)
		return
	}
	for _, p := range body.Permissions {
		if !validPermissions[p] {
			jsonError(w, "unknown permission: "+string(p), http.StatusUnprocessableEntity)
			return
		}
	}
	if err := h.groupRepo.SetPermissions(r.Context(), jid, body.Permissions); err != nil {
		jsonError(w, "failed to set permissions", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"jid":         jid,
		"permissions": body.Permissions,
	})
}

// SetConfig handles PUT /api/v1/groups/{jid}/config.
func (h *GroupsHandler) SetConfig(w http.ResponseWriter, r *http.Request) {
	jid := chi.URLParam(r, "jid")
	var body struct {
		BotPrefix            *string `json:"bot_prefix"`
		SystemPrompt         *string `json:"system_prompt"`
		ImageCooldownEnabled *bool   `json:"image_cooldown_enabled"`
		ImageCooldownMinutes *int    `json:"image_cooldown_minutes"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		jsonError(w, "invalid body", http.StatusBadRequest)
		return
	}
	cfg := storage.GroupConfig{
		GroupJID:             jid,
		BotPrefix:            body.BotPrefix,
		SystemPrompt:         body.SystemPrompt,
		ImageCooldownEnabled: body.ImageCooldownEnabled,
		ImageCooldownMinutes: body.ImageCooldownMinutes,
	}
	if err := h.groupRepo.SetConfig(r.Context(), cfg); err != nil {
		jsonError(w, "failed to set group config", http.StatusInternalServerError)
		return
	}
	// Return resolved config
	global, err := h.configRepo.Get(r.Context())
	if err != nil {
		jsonError(w, "failed to load global config", http.StatusInternalServerError)
		return
	}
	resolved := storage.ResolveConfig(global, &cfg)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resolvedConfig{
		BotPrefix:            resolved.BotPrefix,
		SystemPrompt:         resolved.SystemPrompt,
		ImageCooldownEnabled: resolved.ImageCooldownEnabled,
		ImageCooldownMinutes: resolved.ImageCooldownMinutes,
	})
}

// SendMessage handles POST /api/v1/groups/{jid}/messages.
func (h *GroupsHandler) SendMessage(w http.ResponseWriter, r *http.Request) {
	jid := chi.URLParam(r, "jid")
	var body struct {
		Text string `json:"text"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		jsonError(w, "invalid body", http.StatusBadRequest)
		return
	}
	text := strings.TrimSpace(body.Text)
	if text == "" || len([]rune(text)) > 4096 {
		jsonError(w, "text is empty or exceeds 4096 characters", http.StatusUnprocessableEntity)
		return
	}
	g, err := h.groupRepo.Get(r.Context(), jid)
	if err != nil || g == nil {
		jsonError(w, "group not found", http.StatusNotFound)
		return
	}
	if h.msgSender == nil {
		jsonError(w, "sender not configured", http.StatusInternalServerError)
		return
	}
	parsed, err := types.ParseJID(jid)
	if err != nil {
		jsonError(w, "invalid jid", http.StatusBadRequest)
		return
	}
	if err := h.msgSender.SendText(r.Context(), parsed, text); err != nil {
		jsonError(w, "failed to send message", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusAccepted)
	json.NewEncoder(w).Encode(map[string]string{"status": "queued"})
}

func jsonError(w http.ResponseWriter, msg string, code int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	json.NewEncoder(w).Encode(map[string]string{"error": msg})
}
