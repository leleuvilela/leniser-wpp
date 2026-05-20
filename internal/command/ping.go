package command

import (
	"context"
	"fmt"

	"go.mau.fi/whatsmeow/types/events"

	"github.com/leleuvilela/leniser-wpp/internal/sender"
	"github.com/leleuvilela/leniser-wpp/internal/storage"
)

// PingHandler replies to !ping with "{prefix} pong!".
// It bypasses the MESSAGE_CREATE permission gate.
type PingHandler struct {
	sender     sender.MessageSender
	configRepo storage.ConfigRepo
}

// NewPingHandler creates a PingHandler.
func NewPingHandler(s sender.MessageSender, configRepo storage.ConfigRepo) *PingHandler {
	return &PingHandler{sender: s, configRepo: configRepo}
}

func (h *PingHandler) Name() string              { return "ping" }
func (h *PingHandler) BypassPermissionGate() bool { return true }

func (h *PingHandler) CanHandle(evt *events.Message, _ *storage.Group) bool {
	return getBody(evt) == "!ping"
}

func (h *PingHandler) Handle(ctx context.Context, evt *events.Message, group *storage.Group) error {
	cfg, err := h.configRepo.Get(ctx)
	if err != nil {
		return fmt.Errorf("ping: get config: %w", err)
	}

	resolved := storage.ResolveConfig(cfg, group.Config)
	reply := resolved.BotPrefix + " pong!"

	return h.sender.SendText(ctx, evt.Info.Chat, reply)
}

// getBody extracts the plain text body from a message event.
func getBody(evt *events.Message) string {
	if evt.Message == nil {
		return ""
	}
	if b := evt.Message.GetConversation(); b != "" {
		return b
	}
	if ext := evt.Message.GetExtendedTextMessage(); ext != nil {
		return ext.GetText()
	}
	return ""
}
