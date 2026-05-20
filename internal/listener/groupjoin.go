package listener

import (
	"context"
	"fmt"
	"os"
	"time"

	"go.mau.fi/whatsmeow/types/events"

	"github.com/leleuvilela/leniser-wpp/internal/storage"
)

// GroupJoinListener handles *events.GroupInfo events for new group joins.
type GroupJoinListener struct {
	groupRepo storage.GroupRepo
}

// NewGroupJoinListener creates a GroupJoinListener.
func NewGroupJoinListener(groupRepo storage.GroupRepo) *GroupJoinListener {
	return &GroupJoinListener{groupRepo: groupRepo}
}

// HandleEvent processes raw whatsmeow events; pass it to AddEventHandler.
func (l *GroupJoinListener) HandleEvent(rawEvt any) {
	evt, ok := rawEvt.(*events.GroupInfo)
	if !ok {
		return
	}
	if len(evt.Join) == 0 {
		return
	}

	ctx := context.Background()
	jid := evt.JID.String()

	g := &storage.Group{
		JID:         jid,
		Name:        evt.Name.Name,
		Permissions: []storage.Permission{},
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}
	if err := l.groupRepo.Upsert(ctx, g); err != nil {
		fmt.Fprintf(os.Stderr, "[groupjoin] upsert %s: %v\n", jid, err)
		return
	}
	fmt.Fprintf(os.Stderr, "[groupjoin] registered new group %s (%s)\n", jid, g.Name)
}
