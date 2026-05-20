package command

import (
	"context"
	"fmt"
	"strings"

	"go.mau.fi/whatsmeow"
	"go.mau.fi/whatsmeow/types/events"

	"github.com/leleuvilela/leniser-wpp/internal/sender"
	"github.com/leleuvilela/leniser-wpp/internal/service"
	"github.com/leleuvilela/leniser-wpp/internal/storage"
)

// Mp3Handler processes !mp3 commands (reply to audio/voice/video).
type Mp3Handler struct {
	sender   sender.MessageSender
	waClient *whatsmeow.Client
}

// NewMp3Handler creates an Mp3Handler.
func NewMp3Handler(s sender.MessageSender, waClient *whatsmeow.Client) *Mp3Handler {
	return &Mp3Handler{sender: s, waClient: waClient}
}

func (h *Mp3Handler) Name() string               { return "mp3" }
func (h *Mp3Handler) BypassPermissionGate() bool { return false }

func (h *Mp3Handler) CanHandle(evt *events.Message, _ *storage.Group) bool {
	return strings.HasPrefix(getBody(evt), "!mp3")
}

func (h *Mp3Handler) Handle(ctx context.Context, evt *events.Message, group *storage.Group) error {
	arg := strings.TrimSpace(strings.TrimPrefix(getBody(evt), "!mp3"))
	filename := "audio"
	if arg != "" {
		filename = arg
	}

	var mediaMsg whatsmeow.DownloadableMessage
	var mime string

	msg := evt.Message
	if msg != nil {
		if ext := msg.GetExtendedTextMessage(); ext != nil {
			if ci := ext.GetContextInfo(); ci != nil {
				if quoted := ci.GetQuotedMessage(); quoted != nil {
					if a := quoted.GetAudioMessage(); a != nil {
						mediaMsg = a
						mime = a.GetMimetype()
					} else if v := quoted.GetVideoMessage(); v != nil {
						mediaMsg = v
						mime = v.GetMimetype()
					}
				}
			}
		} else if a := msg.GetAudioMessage(); a != nil {
			mediaMsg = a
			mime = a.GetMimetype()
		} else if v := msg.GetVideoMessage(); v != nil {
			mediaMsg = v
			mime = v.GetMimetype()
		}
	}

	if mediaMsg == nil {
		return h.sender.SendText(ctx, evt.Info.Chat, "❌ Responda a uma mensagem de áudio ou vídeo.")
	}

	inputBytes, err := h.waClient.Download(ctx, mediaMsg)
	if err != nil {
		return fmt.Errorf("mp3: download: %w", err)
	}

	mp3Bytes, err := service.ConvertToMP3(ctx, inputBytes, mime)
	if err != nil {
		_ = h.sender.SendText(ctx, evt.Info.Chat, "❌ Erro ao converter para MP3.")
		return fmt.Errorf("mp3: convert: %w", err)
	}

	return h.sender.SendDocument(ctx, evt.Info.Chat, mp3Bytes, filename+".mp3", "audio/mpeg")
}
