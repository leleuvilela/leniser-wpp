package command

import (
	"context"
	"fmt"
	"strconv"
	"strings"
	"time"

	"go.mau.fi/whatsmeow/types/events"

	"github.com/leleuvilela/leniser-wpp/internal/sender"
	"github.com/leleuvilela/leniser-wpp/internal/service"
	"github.com/leleuvilela/leniser-wpp/internal/storage"
)

// ResumoHandler processes !resumo [N] commands.
type ResumoHandler struct {
	sender     sender.MessageSender
	openai     *service.OpenAIService
	msgRepo    storage.MessageRepo
	groupRepo  storage.GroupRepo
	reqRepo    storage.ReqRegisterRepo
}

// NewResumoHandler creates a ResumoHandler.
func NewResumoHandler(
	s sender.MessageSender,
	openai *service.OpenAIService,
	msgRepo storage.MessageRepo,
	groupRepo storage.GroupRepo,
	reqRepo storage.ReqRegisterRepo,
) *ResumoHandler {
	return &ResumoHandler{sender: s, openai: openai, msgRepo: msgRepo, groupRepo: groupRepo, reqRepo: reqRepo}
}

func (h *ResumoHandler) Name() string               { return "resumo" }
func (h *ResumoHandler) BypassPermissionGate() bool { return false }

func (h *ResumoHandler) CanHandle(evt *events.Message, _ *storage.Group) bool {
	return strings.HasPrefix(getBody(evt), "!resumo")
}

func (h *ResumoHandler) Handle(ctx context.Context, evt *events.Message, group *storage.Group) error {
	arg := strings.TrimSpace(strings.TrimPrefix(getBody(evt), "!resumo"))
	limit := 50
	if arg != "" {
		if n, err := strconv.Atoi(arg); err == nil {
			if n > 200 {
				n = 200
			}
			limit = n
		}
	}

	records, err := h.msgRepo.ListRecent(ctx, group.JID, limit)
	if err != nil {
		return fmt.Errorf("resumo: list: %w", err)
	}
	if len(records) == 0 {
		return h.sender.SendText(ctx, evt.Info.Chat, "ℹ️ Nenhuma mensagem salva para resumir.")
	}

	// Resolve member names
	members, _ := h.groupRepo.GetMembers(ctx, group.JID)
	nameMap := make(map[string]string)
	for _, m := range members {
		nameMap[m.UserJID] = m.Name
	}

	var lines []string
	for i := len(records) - 1; i >= 0; i-- {
		r := records[i]
		if r.MessageType != "text" {
			continue
		}
		name := nameMap[r.AuthorJID]
		if name == "" {
			parts := strings.Split(r.AuthorJID, "@")
			name = parts[0]
		}
		lines = append(lines, name+": [mensagem]") // body not stored; just identity
	}

	if len(lines) == 0 {
		return h.sender.SendText(ctx, evt.Info.Chat, "ℹ️ Nenhuma mensagem de texto para resumir.")
	}

	prompt := "Resuma as seguintes mensagens de grupo de forma concisa em português:\n\n" + strings.Join(lines, "\n")

	h.sender.SetTyping(ctx, evt.Info.Chat, true)
	defer h.sender.SetTyping(ctx, evt.Info.Chat, false)

	summary, err := h.openai.Chat(ctx, "", []service.ChatMessage{{Role: "user", Content: prompt}})
	if err != nil {
		_ = h.sender.SendText(ctx, evt.Info.Chat, "❌ Erro ao resumir: "+err.Error())
		return fmt.Errorf("resumo: chat: %w", err)
	}

	if err := h.sender.SendText(ctx, evt.Info.Chat, "📋 *Resumo*:\n"+summary); err != nil {
		return fmt.Errorf("resumo: send: %w", err)
	}

	_ = h.reqRepo.Save(ctx, storage.RequestRegister{
		GroupJID:  group.JID,
		AuthorJID: evt.Info.Sender.String(),
		ReqType:   storage.ReqText,
		CreatedAt: time.Now(),
	})
	return nil
}
