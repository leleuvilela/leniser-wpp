package command

import (
	"context"
	"fmt"
	"strings"

	"go.mau.fi/whatsmeow"
	waProto "go.mau.fi/whatsmeow/proto/waE2E"
	"go.mau.fi/whatsmeow/types/events"

	"github.com/leleuvilela/leniser-wpp/internal/sender"
	"github.com/leleuvilela/leniser-wpp/internal/storage"
)

// StickerHandler processes !sticker commands.
type StickerHandler struct {
	sender   sender.MessageSender
	waClient *whatsmeow.Client
}

// NewStickerHandler creates a StickerHandler.
func NewStickerHandler(s sender.MessageSender, waClient *whatsmeow.Client) *StickerHandler {
	return &StickerHandler{sender: s, waClient: waClient}
}

func (h *StickerHandler) Name() string               { return "sticker" }
func (h *StickerHandler) BypassPermissionGate() bool { return false }

func (h *StickerHandler) CanHandle(evt *events.Message, _ *storage.Group) bool {
	return strings.HasPrefix(getBody(evt), "!sticker")
}

func (h *StickerHandler) Handle(ctx context.Context, evt *events.Message, group *storage.Group) error {
	var mediaMsg whatsmeow.DownloadableMessage

	msg := evt.Message
	if msg != nil {
		if img := msg.GetImageMessage(); img != nil {
			mediaMsg = img
		} else if vid := msg.GetVideoMessage(); vid != nil {
			mediaMsg = vid
		} else if ext := msg.GetExtendedTextMessage(); ext != nil {
			if ci := ext.GetContextInfo(); ci != nil {
				if quoted := ci.GetQuotedMessage(); quoted != nil {
					if img := quoted.GetImageMessage(); img != nil {
						mediaMsg = img
					} else if vid := quoted.GetVideoMessage(); vid != nil {
						mediaMsg = vid
					}
				}
			}
		}
	}

	if mediaMsg == nil {
		return h.sender.SendText(ctx, evt.Info.Chat, "❌ Envie ou responda a uma imagem/vídeo para criar o sticker.")
	}

	imgBytes, err := h.waClient.Download(ctx, mediaMsg)
	if err != nil {
		return fmt.Errorf("sticker: download: %w", err)
	}

	return h.sender.SendSticker(ctx, evt.Info.Chat, imgBytes)
}

// Ensure proto types satisfy the interface (compile-time check).
var _ whatsmeow.DownloadableMessage = (*waProto.ImageMessage)(nil)
