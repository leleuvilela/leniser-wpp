package command

import (
	"context"

	"go.mau.fi/whatsmeow/types/events"

	"github.com/leleuvilela/leniser-wpp/internal/sender"
	"github.com/leleuvilela/leniser-wpp/internal/storage"
)

// ChecagemHandler sends the checagem poll (!checagem).
type ChecagemHandler struct {
	sender sender.MessageSender
}

// NewChecagemHandler creates a ChecagemHandler.
func NewChecagemHandler(s sender.MessageSender) *ChecagemHandler {
	return &ChecagemHandler{sender: s}
}

func (h *ChecagemHandler) Name() string               { return "checagem" }
func (h *ChecagemHandler) BypassPermissionGate() bool { return false }

func (h *ChecagemHandler) CanHandle(evt *events.Message, _ *storage.Group) bool {
	return getBody(evt) == "!checagem"
}

func (h *ChecagemHandler) Handle(ctx context.Context, evt *events.Message, _ *storage.Group) error {
	return h.sender.SendPoll(ctx, evt.Info.Chat,
		"🍆🍆🍆 CHECAGEM DA PEÇA NO GRUPO 🍆🍆🍆",
		[]string{"MOLE", "MEIA BOMBA", "DURA", "TOMEI UM TADALA"},
	)
}
