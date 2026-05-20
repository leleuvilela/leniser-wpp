package command

import (
	"context"

	"go.mau.fi/whatsmeow/types/events"

	"github.com/leleuvilela/leniser-wpp/internal/storage"
)

// Handler is the interface every bot command must implement.
type Handler interface {
	// CanHandle returns true if this handler should process the event.
	// Must be fast (no I/O); used in the dispatch loop.
	CanHandle(evt *events.Message, group *storage.Group) bool

	// Handle processes the event. User-facing errors are sent as WhatsApp
	// replies; only unexpected/infrastructure errors are returned here.
	Handle(ctx context.Context, evt *events.Message, group *storage.Group) error

	// Name returns a short identifier used in structured log entries.
	Name() string

	// BypassPermissionGate returns true for handlers that do not require
	// the group to have MESSAGE_CREATE permission (e.g. !ping).
	BypassPermissionGate() bool
}

// Registry holds all registered command handlers and dispatches incoming
// events to the first matching handler (or all, for substring matchers).
type Registry struct {
	handlers []Handler
}

// NewRegistry creates an empty Registry.
func NewRegistry() *Registry {
	return &Registry{}
}

// Register appends one or more handlers to the registry.
func (r *Registry) Register(handlers ...Handler) {
	r.handlers = append(r.handlers, handlers...)
}

// Handlers returns the ordered slice of registered handlers.
// Used by Dispatcher for gate-filtered iteration.
func (r *Registry) Handlers() []Handler {
	return r.handlers
}

// Dispatch calls Handle on every handler whose CanHandle returns true.
// It returns the name of the first handler that matched, or "" if none did.
// It does NOT short-circuit — all matching handlers run.
func (r *Registry) Dispatch(ctx context.Context, evt *events.Message, group *storage.Group) (matched string, err error) {
	for _, h := range r.handlers {
		if !h.CanHandle(evt, group) {
			continue
		}
		if matched == "" {
			matched = h.Name()
		}
		if herr := h.Handle(ctx, evt, group); herr != nil {
			err = herr // keep last error; caller logs it
		}
	}
	return matched, err
}
