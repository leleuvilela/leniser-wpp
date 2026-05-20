package command

import (
	"context"
	"strings"

	"go.mau.fi/whatsmeow/types/events"

	"github.com/leleuvilela/leniser-wpp/internal/sender"
	"github.com/leleuvilela/leniser-wpp/internal/storage"
)

// AaHandler replies with AA hotline information.
type AaHandler struct {
	sender sender.MessageSender
}

// NewAaHandler creates an AaHandler.
func NewAaHandler(s sender.MessageSender) *AaHandler {
	return &AaHandler{sender: s}
}

func (h *AaHandler) Name() string               { return "aa" }
func (h *AaHandler) BypassPermissionGate() bool { return false }

func (h *AaHandler) CanHandle(evt *events.Message, _ *storage.Group) bool {
	return strings.TrimSpace(getBody(evt)) == "!aa"
}

func (h *AaHandler) Handle(ctx context.Context, evt *events.Message, _ *storage.Group) error {
	msg := `🆘 *Alcoólicos Anônimos (AA)*

Precisa de ajuda? Ligue agora:
📞 *0800-725-6366* (gratuito, 24h)

🌐 Site oficial: https://www.aa.org.br

Você não está sozinho(a). O AA pode ajudar.`
	return h.sender.SendText(ctx, evt.Info.Chat, msg)
}
