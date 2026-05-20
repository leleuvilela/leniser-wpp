package command

import (
	"context"
	"fmt"
	"strings"
	"time"

	"go.mau.fi/whatsmeow/types/events"

	"github.com/leleuvilela/leniser-wpp/internal/sender"
	"github.com/leleuvilela/leniser-wpp/internal/service"
	"github.com/leleuvilela/leniser-wpp/internal/storage"
)

// MusicaHandler processes !musica [prompt] commands.
type MusicaHandler struct {
	sender  sender.MessageSender
	suno    *service.SunoService
	reqRepo storage.ReqRegisterRepo
}

// NewMusicaHandler creates a MusicaHandler.
func NewMusicaHandler(s sender.MessageSender, suno *service.SunoService, reqRepo storage.ReqRegisterRepo) *MusicaHandler {
	return &MusicaHandler{sender: s, suno: suno, reqRepo: reqRepo}
}

func (h *MusicaHandler) Name() string               { return "musica" }
func (h *MusicaHandler) BypassPermissionGate() bool { return false }

func (h *MusicaHandler) CanHandle(evt *events.Message, _ *storage.Group) bool {
	b := getBody(evt)
	return strings.HasPrefix(b, "!musica") || strings.HasPrefix(b, "!música")
}

func (h *MusicaHandler) Handle(ctx context.Context, evt *events.Message, group *storage.Group) error {
	body := getBody(evt)
	prompt := strings.TrimSpace(strings.TrimPrefix(strings.TrimPrefix(body, "!música"), "!musica"))
	if prompt == "" {
		return h.sender.SendText(ctx, evt.Info.Chat, "❌ Informe um prompt: !musica <descrição>")
	}

	_ = h.sender.SendText(ctx, evt.Info.Chat, "🎵 Gerando música... ≈3 min")

	audioBytes, err := h.suno.Generate(ctx, prompt)
	if err != nil {
		_ = h.sender.SendText(ctx, evt.Info.Chat, "❌ Erro ao gerar música: "+err.Error())
		return fmt.Errorf("musica: generate: %w", err)
	}

	if err := h.sender.SendAudio(ctx, evt.Info.Chat, audioBytes, "audio/mpeg"); err != nil {
		return fmt.Errorf("musica: send: %w", err)
	}

	_ = h.reqRepo.Save(ctx, storage.RequestRegister{
		GroupJID:  group.JID,
		AuthorJID: evt.Info.Sender.String(),
		ReqType:   storage.ReqAudio,
		CreatedAt: time.Now(),
	})
	return nil
}
