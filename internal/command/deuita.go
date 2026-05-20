package command

import (
	"context"
	"strings"

	"go.mau.fi/whatsmeow/types/events"

	"github.com/leleuvilela/leniser-wpp/internal/sender"
	"github.com/leleuvilela/leniser-wpp/internal/storage"
)

// DeuitaHandler auto-replies to messages containing "deuita".
type DeuitaHandler struct {
	sender sender.MessageSender
}

// NewDeuitaHandler creates a DeuitaHandler.
func NewDeuitaHandler(s sender.MessageSender) *DeuitaHandler {
	return &DeuitaHandler{sender: s}
}

func (h *DeuitaHandler) Name() string               { return "deuita" }
func (h *DeuitaHandler) BypassPermissionGate() bool { return false }

func (h *DeuitaHandler) CanHandle(evt *events.Message, _ *storage.Group) bool {
	return strings.Contains(strings.ToLower(getBody(evt)), "deuita")
}

func (h *DeuitaHandler) Handle(ctx context.Context, evt *events.Message, _ *storage.Group) error {
	return h.sender.SendText(ctx, evt.Info.Chat, "🤖 pau no cu do deuita")
}
