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

// RankingHandler processes !ranking [period] [graph] commands.
type RankingHandler struct {
	sender    sender.MessageSender
	msgRepo   storage.MessageRepo
	groupRepo storage.GroupRepo
}

// NewRankingHandler creates a RankingHandler.
func NewRankingHandler(s sender.MessageSender, msgRepo storage.MessageRepo, groupRepo storage.GroupRepo) *RankingHandler {
	return &RankingHandler{sender: s, msgRepo: msgRepo, groupRepo: groupRepo}
}

func (h *RankingHandler) Name() string               { return "ranking" }
func (h *RankingHandler) BypassPermissionGate() bool { return false }

func (h *RankingHandler) CanHandle(evt *events.Message, _ *storage.Group) bool {
	return strings.HasPrefix(getBody(evt), "!ranking")
}

var utcMinus3 = time.FixedZone("UTC-3", -3*60*60)

func (h *RankingHandler) Handle(ctx context.Context, evt *events.Message, group *storage.Group) error {
	args := strings.Fields(strings.TrimPrefix(getBody(evt), "!ranking"))

	var from, to time.Time
	now := time.Now().In(utcMinus3)
	showGraph := false

	for _, a := range args {
		switch strings.ToLower(a) {
		case "graph", "grafico", "gráfico":
			showGraph = true
		case "dia":
			from = time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, utcMinus3)
			to = from.Add(24 * time.Hour)
		case "semana":
			weekday := int(now.Weekday())
			from = now.AddDate(0, 0, -weekday)
			from = time.Date(from.Year(), from.Month(), from.Day(), 0, 0, 0, 0, utcMinus3)
			to = from.AddDate(0, 0, 7)
		case "mes", "mês":
			from = time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, utcMinus3)
			to = from.AddDate(0, 1, 0)
		}
	}
	// all-time: from/to zero values → repo handles it

	counts, err := h.msgRepo.CountByAuthor(ctx, group.JID, from, to)
	if err != nil {
		return fmt.Errorf("ranking: count: %w", err)
	}
	if len(counts) == 0 {
		return h.sender.SendText(ctx, evt.Info.Chat, "ℹ️ Nenhuma mensagem registrada.")
	}

	// Resolve member names
	members, _ := h.groupRepo.GetMembers(ctx, group.JID)
	nameMap := make(map[string]string)
	for _, m := range members {
		nameMap[m.UserJID] = m.Name
	}

	total := 0
	for _, c := range counts {
		total += c.Count
	}

	var sb strings.Builder
	sb.WriteString("🏆 *Ranking de mensagens*\n\n")

	maxCount := counts[0].Count
	for i, c := range counts {
		name := nameMap[c.AuthorJID]
		if name == "" {
			parts := strings.Split(c.AuthorJID, "@")
			name = parts[0]
		}
		pct := 0.0
		if total > 0 {
			pct = float64(c.Count) / float64(total) * 100
		}
		line := fmt.Sprintf("%d. %s — %d msgs (%.1f%%)", i+1, name, c.Count, pct)
		if showGraph && maxCount > 0 {
			bars := int(float64(c.Count) / float64(maxCount) * 30)
			line += " " + strings.Repeat("█", bars)
		}
		sb.WriteString(line + "\n")
	}

	return h.sender.SendText(ctx, evt.Info.Chat, sb.String())
}
