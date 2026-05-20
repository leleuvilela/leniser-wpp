# Implementation Plan: Leniser WhatsApp Bot (Go Rewrite)

**Branch**: `001-whatsapp-bot-functional-spec` | **Date**: 2026-05-19 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `specs/001-whatsapp-bot-functional-spec/spec.md`

## Summary

Rewrite the Leniser WhatsApp bot from TypeScript/Node.js to Go, using
`go.mau.fi/whatsmeow` as the WhatsApp client library. The bot runs as a single
binary: one goroutine drives the WhatsApp WebSocket connection and dispatches
incoming events to a command registry; a second goroutine serves a REST API
(chi router) for a future web frontend that manages groups, permissions, and
configuration. All application state is stored in SQLite. The existing
TypeScript code is treated as a reference implementation only; no migration
of runtime data is in scope for this phase.

## Technical Context

**Language/Version**: Go 1.22+ (latest stable)
**Primary Dependencies**:
- `go.mau.fi/whatsmeow` — WhatsApp client (pin to latest pseudo-version)
- `github.com/go-chi/chi/v5` — HTTP router for the management API
- `modernc.org/sqlite` — pure-Go SQLite driver (application data + wa session store)
- `github.com/stretchr/testify` — test assertions
- `go.uber.org/mock` — interface mocking for command handler unit tests
- `golang-migrate/migrate` — SQL schema migrations

**Storage**: SQLite (single `bot.db` file). whatsmeow's built-in `sqlstore`
uses the same driver for its session/keys tables. Application tables (groups,
permissions, config, message logs, request registers) share the same DB file
via a separate schema namespace handled by migrations.

**Testing**: `go test ./...` — unit tests for command handlers (fake
`MessageSender`), integration tests for storage repositories (in-memory
SQLite), HTTP handler tests via `httptest`.

**Target Platform**: Linux server (Docker container, single instance).
Cross-compilation is possible with `modernc.org/sqlite` (pure Go, no CGo).

**Project Type**: Long-running service (WhatsApp bot + embedded REST API)

**Performance Goals**:
- `!ping` response ≤ 3 s (SC-001)
- AI text response ≤ 60 s (SC-002)
- Image generation ≤ 30 s when not in cooldown (SC-003)
- Ranking query ≤ 5 s for ≤ 10 000 stored messages (SC-005)
- Crash recovery / reconnect ≤ 5 min (SC-012)

**Constraints**:
- Single instance; no horizontal scaling
- Portuguese-locale output for statistics and error messages
- External service calls: fail-fast (no retries), explicit timeout per call
- No HTTP API authentication beyond static Bearer token (admin-only frontend)

**Scale/Scope**:
- Small number of WhatsApp groups (< 100)
- Up to ~10 000 stored messages per group for ranking queries
- Single admin user for the web frontend

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### I. WhatsApp Bot Focus — PASS

Every component in this plan traces to a WhatsApp interaction surface or the
administrative management of that bot. The REST API exists solely to manage
bot behaviour; it is not a general-purpose web service.

### II. Go-First Implementation — PASS

All production code is Go 1.22+. The existing TypeScript codebase is
referenced as behavioural documentation only. No TypeScript/Node.js code runs
in the new production path.

**Framework justification for `go.mau.fi/whatsmeow` (Principle III gate):**

| Question | Answer |
|---|---|
| Problem the Go stdlib cannot solve? | WhatsApp uses a proprietary binary protocol (Noise + custom WebSocket framing + Signal-protocol E2EE) with no official Go SDK. The stdlib cannot implement this without months of reverse-engineering work. |
| Maintenance status / license? | Active (last commit May 2026, 6 000+ stars, ~1 600 commits). MPL-2.0. Minimal transitive deps (protobuf, signal-go, sqlstore). |
| Lock-in risk / exit strategy? | Protocol is proprietary regardless of library; switching to another unofficial library (none exist at comparable maturity) would require rewriting the event/send layer (~`internal/bot/`). Risk accepted — no alternative. |
| Rejected alternative? | Official WhatsApp Business Cloud API — requires Meta approval and is webhook/REST-based, unsuitable for a personal bot reacting to incoming messages in real time. |

**Framework justification for `github.com/go-chi/chi/v5`:**

| Question | Answer |
|---|---|
| Problem stdlib cannot solve? | `net/http` ServeMux lacks parameterised routes (`/groups/{jid}`), composable middleware chains, and route grouping — all needed for a well-structured management API. |
| Maintenance status / license? | Active (MIT, 18 000+ stars). Zero non-stdlib transitive deps. |
| Lock-in risk / exit strategy? | chi wraps `http.Handler`/`http.Request` — 100% stdlib-compatible. Any chi handler works with net/http directly. Switching is a router-registration change only. |
| Rejected alternative? | `gin` and `echo` use proprietary Context types, breaking stdlib middleware compatibility. `gorilla/mux` is archived. |

### III. Deliberate Framework Selection — PASS

See justification table above. Both external frameworks (whatsmeow, chi) pass
all four required questions. `modernc.org/sqlite` is a pure-Go driver with no
alternatives at the same maturity level for CGo-free SQLite; no further
framework question applies (it is a driver, not a framework). `testify` is a
de-facto standard test assertion library with no lock-in (wraps `testing.T`).

### IV. Test-Backed Behavior — PASS (with obligation)

Every user-observable WhatsApp command (`!ping`, `!bot`, `!imagem`, etc.) and
the deletion disclosure listener MUST have at minimum one automated test
before the implementation of that handler is considered complete. The
`MessageSender` interface decouples command handlers from `*whatsmeow.Client`
to make unit testing straightforward. Integration tests use real in-memory
SQLite (no mocks for storage).

### V. Observability & Operational Safety — PASS (with obligation)

FR-024 mandates structured log entries per event (correlation ID, handler
name, outcome, latency). FR-025 mandates explicit timeouts on all external
calls and fail-fast error replies. These requirements are reflected in the
`internal/bot/handler.go` architecture where the dispatcher wraps every
handler call with timing and error capture before logging. Panics in handlers
MUST be recovered at the dispatcher level — not in individual handlers.

## Project Structure

### Documentation (this feature)

```text
specs/001-whatsapp-bot-functional-spec/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   ├── rest-api.md      # REST API contract (web frontend)
│   └── commands.md      # WhatsApp command contract
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
cmd/
└── bot/
    └── main.go              # Wire all deps, start goroutines, handle signals

internal/
├── bot/
│   ├── bot.go               # Bot struct: holds waClient, starts event loop
│   ├── dispatcher.go        # AddEventHandler callback; routes to CommandRegistry
│   │                        # Wraps each handle() with panic recovery, timing, structured log
│   └── sender.go            # MessageSender interface (send text/media/poll/sticker)
├── command/
│   ├── registry.go          # CommandRegistry: []Handler, canHandle + handle dispatch
│   ├── handler.go           # Handler interface: CanHandle(evt) bool, Handle(ctx, evt) error
│   ├── ping.go
│   ├── menu.go
│   ├── aa.go
│   ├── bot_cmd.go           # !bot — AI conversation
│   ├── fala.go              # !fala — TTS
│   ├── imagem.go            # !imagem — image generation + cooldown
│   ├── musica.go            # !musica — Suno music generation
│   ├── meme.go              # !meme
│   ├── aimeme.go            # !aimeme
│   ├── transcrever.go       # !transcrever
│   ├── resumo.go            # !resumo
│   ├── sticker.go           # !sticker
│   ├── mp3.go               # !mp3
│   ├── ranking.go           # !ranking
│   ├── msgsdia.go           # !msgsdia
│   ├── checagem.go          # !checagem (poll)
│   ├── vainele.go           # !vainele (poll)
│   ├── deuita.go            # substring auto-reply
│   └── gilso.go             # targeted probabilistic reply
├── listener/
│   ├── message.go           # *events.Message → CommandRegistry dispatch + message save
│   ├── revoke.go            # *events.Message ProtocolMessage_REVOKE → deletion disclosure
│   └── groupjoin.go         # *events.GroupInfo Join → auto-register group
├── service/
│   ├── openai.go            # OpenAI: chat (gpt-5), TTS (tts-1), image (gpt-image-1), whisper
│   ├── suno.go              # Suno music generation via proxy
│   ├── imgflip.go           # Imgflip meme search + AI meme
│   └── media.go             # convertToMP3 (ffmpeg exec), screenshot utility
├── storage/
│   ├── repository.go        # Interfaces: GroupRepo, MessageRepo, ConfigRepo,
│   │                        #   ReqRegisterRepo, GroupMemberRepo
│   └── sqlite/
│       ├── db.go            # Open DB, run migrations
│       ├── group.go         # GroupRepo impl
│       ├── message.go       # MessageRepo impl
│       ├── config.go        # ConfigRepo impl
│       ├── reqregister.go   # ReqRegisterRepo impl
│       └── groupmember.go   # GroupMemberRepo impl
├── api/
│   ├── server.go            # chi router setup, middleware, graceful shutdown
│   └── handler/
│       ├── groups.go        # CRUD group permissions + config
│       ├── config.go        # Global config GET/PUT
│       ├── stats.go         # Message stats read-only endpoints
│       └── send.go          # POST /groups/{jid}/message (manual send from frontend)
├── config/
│   └── config.go            # Env-var parsing into Config struct
└── migrations/
    ├── 001_create_groups.sql
    ├── 002_create_messages.sql
    ├── 003_create_config.sql
    ├── 004_create_req_registers.sql
    └── 005_create_group_members.sql
```

**Structure Decision**: Single Go module, `cmd/` + `internal/` layout. No
`pkg/` (this is not a library). The REST API and the WhatsApp bot share the
same process, communicating through in-process repository interfaces. The
`internal/command/` package implements a registry-based command pattern: each
command is a separate file implementing the `Handler` interface, making it
trivial to add, remove, or test commands independently. The `internal/listener/`
package is separate from `internal/command/` because listeners react to
WhatsApp protocol events that are not user-invoked commands (revoke, group
join). The `internal/bot/dispatcher.go` is the single point where all handlers
are registered and all observability obligations (FR-024, FR-025) are enforced.

## Complexity Tracking

> No Constitution violations to justify.

The two external frameworks (whatsmeow, chi) have passed all four justification
questions in the Constitution Check section above. No other complexity
tradeoffs require formal tracking.
