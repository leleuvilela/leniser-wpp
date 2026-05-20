package handler

import (
	"encoding/json"
	"net/http"

	"github.com/leleuvilela/leniser-wpp/internal/storage"
)

// ConfigHandler serves GET/PUT /api/v1/config.
type ConfigHandler struct {
	repo storage.ConfigRepo
}

// NewConfigHandler creates a ConfigHandler.
func NewConfigHandler(repo storage.ConfigRepo) *ConfigHandler {
	return &ConfigHandler{repo: repo}
}

// GetConfig handles GET /api/v1/config.
func (h *ConfigHandler) GetConfig(w http.ResponseWriter, r *http.Request) {
	cfg, err := h.repo.Get(r.Context())
	if err != nil {
		http.Error(w, `{"error":"failed to load config"}`, http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(cfg)
}

// SetConfig handles PUT /api/v1/config.
func (h *ConfigHandler) SetConfig(w http.ResponseWriter, r *http.Request) {
	var cfg storage.Config
	if err := json.NewDecoder(r.Body).Decode(&cfg); err != nil {
		http.Error(w, `{"error":"invalid body"}`, http.StatusBadRequest)
		return
	}
	if err := h.repo.Set(r.Context(), cfg); err != nil {
		http.Error(w, `{"error":"failed to save config"}`, http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
