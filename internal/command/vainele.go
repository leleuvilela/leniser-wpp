package command

import (
	"context"

	"go.mau.fi/whatsmeow/types/events"

	"github.com/leleuvilela/leniser-wpp/internal/sender"
	"github.com/leleuvilela/leniser-wpp/internal/storage"
)

// VaiNeleHandler sends the vai nele poll (!vainele).
type VaiNeleHandler struct {
	sender sender.MessageSender
}

// NewVaiNeleHandler creates a VaiNeleHandler.
func NewVaiNeleHandler(s sender.MessageSender) *VaiNeleHandler {
	return &VaiNeleHandler{sender: s}
}

func (h *VaiNeleHandler) Name() string               { return "vainele" }
func (h *VaiNeleHandler) BypassPermissionGate() bool { return false }

func (h *VaiNeleHandler) CanHandle(evt *events.Message, _ *storage.Group) bool {
	return getBody(evt) == "!vainele"
}

func (h *VaiNeleHandler) Handle(ctx context.Context, evt *events.Message, _ *storage.Group) error {
	return h.sender.SendPoll(ctx, evt.Info.Chat,
		"Vai nele? 🤔",
		[]string{"Sim", "Não", "Tal tal"},
	)
}
