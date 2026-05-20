package command

import (
	"context"
	"fmt"
	"strings"
	"time"

	waProto "go.mau.fi/whatsmeow/proto/waE2E"
	"go.mau.fi/whatsmeow/types/events"

	"github.com/leleuvilela/leniser-wpp/internal/sender"
	"github.com/leleuvilela/leniser-wpp/internal/service"
	"github.com/leleuvilela/leniser-wpp/internal/storage"
)

// BotHandler processes !bot [prompt] commands using the OpenAI chat API.
type BotHandler struct {
	sender     sender.MessageSender
	openai     *service.OpenAIService
	configRepo storage.ConfigRepo
	reqRepo    storage.ReqRegisterRepo
	waClient   mediaDownloader
}

// mediaDownloader abstracts whatsmeow's media download capability.
type mediaDownloader interface {
	Download(ctx context.Context, msg interface{}) ([]byte, error)
}

// NewBotHandler creates a BotHandler.
func NewBotHandler(
	s sender.MessageSender,
	openai *service.OpenAIService,
	configRepo storage.ConfigRepo,
	reqRepo storage.ReqRegisterRepo,
) *BotHandler {
	return &BotHandler{
		sender:     s,
		openai:     openai,
		configRepo: configRepo,
		reqRepo:    reqRepo,
	}
}

func (h *BotHandler) Name() string               { return "bot" }
func (h *BotHandler) BypassPermissionGate() bool { return false }

func (h *BotHandler) CanHandle(evt *events.Message, _ *storage.Group) bool {
	return strings.HasPrefix(getBody(evt), "!bot")
}

func (h *BotHandler) Handle(ctx context.Context, evt *events.Message, group *storage.Group) error {
	body := getBody(evt)
	prompt := strings.TrimSpace(strings.TrimPrefix(body, "!bot"))

	cfg, err := h.configRepo.Get(ctx)
	if err != nil {
		return fmt.Errorf("bot: get config: %w", err)
	}
	resolved := storage.ResolveConfig(cfg, group.Config)

	// Build message chain from quoted context
	msgs := h.buildChain(ctx, evt.Message, prompt)

	h.sender.SetTyping(ctx, evt.Info.Chat, true)
	defer h.sender.SetTyping(ctx, evt.Info.Chat, false)

	reply, err := h.openai.Chat(ctx, resolved.SystemPrompt, msgs)
	if err != nil {
		_ = h.sender.SendText(ctx, evt.Info.Chat, "❌ Erro ao consultar IA: "+err.Error())
		return fmt.Errorf("bot: chat: %w", err)
	}

	if err := h.sender.SendText(ctx, evt.Info.Chat, reply); err != nil {
		return fmt.Errorf("bot: send reply: %w", err)
	}

	_ = h.reqRepo.Save(ctx, storage.RequestRegister{
		GroupJID:  group.JID,
		AuthorJID: evt.Info.Sender.String(),
		ReqType:   storage.ReqText,
		CreatedAt: time.Now(),
	})
	return nil
}

// buildChain assembles ChatMessages from the quoted reply chain + current prompt.
func (h *BotHandler) buildChain(ctx context.Context, msg *waProto.Message, currentPrompt string) []service.ChatMessage {
	var chain []service.ChatMessage

	// Walk the quoted message if present
	if msg != nil {
		var ci *waProto.ContextInfo
		if ext := msg.GetExtendedTextMessage(); ext != nil {
			ci = ext.GetContextInfo()
		}
		if ci != nil {
			if quoted := ci.GetQuotedMessage(); quoted != nil {
				quotedText := extractTextFromMsg(quoted)
				if quotedText != "" {
					chain = append(chain, service.ChatMessage{Role: "user", Content: quotedText})
				}
			}
		}
	}

	if currentPrompt != "" {
		chain = append(chain, service.ChatMessage{Role: "user", Content: currentPrompt})
	}

	return chain
}

// extractTextFromMsg gets plain text from any message type.
func extractTextFromMsg(msg *waProto.Message) string {
	if msg == nil {
		return ""
	}
	if t := msg.GetConversation(); t != "" {
		return t
	}
	if ext := msg.GetExtendedTextMessage(); ext != nil {
		return ext.GetText()
	}
	if img := msg.GetImageMessage(); img != nil && img.GetCaption() != "" {
		return img.GetCaption()
	}
	return ""
}
