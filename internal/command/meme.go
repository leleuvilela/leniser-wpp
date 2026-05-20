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

// MemeHandler processes !meme [query] commands.
type MemeHandler struct {
	sender  sender.MessageSender
	imgflip *service.ImgflipService
	reqRepo storage.ReqRegisterRepo
}

// NewMemeHandler creates a MemeHandler.
func NewMemeHandler(s sender.MessageSender, imgflip *service.ImgflipService, reqRepo storage.ReqRegisterRepo) *MemeHandler {
	return &MemeHandler{sender: s, imgflip: imgflip, reqRepo: reqRepo}
}

func (h *MemeHandler) Name() string               { return "meme" }
func (h *MemeHandler) BypassPermissionGate() bool { return false }

func (h *MemeHandler) CanHandle(evt *events.Message, _ *storage.Group) bool {
	return strings.HasPrefix(getBody(evt), "!meme")
}

func (h *MemeHandler) Handle(ctx context.Context, evt *events.Message, group *storage.Group) error {
	query := strings.TrimSpace(strings.TrimPrefix(getBody(evt), "!meme"))
	if query == "" {
		return h.sender.SendText(ctx, evt.Info.Chat, "❌ Informe uma busca: !meme <termo>")
	}

	imgBytes, err := h.imgflip.SearchMeme(ctx, query)
	if err != nil {
		_ = h.sender.SendText(ctx, evt.Info.Chat, "❌ Meme não encontrado.")
		return fmt.Errorf("meme: search: %w", err)
	}

	if err := h.sender.SendImage(ctx, evt.Info.Chat, imgBytes, ""); err != nil {
		return fmt.Errorf("meme: send: %w", err)
	}

	_ = h.reqRepo.Save(ctx, storage.RequestRegister{
		GroupJID:  group.JID,
		AuthorJID: evt.Info.Sender.String(),
		ReqType:   storage.ReqMeme,
		CreatedAt: time.Now(),
	})
	return nil
}
