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

// FalaHandler processes !fala [text] commands using OpenAI TTS.
type FalaHandler struct {
	sender     sender.MessageSender
	openai     *service.OpenAIService
	reqRepo    storage.ReqRegisterRepo
}

// NewFalaHandler creates a FalaHandler.
func NewFalaHandler(s sender.MessageSender, openai *service.OpenAIService, reqRepo storage.ReqRegisterRepo) *FalaHandler {
	return &FalaHandler{sender: s, openai: openai, reqRepo: reqRepo}
}

func (h *FalaHandler) Name() string               { return "fala" }
func (h *FalaHandler) BypassPermissionGate() bool { return false }

func (h *FalaHandler) CanHandle(evt *events.Message, _ *storage.Group) bool {
	return strings.HasPrefix(getBody(evt), "!fala")
}

func (h *FalaHandler) Handle(ctx context.Context, evt *events.Message, group *storage.Group) error {
	body := getBody(evt)
	text := strings.TrimSpace(strings.TrimPrefix(body, "!fala"))

	// Fall back to quoted message text
	if text == "" {
		if msg := evt.Message; msg != nil {
			if ext := msg.GetExtendedTextMessage(); ext != nil {
				if ci := ext.GetContextInfo(); ci != nil {
					if quoted := ci.GetQuotedMessage(); quoted != nil {
						text = extractTextFromMsg(quoted)
					}
				}
			}
		}
	}

	if text == "" {
		return h.sender.SendText(ctx, evt.Info.Chat, "❌ Informe um texto ou responda a uma mensagem: !fala <texto>")
	}

	h.sender.SetTyping(ctx, evt.Info.Chat, true)
	defer h.sender.SetTyping(ctx, evt.Info.Chat, false)

	audioBytes, err := h.openai.TextToSpeech(ctx, text)
	if err != nil {
		_ = h.sender.SendText(ctx, evt.Info.Chat, "❌ Erro ao sintetizar fala: "+err.Error())
		return fmt.Errorf("fala: tts: %w", err)
	}

	if err := h.sender.SendAudio(ctx, evt.Info.Chat, audioBytes, "audio/mpeg"); err != nil {
		return fmt.Errorf("fala: send audio: %w", err)
	}

	_ = h.reqRepo.Save(ctx, storage.RequestRegister{
		GroupJID:  group.JID,
		AuthorJID: evt.Info.Sender.String(),
		ReqType:   storage.ReqAudio,
		CreatedAt: time.Now(),
	})
	return nil
}
