package listener

import (
	"context"
	"fmt"
	"strings"

	waProto "go.mau.fi/whatsmeow/proto/waE2E"
	"go.mau.fi/whatsmeow/types/events"

	"github.com/leleuvilela/leniser-wpp/internal/sender"
	"github.com/leleuvilela/leniser-wpp/internal/storage"
)

// RevokeListener handles message-revoke protocol events (US16).
type RevokeListener struct {
	groupRepo storage.GroupRepo
	sender    sender.MessageSender
	msgStore  messageStore
}

// messageStore is a minimal interface to look up original message text.
// For now we use the in-memory body carried in the revoke event itself
// (whatsmeow does not re-deliver the original body on revoke).
type messageStore interface{}

// NewRevokeListener creates a RevokeListener.
func NewRevokeListener(groupRepo storage.GroupRepo, s sender.MessageSender) *RevokeListener {
	return &RevokeListener{groupRepo: groupRepo, sender: s}
}

// HandleEvent processes raw whatsmeow events for revoke protocol messages.
func (l *RevokeListener) HandleEvent(rawEvt any) {
	evt, ok := rawEvt.(*events.Message)
	if !ok {
		return
	}

	// Check if this is a revoke protocol message
	pm := evt.Message.GetProtocolMessage()
	if pm == nil {
		return
	}
	if pm.GetType() != waProto.ProtocolMessage_REVOKE {
		return
	}

	ctx := context.Background()
	groupJID := evt.Info.Chat.String()

	group, err := l.groupRepo.Get(ctx, groupJID)
	if err != nil || group == nil {
		return
	}

	// Check MESSAGE_REVOKE permission
	hasRevoke := false
	for _, p := range group.Permissions {
		if p == storage.PermMessageRevoke {
			hasRevoke = true
			break
		}
	}
	if !hasRevoke {
		return
	}

	// Get original message key info
	key := pm.GetKey()
	if key == nil {
		return
	}
	origSender := key.GetParticipant()
	if origSender == "" {
		origSender = evt.Info.Sender.String()
	}
	// Extract the number portion
	parts := strings.Split(origSender, "@")
	number := parts[0]

	text := fmt.Sprintf("🗑️ @%s apagou uma mensagem.", number)
	_ = l.sender.SendTextMention(ctx, evt.Info.Chat, text, []string{origSender})
}
