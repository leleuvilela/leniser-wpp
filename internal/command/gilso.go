package command

import (
	"context"
	"math/rand"
	"strings"

	"go.mau.fi/whatsmeow/types/events"

	"github.com/leleuvilela/leniser-wpp/internal/sender"
	"github.com/leleuvilela/leniser-wpp/internal/storage"
)

// gilsoJID is the hardcoded sender JID to target.
// Replace with the actual number@s.whatsapp.net when known.
const gilsoJID = "5511999999999@s.whatsapp.net"

// GilsoHandler probabilistically replies to a specific user.
type GilsoHandler struct {
	sender sender.MessageSender
}

// NewGilsoHandler creates a GilsoHandler.
func NewGilsoHandler(s sender.MessageSender) *GilsoHandler {
	return &GilsoHandler{sender: s}
}

func (h *GilsoHandler) Name() string               { return "gilso" }
func (h *GilsoHandler) BypassPermissionGate() bool { return true }

func (h *GilsoHandler) CanHandle(evt *events.Message, _ *storage.Group) bool {
	sender := evt.Info.Sender.String()
	// Match on user portion only
	parts := strings.Split(sender, "@")
	gilsoParts := strings.Split(gilsoJID, "@")
	return len(parts) > 0 && len(gilsoParts) > 0 &&
		parts[0] == gilsoParts[0] &&
		rand.Float64() < 0.15
}

func (h *GilsoHandler) Handle(ctx context.Context, evt *events.Message, _ *storage.Group) error {
	return h.sender.SendText(ctx, evt.Info.Chat, "🤖 cala boca seu corrupto")
}
