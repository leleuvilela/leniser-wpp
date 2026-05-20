# Data Model: Leniser WhatsApp Bot (Go Rewrite)

**Feature**: `001-whatsapp-bot-functional-spec`
**Date**: 2026-05-19
**Storage**: SQLite (`bot.db`) — application tables only.
whatsmeow session tables (`whatsmeow_*`) are managed by the library's own
`sqlstore` and share the same database file.

---

## Entity Overview

```
Config (1) ─────────────────── global defaults
Group (1) ──── has ──── Permission[] (N)
Group (1) ──── has ──── GroupConfig (0..1) — overrides Config defaults
Group (1) ──── has ──── GroupMember[] (N)
Group (1) ──── has ──── MessageRecord[] (N)
Group (1) ──── has ──── RequestRegister[] (N)
User  ──────── has ──── RequestRegister[] (N) (via author_jid)
```

---

## 1. Config

Global defaults. Exactly **one** row in the table (`id = 1`).
Updated via `PUT /api/v1/config`.

### SQL

```sql
CREATE TABLE config (
    id                      INTEGER PRIMARY KEY CHECK (id = 1),
    bot_prefix              TEXT    NOT NULL DEFAULT '🤖',
    system_prompt           TEXT    NOT NULL DEFAULT '',
    image_cooldown_enabled  INTEGER NOT NULL DEFAULT 0,  -- BOOLEAN
    image_cooldown_minutes  INTEGER NOT NULL DEFAULT 60,
    updated_at              TEXT    NOT NULL DEFAULT (datetime('now'))
);
```

### Go type

```go
// internal/storage/repository.go
type Config struct {
    BotPrefix              string
    SystemPrompt           string
    ImageCooldownEnabled   bool
    ImageCooldownMinutes   int
    UpdatedAt              time.Time
}
```

**Validation rules**:
- `bot_prefix`: non-empty string, max 10 characters.
- `image_cooldown_minutes`: 1–1440 (1 minute to 24 hours).

---

## 2. Group

Represents a WhatsApp group or direct chat registered with the bot.
Created automatically on `*events.GroupInfo` join event (FR-017).

### SQL

```sql
CREATE TABLE groups (
    jid         TEXT    PRIMARY KEY,   -- e.g. "120363...@g.us"
    name        TEXT    NOT NULL DEFAULT '',
    created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);
```

### Go type

```go
type Group struct {
    JID       string    // primary key, WhatsApp JID format
    Name      string
    CreatedAt time.Time
    UpdatedAt time.Time
}
```

**Uniqueness**: `jid` is globally unique (WhatsApp guarantees this).

**Lifecycle**:
1. `Created` — on `GroupJoin` event; permissions array is empty.
2. `Active` — after an operator grants at least one permission.
3. `Suspended` — permissions revoked; bot still stores the record.

---

## 3. Permission

A capability flag granted to a group. Stored as a join table so the set of
granted permissions is a variable-length list.

### Permission types

| Constant | Value | Meaning |
|---|---|---|
| `PermMessageCreate` | `"MESSAGE_CREATE"` | Group members may invoke bot commands |
| `PermSaveMessage` | `"SAVE_MESSAGE"` | Incoming messages are persisted for stats |
| `PermMessageRevoke` | `"MESSAGE_REVOKE"` | Deleted-message disclosure is active |

### SQL

```sql
CREATE TABLE group_permissions (
    group_jid   TEXT    NOT NULL REFERENCES groups(jid) ON DELETE CASCADE,
    permission  TEXT    NOT NULL,
    granted_at  TEXT    NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (group_jid, permission)
);
```

### Go type

```go
type Permission string

const (
    PermMessageCreate Permission = "MESSAGE_CREATE"
    PermSaveMessage   Permission = "SAVE_MESSAGE"
    PermMessageRevoke Permission = "MESSAGE_REVOKE"
)
```

---

## 4. GroupConfig

Per-group overrides of global `Config` defaults. All fields are nullable —
`NULL` means "use global default". At most one row per group.

### SQL

```sql
CREATE TABLE group_configs (
    group_jid               TEXT    PRIMARY KEY REFERENCES groups(jid) ON DELETE CASCADE,
    bot_prefix              TEXT,   -- NULL = use global
    system_prompt           TEXT,   -- NULL = use global
    image_cooldown_enabled  INTEGER,-- NULL = use global
    image_cooldown_minutes  INTEGER,-- NULL = use global
    updated_at              TEXT    NOT NULL DEFAULT (datetime('now'))
);
```

### Go type

```go
type GroupConfig struct {
    GroupJID               string
    BotPrefix              *string  // nil = inherit
    SystemPrompt           *string
    ImageCooldownEnabled   *bool
    ImageCooldownMinutes   *int
    UpdatedAt              time.Time
}
```

**Resolution pattern** (used by all command handlers):

```go
func ResolveConfig(global Config, override *GroupConfig) Config {
    if override == nil { return global }
    out := global
    if override.BotPrefix != nil            { out.BotPrefix = *override.BotPrefix }
    if override.SystemPrompt != nil         { out.SystemPrompt = *override.SystemPrompt }
    if override.ImageCooldownEnabled != nil { out.ImageCooldownEnabled = *override.ImageCooldownEnabled }
    if override.ImageCooldownMinutes != nil { out.ImageCooldownMinutes = *override.ImageCooldownMinutes }
    return out
}
```

---

## 5. GroupMember

Maps a WhatsApp user's JID (phone number prefix) to a display name within a
specific group. Used to humanise ranking and summary output (FR-009, FR-008).

### SQL

```sql
CREATE TABLE group_members (
    group_jid   TEXT    NOT NULL REFERENCES groups(jid) ON DELETE CASCADE,
    user_jid    TEXT    NOT NULL,  -- e.g. "5511...@s.whatsapp.net"
    name        TEXT    NOT NULL DEFAULT '',
    updated_at  TEXT    NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (group_jid, user_jid)
);
```

### Go type

```go
type GroupMember struct {
    GroupJID  string
    UserJID   string
    Name      string
    UpdatedAt time.Time
}
```

**Update strategy**: upserted (INSERT OR REPLACE) whenever the bot receives a
message from a user in a group whose display name we can resolve from the
`*events.Message` event's `PushName` field.

---

## 6. MessageRecord

A normalised snapshot of each incoming message in groups with `SAVE_MESSAGE`
permission. Used exclusively for statistics (ranking, daily counts, summary).
The full message body is **not** stored here (FR-023 / FR-025).

### SQL

```sql
CREATE TABLE message_records (
    id                  TEXT    PRIMARY KEY,  -- message ID from WhatsApp
    group_jid           TEXT    NOT NULL REFERENCES groups(jid) ON DELETE CASCADE,
    author_jid          TEXT    NOT NULL,     -- sender's JID; empty string for bot messages
    message_type        TEXT    NOT NULL,     -- "chat", "image", "audio", "video", etc.
    has_media           INTEGER NOT NULL DEFAULT 0,
    is_forwarded        INTEGER NOT NULL DEFAULT 0,
    character_count     INTEGER NOT NULL DEFAULT 0,
    day                 TEXT    NOT NULL,     -- "YYYY-MM-DD" in UTC-3; partition key for stats
    timestamp_utc       INTEGER NOT NULL,     -- Unix seconds
    timestamp_local     INTEGER NOT NULL,     -- Unix seconds, UTC-3
    recorded_at         TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_message_records_group_day ON message_records(group_jid, day);
CREATE INDEX idx_message_records_group_author ON message_records(group_jid, author_jid);
```

### Go type

```go
type MessageRecord struct {
    ID             string
    GroupJID       string
    AuthorJID      string
    MessageType    string
    HasMedia       bool
    IsForwarded    bool
    CharacterCount int
    Day            string    // "YYYY-MM-DD"
    TimestampUTC   time.Time
    TimestampLocal time.Time
    RecordedAt     time.Time
}
```

**Retention policy**: No automated expiry. The current spec has no data
retention requirement; this is explicitly deferred to a future amendment.

**Replay protection** (FR-023): the message listener compares
`TimestampUTC` to `time.Now().UTC()` and discards messages older than 20
seconds before attempting to save or dispatch.

---

## 7. RequestRegister

An audit log entry created on every successful AI-powered command invocation
(FR-020). Used for the image generation cooldown check (FR-003) and future
per-user rate limiting.

### Request types

| Constant | Value | Commands |
|---|---|---|
| `ReqText` | `"TEXT"` | `!bot`, `!resumo` |
| `ReqImage` | `"IMAGE"` | `!imagem` |
| `ReqAudio` | `"AUDIO"` | `!fala`, `!transcrever`, `!musica`, `!mp3` |
| `ReqMeme` | `"MEME"` | `!meme`, `!aimeme` |

### SQL

```sql
CREATE TABLE request_registers (
    id          TEXT    PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    group_jid   TEXT    NOT NULL REFERENCES groups(jid) ON DELETE CASCADE,
    author_jid  TEXT    NOT NULL,
    req_type    TEXT    NOT NULL,
    created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_req_registers_group_type ON request_registers(group_jid, req_type, created_at);
CREATE INDEX idx_req_registers_author_type ON request_registers(author_jid, req_type, created_at);
```

### Go type

```go
type RequestType string

const (
    ReqText  RequestType = "TEXT"
    ReqImage RequestType = "IMAGE"
    ReqAudio RequestType = "AUDIO"
    ReqMeme  RequestType = "MEME"
)

type RequestRegister struct {
    ID        string
    GroupJID  string
    AuthorJID string
    ReqType   RequestType
    CreatedAt time.Time
}
```

**Cooldown query**: retrieve the most recent `IMAGE` register for a given
`group_jid` and compare `CreatedAt` to `now`:

```sql
SELECT created_at
FROM   request_registers
WHERE  group_jid = ? AND req_type = 'IMAGE'
ORDER  BY created_at DESC
LIMIT  1;
```

---

## 8. Repository Interfaces

Defined in `internal/storage/repository.go`. Implementations live in
`internal/storage/sqlite/`.

```go
type GroupRepo interface {
    Get(ctx context.Context, jid string) (*Group, error)
    Upsert(ctx context.Context, g *Group) error
    List(ctx context.Context) ([]*Group, error)
    Delete(ctx context.Context, jid string) error

    GetPermissions(ctx context.Context, jid string) ([]Permission, error)
    SetPermissions(ctx context.Context, jid string, perms []Permission) error

    GetConfig(ctx context.Context, jid string) (*GroupConfig, error)
    SetConfig(ctx context.Context, cfg GroupConfig) error

    GetMembers(ctx context.Context, jid string) ([]*GroupMember, error)
    UpsertMember(ctx context.Context, m GroupMember) error
}

type MessageRepo interface {
    Save(ctx context.Context, r MessageRecord) error
    CountByAuthor(ctx context.Context, groupJID string, from, to time.Time) ([]AuthorCount, error)
    CountByDay(ctx context.Context, groupJID string) ([]DayCount, error)
    ListRecent(ctx context.Context, groupJID string, limit int) ([]*MessageRecord, error)
}

type ConfigRepo interface {
    Get(ctx context.Context) (Config, error)
    Set(ctx context.Context, c Config) error
}

type ReqRegisterRepo interface {
    Save(ctx context.Context, r RequestRegister) error
    LastByGroup(ctx context.Context, groupJID string, t RequestType) (*RequestRegister, error)
    LastByAuthor(ctx context.Context, authorJID string, t RequestType) (*RequestRegister, error)
}
```

---

## 9. Migration Sequence

| File | Creates |
|---|---|
| `001_create_config.sql` | `config` + seed row |
| `002_create_groups.sql` | `groups`, `group_permissions`, `group_configs` |
| `003_create_group_members.sql` | `group_members` |
| `004_create_message_records.sql` | `message_records` + indexes |
| `005_create_request_registers.sql` | `request_registers` + indexes |

Applied at startup via `golang-migrate/migrate` using Go embed (`//go:embed migrations/*.sql`).
