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

// ImagemHandler processes !imagem [prompt] commands.
type ImagemHandler struct {
	sender     sender.MessageSender
	openai     *service.OpenAIService
	configRepo storage.ConfigRepo
	reqRepo    storage.ReqRegisterRepo
}

// NewImagemHandler creates an ImagemHandler.
func NewImagemHandler(
	s sender.MessageSender,
	openai *service.OpenAIService,
	configRepo storage.ConfigRepo,
	reqRepo storage.ReqRegisterRepo,
) *ImagemHandler {
	return &ImagemHandler{sender: s, openai: openai, configRepo: configRepo, reqRepo: reqRepo}
}

func (h *ImagemHandler) Name() string               { return "imagem" }
func (h *ImagemHandler) BypassPermissionGate() bool { return false }

func (h *ImagemHandler) CanHandle(evt *events.Message, _ *storage.Group) bool {
	return strings.HasPrefix(getBody(evt), "!imagem")
}

func (h *ImagemHandler) Handle(ctx context.Context, evt *events.Message, group *storage.Group) error {
	prompt := strings.TrimSpace(strings.TrimPrefix(getBody(evt), "!imagem"))
	if prompt == "" {
		return h.sender.SendText(ctx, evt.Info.Chat, "❌ Informe um prompt: !imagem <descrição>")
	}

	cfg, err := h.configRepo.Get(ctx)
	if err != nil {
		return fmt.Errorf("imagem: get config: %w", err)
	}
	resolved := storage.ResolveConfig(cfg, group.Config)

	// Cooldown check
	if resolved.ImageCooldownEnabled {
		last, err := h.reqRepo.LastByGroup(ctx, group.JID, storage.ReqImage)
		if err == nil && last != nil {
			elapsed := time.Since(last.CreatedAt)
			cooldown := time.Duration(resolved.ImageCooldownMinutes) * time.Minute
			if elapsed < cooldown {
				remaining := cooldown - elapsed
				_ = h.sender.SendText(ctx, evt.Info.Chat,
					fmt.Sprintf("⏳ Aguarde %dm para gerar outra imagem.", int(remaining.Minutes())+1))
				return nil
			}
		}
	}

	h.sender.SetTyping(ctx, evt.Info.Chat, true)
	defer h.sender.SetTyping(ctx, evt.Info.Chat, false)

	imgBytes, err := h.openai.GenerateImage(ctx, prompt)
	if err != nil {
		_ = h.sender.SendText(ctx, evt.Info.Chat, "❌ Erro ao gerar imagem: "+err.Error())
		return fmt.Errorf("imagem: generate: %w", err)
	}

	if err := h.sender.SendImage(ctx, evt.Info.Chat, imgBytes, ""); err != nil {
		return fmt.Errorf("imagem: send: %w", err)
	}

	_ = h.reqRepo.Save(ctx, storage.RequestRegister{
		GroupJID:  group.JID,
		AuthorJID: evt.Info.Sender.String(),
		ReqType:   storage.ReqImage,
		CreatedAt: time.Now(),
	})
	return nil
}
