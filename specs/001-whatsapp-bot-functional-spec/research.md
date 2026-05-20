# Research: Leniser WhatsApp Bot — Go Rewrite

**Feature**: `001-whatsapp-bot-functional-spec`
**Date**: 2026-05-19
**Status**: Complete — all NEEDS CLARIFICATION resolved

---

## 1. WhatsApp Client Library

**Decision**: `go.mau.fi/whatsmeow` pinned to latest pseudo-version at `go get` time.

**Rationale**: The only mature, actively maintained unofficial Go library for
WhatsApp Web protocol. It implements the full Noise WebSocket + Signal E2EE
stack, provides a high-level event system, supports all required message types
(text, image, audio, sticker, poll, media upload/download), and includes a
built-in SQLite/Postgres session store. Its transitive dependency footprint is
small (protobuf, signal-go, sqlstore).

**Key integration notes**:
- Session persistence via `sqlstore.New(ctx, "sqlite3", "file:bot.db?...")`.
  On first run, show QR code; on restart, `client.Connect()` resumes silently.
- Event handler signature: `func(evt interface{})` — type-switch inside.
- Message revoke events arrive as `*events.Message` with an inner
  `ProtocolMessage_REVOKE` — not a separate event type.
- Group join fires as `*events.GroupInfo` with a `Join` field.
- The library does **not** auto-reconnect on disconnect; implement a reconnect
  loop reacting to `*events.Disconnected`.
- All `*whatsmeow.Client` send methods must be abstracted behind a
  `MessageSender` interface (`internal/bot/sender.go`) for testability.

**Alternatives considered**:
- `Rhymen/go-whatsapp`: unmaintained, single-device only.
- Official WhatsApp Business Cloud API: requires Meta approval, webhook model,
  not suitable for a personal bot.
- Node.js baileys bridge: adds cross-language complexity; rejected by
  constitution (Go-first).

---

## 2. Project Layout

**Decision**: `cmd/` + `internal/` layout. No `pkg/`.

**Rationale**: `cmd/bot/main.go` is the sole entry point; it only wires
constructors. All business logic lives under `internal/` to prevent accidental
external import. `pkg/` is deliberately omitted — it signals a reusable
library, which this is not. See `plan.md` → Project Structure for the full
directory tree.

Key layout decisions:
- `internal/command/` — one file per WhatsApp command. All share a `Handler`
  interface (`CanHandle`, `Handle`). The `CommandRegistry` iterates all
  registered handlers per incoming message.
- `internal/listener/` — separate from commands; handles protocol-level events
  (revoke, group join) that are not user-invoked.
- `internal/bot/dispatcher.go` — single point for panic recovery, structured
  logging (correlation ID, handler name, outcome, latency — satisfying FR-024),
  and timeout enforcement (FR-025).
- `internal/api/` — HTTP server lives here, isolated from bot logic; shares
  storage interfaces with the bot.

**Alternatives considered**:
- `google/wire` for DI: code generation adds build step; overkill at this
  scale. Manual constructor injection is zero-overhead and fully transparent.
- `uber-go/fx`: powerful but hides the wiring graph. Not warranted here.

---

## 3. HTTP Router and API Co-location

**Decision**: `github.com/go-chi/chi/v5` for routing; same binary, separate
goroutine via `golang.org/x/sync/errgroup`.

**Rationale**: chi is 100% `net/http`-compatible (no proprietary Context type),
supports parameterised routes (`/api/v1/groups/{jid}`), and has composable
middleware. Zero non-stdlib transitive deps. The bot and API share in-process
repository instances — no IPC, no serialization overhead.

Startup pattern:
```go
errg, ctx := errgroup.WithContext(ctx)
errg.Go(func() error { return bot.Start(ctx) })
errg.Go(func() error { return api.ListenAndServe(ctx) })
errg.Wait()
```

The `api.ListenAndServe` function starts an `http.Server` on a configurable
port (default `8080`) and shuts it down gracefully when `ctx` is cancelled.

**Alternatives considered**:
- `gin` / `echo`: own Context types break stdlib middleware ecosystem.
- `gorilla/mux`: archived 2022.
- `net/http` stdlib only: lacks parameterised routes and middleware chains.

---

## 4. Authentication for the Management API

**Decision**: Static Bearer token (API key loaded from `BOT_API_KEY` env var).

**Rationale**: Single admin user, personal project. A static key in an env var
is zero-infrastructure, trivially rotatable (restart with new key), and
sufficient when combined with TLS termination at the reverse-proxy (Caddy or
nginx). No session store, no CSRF surface, no token expiry complexity.

Implementation: `crypto/subtle.ConstantTimeCompare` in a chi middleware to
prevent timing attacks.

**Alternatives considered**:
- JWT: requires signing key management, token expiry, refresh flow — overkill
  for a single admin.
- Session cookie: adds login endpoint, session store, CSRF protection.
- OAuth2: far beyond requirements.

---

## 5. Application Storage

**Decision**: SQLite via `modernc.org/sqlite` (pure Go, no CGo).

**Rationale**: The application data (groups, permissions, configuration, message
logs, request registers) has a well-defined relational shape suited to SQL.
SQLite is zero-ops (single file), ACID, and shares the same driver already
required by whatsmeow's session store. `modernc.org/sqlite` avoids CGo
entirely, simplifying cross-compilation and container builds.

A single `bot.db` file holds all tables (whatsmeow session tables + application
tables). Schema migrations are managed by `github.com/golang-migrate/migrate/v4`
using embedded SQL files (`internal/migrations/*.sql`).

**Alternatives considered**:
- MongoDB (existing deployment): external process, BSON driver verbosity,
  operational overhead, no benefit at this scale. Rejected in favour of SQLite.
- `mattn/go-sqlite3`: CGo-based; complicates cross-compilation. Rejected.
- PostgreSQL: correct choice if multi-instance or full-text search becomes
  needed; the whatsmeow sqlstore already supports it, so migration later is
  only a driver swap + connection string change.
- bbolt: key-value only; no SQL queries for the ranking/stats features.

---

## 6. Testing Strategy

**Decision**: `go test ./...` with `testify` + hand-rolled fakes (escalate to
`go.uber.org/mock` if interface surface grows).

**Unit tests**: Command handlers accept a `MessageSender` interface, not
`*whatsmeow.Client`. Fake implementations of that interface (and any service
interfaces) allow full handler testing without any network connection. All
`*events.Message` values are plain Go structs — constructable directly in
tests.

**Integration tests**: Repositories are tested against a real in-memory SQLite
instance (`sql.Open("sqlite", ":memory:")`). Migrations are applied in
`TestMain`. No mocking for storage.

**HTTP handler tests**: `net/http/httptest.NewRecorder()` + chi's `ServeHTTP`
call. No real server needed.

**What is not tested**: Real WhatsApp connectivity, real external AI services.
These are integration-level concerns beyond the test boundary; they are covered
by manual QA with the live bot number.

**Alternatives considered**:
- `testify/mock`: less type-safe than `go.uber.org/mock`; fine for small
  surface. Start here.
- `go-sqlmock`: unnecessary when real in-memory SQLite is available and fast.

---

## 7. Web Frontend Preparation

**Decision**: Expose a versioned REST API (`/api/v1/...`) from day one, even
before the frontend exists. Use JSON responses throughout. Include an OpenAPI
description file (contracts/rest-api.md) for the frontend team to work from.

**API surface** (see `contracts/rest-api.md` for full spec):
- Groups: list, get, update permissions + config
- Config: get/set global defaults
- Stats: ranking and daily message counts (read-only)
- Send: post a message to a group from the frontend

**CORS**: Enable configurable CORS origin in the chi middleware so the frontend
can be served from a different origin during development.

**Future evolution path**:
- Add multi-user auth: replace static Bearer with JWT (single endpoint change
  in `internal/api/server.go`).
- Add WebSocket endpoint for live event streaming to the frontend.
- Expose QR code / pairing flow via a dedicated `/api/v1/auth` endpoint.

All of these are additive changes that do not require restructuring the existing
API or storage layout.
