package command

import (
	"context"
	"fmt"
	"strings"
	"time"

	"go.mau.fi/whatsmeow/types/events"

	"github.com/leleuvilela/leniser-wpp/internal/sender"
	"github.com/leleuvilela/leniser-wpp/internal/storage"
)

var ptWeekdays = []string{"Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"}

// MsgsDiaHandler processes !msgsdia commands.
type MsgsDiaHandler struct {
	sender  sender.MessageSender
	msgRepo storage.MessageRepo
}

// NewMsgsDiaHandler creates a MsgsDiaHandler.
func NewMsgsDiaHandler(s sender.MessageSender, msgRepo storage.MessageRepo) *MsgsDiaHandler {
	return &MsgsDiaHandler{sender: s, msgRepo: msgRepo}
}

func (h *MsgsDiaHandler) Name() string               { return "msgsdia" }
func (h *MsgsDiaHandler) BypassPermissionGate() bool { return false }

func (h *MsgsDiaHandler) CanHandle(evt *events.Message, _ *storage.Group) bool {
	return strings.HasPrefix(getBody(evt), "!msgsdia")
}

func (h *MsgsDiaHandler) Handle(ctx context.Context, evt *events.Message, group *storage.Group) error {
	counts, err := h.msgRepo.CountByDay(ctx, group.JID)
	if err != nil {
		return fmt.Errorf("msgsdia: count: %w", err)
	}
	if len(counts) == 0 {
		return h.sender.SendText(ctx, evt.Info.Chat, "ℹ️ Nenhuma mensagem registrada.")
	}

	var sb strings.Builder
	sb.WriteString("📅 *Mensagens por dia*\n\n")

	for _, c := range counts {
		// Parse weekday from YYYY-MM-DD using time.Parse
		t, err := time.ParseInLocation("2006-01-02", c.Date, utcMinus3)
		weekdayLabel := c.Date
		if err == nil {
			weekdayLabel = ptWeekdays[int(t.Weekday())] + " " + c.Date
		}
		sb.WriteString(fmt.Sprintf("%s — %d msgs\n", weekdayLabel, c.Count))
	}

	return h.sender.SendText(ctx, evt.Info.Chat, sb.String())
}
