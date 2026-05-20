package storage

import (
	"context"
	"time"
)

// --- Permission ---

// Permission represents a capability flag that can be granted to a group.
type Permission string

const (
	PermMessageCreate Permission = "MESSAGE_CREATE"
	PermSaveMessage   Permission = "SAVE_MESSAGE"
	PermMessageRevoke Permission = "MESSAGE_REVOKE"
)

// --- RequestType ---

// RequestType categorises AI-powered command invocations for audit logging.
type RequestType string

const (
	ReqText  RequestType = "TEXT"
	ReqImage RequestType = "IMAGE"
	ReqAudio RequestType = "AUDIO"
	ReqMeme  RequestType = "MEME"
)

// --- Domain types ---

// Config holds global bot configuration defaults.
type Config struct {
	BotPrefix            string
	SystemPrompt         string
	ImageCooldownEnabled bool
	ImageCooldownMinutes int
	UpdatedAt            time.Time
}

// GroupConfig holds per-group overrides of the global Config.
// Nil pointer fields mean "inherit from global".
type GroupConfig struct {
	GroupJID             string
	BotPrefix            *string
	SystemPrompt         *string
	ImageCooldownEnabled *bool
	ImageCooldownMinutes *int
	UpdatedAt            time.Time
}

// Group represents a WhatsApp group registered with the bot.
type Group struct {
	JID         string
	Name        string
	Permissions []Permission
	Config      *GroupConfig // nil = use global defaults
	CreatedAt   time.Time
	UpdatedAt   time.Time
}

// GroupMember maps a WhatsApp user JID to a display name within a group.
type GroupMember struct {
	GroupJID  string
	UserJID   string
	Name      string
	UpdatedAt time.Time
}

// MessageRecord is a normalised snapshot of an incoming message for analytics.
// The full message body is NOT stored here (FR-023/FR-025).
type MessageRecord struct {
	ID             string
	GroupJID       string
	AuthorJID      string
	MessageType    string
	HasMedia       bool
	IsForwarded    bool
	CharacterCount int
	Day            string // "YYYY-MM-DD" in UTC-3; primary aggregation key
	TimestampUTC   time.Time
	TimestampLocal time.Time
	RecordedAt     time.Time
}

// RequestRegister is an audit log entry for a successful AI command invocation.
type RequestRegister struct {
	ID        string
	GroupJID  string
	AuthorJID string
	ReqType   RequestType
	CreatedAt time.Time
}

// AuthorCount holds aggregated message count for a single author.
type AuthorCount struct {
	AuthorJID string
	Name      string
	Count     int
}

// DayCount holds aggregated message count for a single calendar day.
type DayCount struct {
	Date  string // "YYYY-MM-DD"
	Count int
}

// --- Repository interfaces ---

// GroupRepo manages group records, permissions, per-group config, and members.
type GroupRepo interface {
	Get(ctx context.Context, jid string) (*Group, error)
	Upsert(ctx context.Context, g *Group) error
	List(ctx context.Context) ([]*Group, error)
	Delete(ctx context.Context, jid string) error

	GetPermissions(ctx context.Context, jid string) ([]Permission, error)
	SetPermissions(ctx context.Context, jid string, perms []Permission) error
	HasPermission(ctx context.Context, jid string, perm Permission) (bool, error)

	GetConfig(ctx context.Context, jid string) (*GroupConfig, error)
	SetConfig(ctx context.Context, cfg GroupConfig) error

	GetMembers(ctx context.Context, jid string) ([]*GroupMember, error)
	UpsertMember(ctx context.Context, m GroupMember) error
}

// MessageRepo manages stored message records used for statistics.
type MessageRepo interface {
	Save(ctx context.Context, r MessageRecord) error
	CountByAuthor(ctx context.Context, groupJID string, from, to time.Time) ([]AuthorCount, error)
	CountByDay(ctx context.Context, groupJID string) ([]DayCount, error)
	ListRecent(ctx context.Context, groupJID string, limit int) ([]*MessageRecord, error)
}

// ConfigRepo manages the single global configuration row.
type ConfigRepo interface {
	Get(ctx context.Context) (Config, error)
	Set(ctx context.Context, c Config) error
}

// ReqRegisterRepo manages AI request audit logs.
type ReqRegisterRepo interface {
	Save(ctx context.Context, r RequestRegister) error
	LastByGroup(ctx context.Context, groupJID string, t RequestType) (*RequestRegister, error)
	LastByAuthor(ctx context.Context, authorJID string, t RequestType) (*RequestRegister, error)
}
