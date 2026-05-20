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

// AiMemeHandler processes !aimeme [prompt] commands.
type AiMemeHandler struct {
	sender  sender.MessageSender
	imgflip *service.ImgflipService
	reqRepo storage.ReqRegisterRepo
}

// NewAiMemeHandler creates an AiMemeHandler.
func NewAiMemeHandler(s sender.MessageSender, imgflip *service.ImgflipService, reqRepo storage.ReqRegisterRepo) *AiMemeHandler {
	return &AiMemeHandler{sender: s, imgflip: imgflip, reqRepo: reqRepo}
}

func (h *AiMemeHandler) Name() string               { return "aimeme" }
func (h *AiMemeHandler) BypassPermissionGate() bool { return false }

func (h *AiMemeHandler) CanHandle(evt *events.Message, _ *storage.Group) bool {
	return strings.HasPrefix(getBody(evt), "!aimeme")
}

func (h *AiMemeHandler) Handle(ctx context.Context, evt *events.Message, group *storage.Group) error {
	prompt := strings.TrimSpace(strings.TrimPrefix(getBody(evt), "!aimeme"))
	if prompt == "" {
		return h.sender.SendText(ctx, evt.Info.Chat, "❌ Informe um prompt: !aimeme <descrição>")
	}

	imgBytes, err := h.imgflip.AIMeme(ctx, prompt)
	if err != nil {
		_ = h.sender.SendText(ctx, evt.Info.Chat, "❌ Erro ao gerar meme.")
		return fmt.Errorf("aimeme: %w", err)
	}

	if err := h.sender.SendImage(ctx, evt.Info.Chat, imgBytes, ""); err != nil {
		return fmt.Errorf("aimeme: send: %w", err)
	}

	_ = h.reqRepo.Save(ctx, storage.RequestRegister{
		GroupJID:  group.JID,
		AuthorJID: evt.Info.Sender.String(),
		ReqType:   storage.ReqMeme,
		CreatedAt: time.Now(),
	})
	return nil
}
