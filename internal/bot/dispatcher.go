package bot

import (
	"context"
	"fmt"
	"runtime/debug"
	"strings"
	"time"

	"go.mau.fi/whatsmeow/types"
	"go.mau.fi/whatsmeow/types/events"

	"github.com/leleuvilela/leniser-wpp/internal/command"
	"github.com/leleuvilela/leniser-wpp/internal/storage"
)

// eventLog is the structured log entry emitted per dispatch (FR-024).
// Kept unexported as an alias; callers use LogEvent.
type eventLog = EventLog

// Dispatcher wraps Registry with panic recovery, replay filtering, and
// message-persistence for SAVE_MESSAGE groups.
type Dispatcher struct {
	registry  *command.Registry
	groupRepo storage.GroupRepo
	msgRepo   storage.MessageRepo
	botJID    types.JID
}

// NewDispatcher creates a Dispatcher backed by the given registry and repos.
func NewDispatcher(
	registry *command.Registry,
	groupRepo storage.GroupRepo,
	msgRepo storage.MessageRepo,
	botJID types.JID,
) *Dispatcher {
	return &Dispatcher{
		registry:  registry,
		groupRepo: groupRepo,
		msgRepo:   msgRepo,
		botJID:    botJID,
	}
}

// HandleEvent is the whatsmeow AddEventHandler callback.
func (d *Dispatcher) HandleEvent(rawEvt any) {
	switch evt := rawEvt.(type) {
	case *events.Message:
		d.handleMessage(evt)
	}
}

// replayThreshold: messages older than this are considered replays and discarded.
const replayThreshold = 20 * time.Second

func (d *Dispatcher) handleMessage(evt *events.Message) {
	ctx := context.Background()

	// FR-023: discard replayed messages
	if time.Since(evt.Info.Timestamp) > replayThreshold {
		return
	}

	// Only handle group messages
	if evt.Info.Chat.Server != types.GroupServer {
		return
	}

	groupJID := evt.Info.Chat.String()

	// Load group — if not registered, ignore
	group, err := d.groupRepo.Get(ctx, groupJID)
	if err != nil || group == nil {
		return
	}

	// Upsert member push name if available
	if evt.Info.PushName != "" {
		_ = d.groupRepo.UpsertMember(ctx, storage.GroupMember{
			GroupJID:  groupJID,
			UserJID:   evt.Info.Sender.String(),
			Name:      evt.Info.PushName,
			UpdatedAt: time.Now(),
		})
	}

	// MESSAGE_CREATE permission gate (handlers that BypassPermissionGate skip this)
	hasCreate := false
	for _, p := range group.Permissions {
		if p == storage.PermMessageCreate {
			hasCreate = true
			break
		}
	}

	// Message persistence (T067): save record if SAVE_MESSAGE permission granted
	if d.hasPermission(group, storage.PermSaveMessage) {
		d.persistMessage(ctx, evt, group)
	}

	// Build a filtered view for dispatch — pass only to handlers that either
	// bypass the gate or the group has MESSAGE_CREATE.
	if !hasCreate {
		// Still dispatch to bypass-gate handlers by temporarily restricting
		// We rebuild the group permissions slice stripping MESSAGE_CREATE.
		// Simpler: just check per-handler inside dispatch. Instead we pass
		// the group as-is and let handlers decide. However, the task spec
		// says the Dispatcher should enforce the gate. We do it here:
		// non-bypass handlers won't see this dispatch at all.
		d.dispatchFiltered(ctx, evt, group, false)
		return
	}

	d.dispatchFiltered(ctx, evt, group, true)
}

// dispatchFiltered runs handlers, respecting the MESSAGE_CREATE gate.
// If hasCreate is false, only bypass-gate handlers are called.
func (d *Dispatcher) dispatchFiltered(
	ctx context.Context,
	evt *events.Message,
	group *storage.Group,
	hasCreate bool,
) {
	for _, h := range d.registry.Handlers() {
		if !hasCreate && !h.BypassPermissionGate() {
			continue
		}
		if !h.CanHandle(evt, group) {
			continue
		}
		d.invokeHandler(ctx, evt, group, h)
	}
}

// invokeHandler calls a single handler with panic recovery and FR-024 logging.
func (d *Dispatcher) invokeHandler(
	ctx context.Context,
	evt *events.Message,
	group *storage.Group,
	h command.Handler,
) {
	start := time.Now()
	correlationID := evt.Info.ID

	defer func() {
		if r := recover(); r != nil {
			stack := string(debug.Stack())
			LogEvent(eventLog{
				CorrelationID: correlationID,
				HandlerName:   h.Name(),
				Outcome:       "panic",
				LatencyMs:     time.Since(start).Milliseconds(),
				Error:         fmt.Sprintf("%v\n%s", r, stack),
			})
		}
	}()

	herr := h.Handle(ctx, evt, group)
	outcome := "ok"
	errStr := ""
	if herr != nil {
		outcome = "error"
		errStr = herr.Error()
	}

	LogEvent(eventLog{
		CorrelationID: correlationID,
		HandlerName:   h.Name(),
		Outcome:       outcome,
		LatencyMs:     time.Since(start).Milliseconds(),
		Error:         errStr,
	})
}

func (d *Dispatcher) hasPermission(group *storage.Group, perm storage.Permission) bool {
	for _, p := range group.Permissions {
		if p == perm {
			return true
		}
	}
	return false
}

func (d *Dispatcher) persistMessage(ctx context.Context, evt *events.Message, group *storage.Group) {
	msg := evt.Message
	if msg == nil {
		return
	}

	msgType := "text"
	hasMedia := false
	body := ""

	if msg.GetConversation() != "" {
		body = msg.GetConversation()
	} else if ext := msg.GetExtendedTextMessage(); ext != nil {
		body = ext.GetText()
	} else if msg.GetImageMessage() != nil {
		msgType = "image"
		hasMedia = true
		body = msg.GetImageMessage().GetCaption()
	} else if msg.GetVideoMessage() != nil {
		msgType = "video"
		hasMedia = true
	} else if msg.GetAudioMessage() != nil {
		msgType = "audio"
		hasMedia = true
	} else if msg.GetDocumentMessage() != nil {
		msgType = "document"
		hasMedia = true
	} else if msg.GetStickerMessage() != nil {
		msgType = "sticker"
		hasMedia = true
	}

	// UTC-3 day string
	loc := time.FixedZone("UTC-3", -3*60*60)
	local := evt.Info.Timestamp.In(loc)
	day := local.Format("2006-01-02")

	isForwarded := false // forwarding detection deferred
	_ = isForwarded

	charCount := len([]rune(strings.TrimSpace(body)))

	_ = d.msgRepo.Save(ctx, storage.MessageRecord{
		ID:             evt.Info.ID,
		GroupJID:       group.JID,
		AuthorJID:      evt.Info.Sender.String(),
		MessageType:    msgType,
		HasMedia:       hasMedia,
		IsForwarded:    false,
		CharacterCount: charCount,
		Day:            day,
		TimestampUTC:   evt.Info.Timestamp.UTC(),
		TimestampLocal: local,
		RecordedAt:     time.Now(),
	})
}
