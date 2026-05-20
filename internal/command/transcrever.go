package command

import (
	"context"
	"fmt"
	"strings"
	"time"

	"go.mau.fi/whatsmeow"
	waProto "go.mau.fi/whatsmeow/proto/waE2E"
	"go.mau.fi/whatsmeow/types/events"

	"github.com/leleuvilela/leniser-wpp/internal/sender"
	"github.com/leleuvilela/leniser-wpp/internal/service"
	"github.com/leleuvilela/leniser-wpp/internal/storage"
)

// TranscreverHandler processes !transcrever commands (reply to audio/voice).
type TranscreverHandler struct {
	sender   sender.MessageSender
	openai   *service.OpenAIService
	reqRepo  storage.ReqRegisterRepo
	waClient *whatsmeow.Client
}

// NewTranscreverHandler creates a TranscreverHandler.
func NewTranscreverHandler(
	s sender.MessageSender,
	openai *service.OpenAIService,
	reqRepo storage.ReqRegisterRepo,
	waClient *whatsmeow.Client,
) *TranscreverHandler {
	return &TranscreverHandler{sender: s, openai: openai, reqRepo: reqRepo, waClient: waClient}
}

func (h *TranscreverHandler) Name() string               { return "transcrever" }
func (h *TranscreverHandler) BypassPermissionGate() bool { return false }

func (h *TranscreverHandler) CanHandle(evt *events.Message, _ *storage.Group) bool {
	return strings.HasPrefix(getBody(evt), "!transcrever")
}

func (h *TranscreverHandler) Handle(ctx context.Context, evt *events.Message, group *storage.Group) error {
	var audioMsg *waProto.AudioMessage

	if msg := evt.Message; msg != nil {
		if ext := msg.GetExtendedTextMessage(); ext != nil {
			if ci := ext.GetContextInfo(); ci != nil {
				if quoted := ci.GetQuotedMessage(); quoted != nil {
					audioMsg = quoted.GetAudioMessage()
				}
			}
		}
	}

	if audioMsg == nil {
		return h.sender.SendText(ctx, evt.Info.Chat, "❌ Responda a uma mensagem de áudio para transcrever.")
	}

	h.sender.SetTyping(ctx, evt.Info.Chat, true)
	defer h.sender.SetTyping(ctx, evt.Info.Chat, false)

	audioBytes, err := h.waClient.Download(ctx, audioMsg)
	if err != nil {
		_ = h.sender.SendText(ctx, evt.Info.Chat, "❌ Erro ao baixar áudio.")
		return fmt.Errorf("transcrever: download: %w", err)
	}

	text, err := h.openai.Transcribe(ctx, audioBytes)
	if err != nil {
		_ = h.sender.SendText(ctx, evt.Info.Chat, "❌ Erro ao transcrever: "+err.Error())
		return fmt.Errorf("transcrever: transcribe: %w", err)
	}

	if err := h.sender.SendText(ctx, evt.Info.Chat, "📝 "+text); err != nil {
		return fmt.Errorf("transcrever: send: %w", err)
	}

	_ = h.reqRepo.Save(ctx, storage.RequestRegister{
		GroupJID:  group.JID,
		AuthorJID: evt.Info.Sender.String(),
		ReqType:   storage.ReqAudio,
		CreatedAt: time.Now(),
	})
	return nil
}
