---

description: "Task list for Leniser WhatsApp Bot — Go rewrite"
---

# Tasks: Leniser WhatsApp Bot (Go Rewrite)

**Input**: Design documents from `specs/001-whatsapp-bot-functional-spec/`
**Prerequisites**: plan.md ✅ | spec.md ✅ | research.md ✅ | data-model.md ✅ | contracts/ ✅ | quickstart.md ✅

**Tests**: Not requested — test tasks are omitted from this list.
**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1–US18)
- Paths assume Go module root at repository root

---

## Phase 1: Setup

**Purpose**: Initialize the Go module, project skeleton, and shared infrastructure.

- [X] T001 Initialize Go module `github.com/leleuvilela/leniser-wpp` with `go mod init` at repository root
- [X] T002 [P] Create directory tree: `cmd/bot/`, `internal/bot/`, `internal/command/`, `internal/listener/`, `internal/service/`, `internal/storage/`, `internal/storage/sqlite/`, `internal/api/`, `internal/api/handler/`, `internal/config/`, `internal/migrations/`
- [X] T003 [P] Add core dependencies to `go.mod`: `go get go.mau.fi/whatsmeow@latest`, `go get github.com/go-chi/chi/v5`, `go get modernc.org/sqlite`, `go get github.com/golang-migrate/migrate/v4`, `go get github.com/stretchr/testify`
- [X] T004 [P] Create `internal/config/config.go` — `Config` struct with all env-var fields: `DBPath`, `APIAddr`, `APIKey`, `CORSOrigin`, `OpenAIAPIKey`, `SunoAPIURL`, `ImgflipUsername`, `ImgflipPassword`, `LogLevel`, `AppEnv`; `Load()` reads from environment
- [ ] T005 [P] Create `internal/config/config_test.go` — verify `Load()` reads env vars and applies defaults
- [X] T006 Create `internal/storage/repository.go` — declare all repository interfaces: `GroupRepo`, `MessageRepo`, `ConfigRepo`, `ReqRegisterRepo` exactly as specified in `data-model.md`; declare all domain types (`Group`, `Permission`, `GroupConfig`, `GroupMember`, `MessageRecord`, `RequestRegister`, `Config`, `RequestType`, `AuthorCount`, `DayCount`)
- [X] T007 [P] Create `internal/storage/resolve.go` — implement `ResolveConfig(global Config, override *GroupConfig) Config` merge helper per `data-model.md` resolution pattern
- [X] T008 Create `internal/migrations/` SQL files — write five migration files: `001_create_config.sql`, `002_create_groups.sql`, `003_create_group_members.sql`, `004_create_message_records.sql`, `005_create_request_registers.sql` per DDL in `data-model.md` (including all indexes and the seed row for `config`)
- [X] T009 Create `internal/storage/sqlite/db.go` — open SQLite DB via `modernc.org/sqlite`, embed migrations with `//go:embed ../../migrations/*.sql`, apply via `golang-migrate`, return `*sql.DB`
- [X] T010 Create `internal/bot/sender.go` — define `MessageSender` interface: `SendText`, `SendImage`, `SendAudio`, `SendSticker`, `SendPoll`, `SendDocument` methods accepting `context.Context` and target `types.JID`; implement `WhatsAppSender` struct wrapping `*whatsmeow.Client`

---

## Phase 2: Foundational

**Purpose**: Core infrastructure that MUST be complete before any user story can be implemented.

⚠️ **CRITICAL**: No user story work can begin until this phase is complete.

- [X] T011 Create `internal/storage/sqlite/config.go` — implement `ConfigRepo` interface: `Get` (SELECT id=1), `Set` (UPDATE with `updated_at`)
- [X] T012 [P] Create `internal/storage/sqlite/group.go` — implement `GroupRepo` interface: `Get`, `Upsert`, `List`, `Delete`, `GetPermissions`, `SetPermissions` (replace via transaction), `GetConfig`, `SetConfig`, `GetMembers`, `UpsertMember`
- [X] T013 [P] Create `internal/storage/sqlite/message.go` — implement `MessageRepo` interface: `Save`, `CountByAuthor` (SQL GROUP BY with time range), `CountByDay` (GROUP BY day), `ListRecent` (ORDER BY timestamp DESC LIMIT N, exclude bot messages)
- [X] T014 [P] Create `internal/storage/sqlite/reqregister.go` — implement `ReqRegisterRepo` interface: `Save` (INSERT with random UUID), `LastByGroup`, `LastByAuthor` (both ORDER BY created_at DESC LIMIT 1)
- [ ] T015 [P] Create `internal/storage/sqlite/groupmember.go` — implement `GroupMemberRepo` subset of `GroupRepo`: `GetMembers`, `UpsertMember` (INSERT OR REPLACE)
- [X] T016 Create `internal/command/handler.go` — define `Handler` interface (`CanHandle(evt *events.Message, group *storage.Group) bool`, `Handle(ctx context.Context, evt *events.Message, group *storage.Group) error`) and `Registry` struct with `Register(...Handler)` and `Dispatch(ctx, evt, group)` methods
- [X] T017 Create `internal/bot/dispatcher.go` — implement the whatsmeow `AddEventHandler` callback: for `*events.Message` events, load group from `GroupRepo`, check replay (>20s old → discard, FR-023), check `MESSAGE_CREATE` permission gate, record `GroupMember` push name upsert, call `Registry.Dispatch`; wrap each dispatch call with panic recovery, elapsed-time measurement, and structured log emit (correlation ID, handler name, outcome, latency — FR-024)
- [X] T018 Create `internal/bot/bot.go` — `Bot` struct holding `*whatsmeow.Client`, `Registry`, all repos; `New(cfg, waClient, registry, repos...)` constructor; `Start(ctx)` method that calls `client.Connect()`, registers dispatcher, handles `*events.Disconnected` with reconnect loop (≤5 min, SC-012)
- [X] T019 Create `internal/api/server.go` — chi router setup: `NewServer(cfg, groupRepo, configRepo, messageRepo, waBot)` constructor; `authMiddleware` with `crypto/subtle.ConstantTimeCompare`; CORS middleware using `BOT_CORS_ORIGIN`; `ListenAndServe(ctx)` with graceful shutdown; routes: `/api/v1/status` (no auth), all other `/api/v1/...` routes under auth middleware
- [X] T020 Create `cmd/bot/main.go` — wire all dependencies: load config, open SQLite DB, create repos, create `whatsmeow` client with `sqlstore`, create command registry (empty for now), create bot, create API server; start both with `errgroup`; handle OS signals for graceful shutdown

**Checkpoint**: Foundation ready — the binary compiles, connects to WhatsApp (QR flow), starts the API server, and applies migrations. No commands work yet.

---

## Phase 3: User Story 1 — Bot Responsiveness Check (Priority: P1) 🎯 MVP

**Goal**: `!ping` works end-to-end in any registered group, confirming the bot is alive.

**Independent Test**: Send `!ping` in a group. Bot replies `{prefix} pong!` within 3 seconds regardless of whether any external service is available.

### Implementation for User Story 1

- [X] T021 [US1] Create `internal/command/ping.go` — `PingHandler` struct; `CanHandle`: body == `!ping`; `Handle`: send `{prefix} pong!` via `MessageSender`; no permission check (overrides default gate)
- [X] T022 [US1] Register `PingHandler` in `cmd/bot/main.go` command registry

**Checkpoint**: US1 complete. `!ping` → `pong!` in any group.

---

## Phase 4: User Story 17 — New Group Auto-Registration (Priority: P1)

**Goal**: When the bot is added to a new group, the group record is created automatically with empty permissions.

**Independent Test**: Add the bot to a new group. Check that a row with empty permissions appears in `groups` / `group_permissions` tables within 10 seconds.

### Implementation for User Story 17

- [X] T023 [US17] Create `internal/listener/groupjoin.go` — handle `*events.GroupInfo` event; if `evt.Join` is non-nil, call `GroupRepo.Upsert` with JID and `evt.Name`; idempotent (INSERT OR IGNORE on duplicate)
- [X] T024 [US17] Register `GroupJoinListener` in `internal/bot/dispatcher.go` event handler switch

**Checkpoint**: US17 complete. Bot auto-registers new groups.

---

## Phase 5: User Story 18 — Runtime Configuration Reload (Priority: P2)

> **Note**: The HTTP reload *endpoint* was removed from scope (clarification Q2). The underlying reload *capability* is still needed — the API server's `PUT /api/v1/config` and `PUT /api/v1/groups/{jid}/permissions` endpoints write to SQLite and the bot reads config/permissions fresh from the DB on each message. No in-memory cache reload is required; SQLite read latency is negligible. This phase implements the management API handlers that enable the web frontend.

**Goal**: Operator can update group permissions and global config via the REST API. Changes take effect on the next bot command without restarting.

**Independent Test**: `PUT /api/v1/groups/{jid}/permissions` with `["MESSAGE_CREATE"]` → next `!ping` in that group is processed; remove the permission → `!ping` is silently ignored.

### Implementation for User Story 18

- [X] T025 [US18] Create `internal/api/handler/groups.go` — `GroupsHandler` struct; implement: `List` (`GET /api/v1/groups`), `Get` (`GET /api/v1/groups/{jid}`), `SetPermissions` (`PUT /api/v1/groups/{jid}/permissions`), `SetConfig` (`PUT /api/v1/groups/{jid}/config`), `SendMessage` (`POST /api/v1/groups/{jid}/messages`)
- [X] T026 [US18] Create `internal/api/handler/config.go` — `ConfigHandler` struct; implement `GetConfig` (`GET /api/v1/config`), `SetConfig` (`PUT /api/v1/config`)
- [X] T027 [US18] Create `internal/api/handler/status.go` — `StatusHandler` struct; implement `GetStatus` (`GET /api/v1/status`); reads connected state from `*whatsmeow.Client.IsConnected()` and logged-in phone number; no auth required
- [X] T028 [US18] Wire all handlers into the chi router in `internal/api/server.go`

**Checkpoint**: US18 complete. REST API is fully operational. Groups can be permission-managed from the frontend.

---

## Phase 6: User Story 16 — Deleted Message Disclosure (Priority: P2)

**Goal**: When a group member deletes a message for everyone, the bot posts the original text and tags the deleter — in groups with `MESSAGE_REVOKE` permission.

**Independent Test**: In a group with `MESSAGE_REVOKE` permission, delete a text message. Bot posts the original body and @-mentions the deleter within 5 seconds.

### Implementation for User Story 16

- [X] T029 [US16] Create `internal/listener/revoke.go` — handle `*events.Message` with inner `ProtocolMessage_REVOKE`; check group has `MESSAGE_REVOKE` permission; if original message had a text body, send reply with `@{sender_number}` mention and quoted original body; no action for media-only messages

**Checkpoint**: US16 complete. Deletion disclosure active in opted-in groups.

---

## Phase 7: User Story 2 — AI Conversation Assistant (Priority: P1)

**Goal**: `!bot [prompt]` sends a query to the AI model with optional multi-turn context (text, image, audio chain) and replies with the AI response.

**Independent Test**: Send `!bot What is 2+2?` in a permitted group. Bot replies with an AI-generated answer within 60 seconds.

### Implementation for User Story 2

- [X] T030 [P] [US2] Create `internal/service/openai.go` — `OpenAIService` struct; implement: `Chat(ctx, systemPrompt string, messages []ChatMessage) (string, error)` wrapping the Responses API (`gpt-5`); explicit timeout (≤60 s); fail-fast on error (no retry, FR-025); `Transcribe(ctx, audioBytes []byte) (string, error)` wrapping Whisper (`whisper-1`); `GenerateImage(ctx, prompt string) ([]byte, error)` wrapping image generation (`gpt-image-1`, 1024×1024); `TextToSpeech(ctx, text string) ([]byte, error)` wrapping TTS (`tts-1`, voice `onyx`)
- [X] T031 [US2] Create `internal/command/bot_cmd.go` — `BotHandler`; `CanHandle`: body starts with `!bot`; `Handle`: extract prompt, walk quoted chain (text + image base64 + audio→Whisper transcription), assemble `ChatMessage` slice oldest-first, call `OpenAIService.Chat` with group system prompt, reply with AI response; show typing indicator during processing; log `ReqText` register on success; reply with error message on failure
- [X] T032 [US2] Register `BotHandler` in `cmd/bot/main.go`

**Checkpoint**: US2 complete. `!bot` replies with AI responses.

---

## Phase 8: User Story 3 — AI Image Generation (Priority: P1)

**Goal**: `!imagem [prompt]` generates and returns an AI image, subject to per-group cooldown.

**Independent Test**: Send `!imagem a red panda` in a permitted group not in cooldown. Bot replies with a generated image within 30 seconds.

### Implementation for User Story 3

- [X] T033 [US3] Create `internal/command/imagem.go` — `ImagemHandler`; `CanHandle`: body starts with `!imagem`; `Handle`: resolve group config (cooldown settings), check `ReqRegisterRepo.LastByGroup` for `ReqImage` — if in cooldown send notice and return; call `OpenAIService.GenerateImage`; reply with image bytes as `image/jpeg`; log `ReqImage` register on success; reply with error on failure
- [X] T034 [US3] Register `ImagemHandler` in `cmd/bot/main.go`

**Checkpoint**: US3 complete. `!imagem` generates images with cooldown enforcement.

---

## Phase 9: User Story 4 — AI Text-to-Speech (Priority: P2)

**Goal**: `!fala [text]` (or reply) synthesises speech and sends an audio message.

**Independent Test**: Send `!fala olá mundo` in a permitted group. Bot replies with an audio message.

### Implementation for User Story 4

- [X] T035 [US4] Create `internal/command/fala.go` — `FalaHandler`; `CanHandle`: body starts with `!fala`; `Handle`: extract text (inline or from quoted body); show recording indicator; call `OpenAIService.TextToSpeech`; reply with `audio/mpeg` bytes; log `ReqAudio` register on success; send Portuguese error message on failure
- [X] T036 [US4] Register `FalaHandler` in `cmd/bot/main.go`

**Checkpoint**: US4 complete. `!fala` replies with synthesised speech.

---

## Phase 10: User Story 5 — Audio Transcription (Priority: P2)

**Goal**: `!transcrever` (as reply to audio/voice) returns a text transcription.

**Independent Test**: Reply to a voice note with `!transcrever`. Bot replies with the transcribed text within 20 seconds.

### Implementation for User Story 5

- [X] T037 [US5] Create `internal/command/transcrever.go` — `TranscreverHandler`; `CanHandle`: body starts with `!transcrever`; `Handle`: validate quoted message is `audio` or `voice` type; download audio; show typing indicator; call `OpenAIService.Transcribe`; reply with transcription text; log `ReqAudio` register on success; reply with error on failure or wrong media type
- [X] T038 [US5] Register `TranscreverHandler` in `cmd/bot/main.go`

**Checkpoint**: US5 complete. `!transcrever` transcribes audio messages.

---

## Phase 11: User Story 6 — AI Music Generation (Priority: P2)

**Goal**: `!musica [prompt]` generates a music track and returns it as audio, with an upfront wait-time notice.

**Independent Test**: Send `!musica bossa nova chill` in a permitted group. Bot immediately sends a wait notice, then later replies with an audio file.

### Implementation for User Story 6

- [X] T039 [P] [US6] Create `internal/service/suno.go` — `SunoService` struct; `Generate(ctx, prompt string) ([]byte, error)`: POST to `SUNO_API_URL` with `{prompt, wait_audio: true, make_instrumental: false}`; explicit timeout (≤5 min); download audio from `audio_url` in response; fail-fast on error
- [X] T040 [US6] Create `internal/command/musica.go` — `MusicaHandler`; `CanHandle`: body starts with `!musica` or `!música`; `Handle`: immediately send wait-time notice ("Gerando música... ≈3 min"); call `SunoService.Generate`; reply with audio bytes; log `ReqAudio` register on success; send error message on failure
- [X] T041 [US6] Register `MusicaHandler` in `cmd/bot/main.go`

**Checkpoint**: US6 complete. `!musica` generates AI music.

---

## Phase 12: User Story 7 — Meme Search and Generation (Priority: P2)

**Goal**: `!meme [query]` returns a matching meme image; `!aimeme [prompt]` returns an AI-generated meme.

**Independent Test**: Send `!meme drake` in a permitted group. Bot replies with a meme image.

### Implementation for User Story 7

- [X] T042 [P] [US7] Create `internal/service/imgflip.go` — `ImgflipService` struct; `SearchMeme(ctx, query string) ([]byte, error)`: GET `/search_memes?q=...` using credentials; download and return first result image bytes; `AIMeme(ctx, prompt string) ([]byte, error)`: POST `/ai_meme` with `prefix_text`; download and return image bytes; explicit timeout; fail-fast (FR-025)
- [X] T043 [P] [US7] Create `internal/command/meme.go` — `MemeHandler`; `CanHandle`: starts with `!meme`; `Handle`: call `ImgflipService.SearchMeme`; reply with image; log `ReqMeme` on success
- [X] T044 [P] [US7] Create `internal/command/aimeme.go` — `AiMemeHandler`; `CanHandle`: starts with `!aimeme`; `Handle`: call `ImgflipService.AIMeme`; reply with image; log `ReqMeme` on success
- [X] T045 [US7] Register `MemeHandler` and `AiMemeHandler` in `cmd/bot/main.go`

**Checkpoint**: US7 complete. `!meme` and `!aimeme` return meme images.

---

## Phase 13: User Story 8 — Conversation Summary (Priority: P2)

**Goal**: `!resumo [N]` generates an AI summary of the last N group messages using stored message history.

**Independent Test**: In a group with `SAVE_MESSAGE` permission and stored messages, send `!resumo 20`. Bot replies with a readable summary mentioning participant names.

### Implementation for User Story 8

- [X] T046 [US8] Create `internal/command/resumo.go` — `ResumoHandler`; `CanHandle`: starts with `!resumo`; `Handle`: parse optional integer N (default 50, cap at 200); call `MessageRepo.ListRecent`; resolve author JIDs to display names via `GroupRepo.GetMembers`; format as `"Name: body"` lines (chat-type only); call `OpenAIService.Chat` with summary system prompt; reply; log `ReqText` on success
- [X] T047 [US8] Register `ResumoHandler` in `cmd/bot/main.go`

**Checkpoint**: US8 complete. `!resumo` summarises group conversation history.

---

## Phase 14: User Story 9 — Message Statistics: Ranking (Priority: P2)

**Goal**: `!ranking [period] [graph]` returns a message-count leaderboard for the requested time window.

**Independent Test**: In a group with stored messages, send `!ranking semana`. Bot replies with a ranked list within 5 seconds.

### Implementation for User Story 9

- [X] T048 [US9] Create `internal/command/ranking.go` — `RankingHandler`; `CanHandle`: starts with `!ranking`; `Handle`: parse period modifier (`dia`, `semana`, `mes`, `DD/MM/YYYY`, or all-time) and `graph` keyword; compute `from`/`to` time range in UTC-3; call `MessageRepo.CountByAuthor`; resolve JIDs to names via `GroupRepo.GetMembers`; format leaderboard with percentages; if `graph` keyword present, append proportional `█` bars (max 30 chars, scaled to first place); reply

- [X] T049 [US9] Register `RankingHandler` in `cmd/bot/main.go`

**Checkpoint**: US9 complete. `!ranking` shows the message leaderboard.

---

## Phase 15: User Story 10 — Daily Message Volume (Priority: P3)

**Goal**: `!msgsdia` returns per-calendar-day message counts for the group.

**Independent Test**: Send `!msgsdia` in a group with stored messages. Bot replies with dates and counts with Portuguese day-of-week labels.

### Implementation for User Story 10

- [X] T050 [US10] Create `internal/command/msgsdia.go` — `MsgsDiaHandler`; `CanHandle`: starts with `!msgsdia`; `Handle`: call `MessageRepo.CountByDay`; format output sorted descending with Portuguese weekday labels (`Domingo`, `Segunda`, …, `Sábado`); reply
- [X] T051 [US10] Register `MsgsDiaHandler` in `cmd/bot/main.go`

**Checkpoint**: US10 complete. `!msgsdia` shows daily message history.

---

## Phase 16: User Story 11 — Sticker Creation (Priority: P3)

**Goal**: `!sticker` attached to or replying to an image/video returns it as a WhatsApp sticker.

**Independent Test**: Reply to an image with `!sticker`. Bot resends the image as a sticker.

### Implementation for User Story 11

- [X] T052 [US11] Create `internal/command/sticker.go` — `StickerHandler`; `CanHandle`: starts with `!sticker`; `Handle`: resolve media source (attached image/video, or quoted image/video); download media bytes; send as sticker via `MessageSender.SendSticker`; reply with error if no media found
- [X] T053 [US11] Register `StickerHandler` in `cmd/bot/main.go`

**Checkpoint**: US11 complete. `!sticker` converts media to stickers.

---

## Phase 17: User Story 12 — Media Conversion to MP3 (Priority: P3)

**Goal**: `!mp3` (reply to audio/voice/video) returns the media converted to an MP3 file.

**Independent Test**: Reply to a voice note with `!mp3`. Bot replies with an MP3 document attachment.

### Implementation for User Story 12

- [X] T054 [P] [US12] Create `internal/service/media.go` — `ConvertToMP3(ctx context.Context, inputBytes []byte, inputMIME string) ([]byte, error)`: write to temp file, exec `ffmpeg -i <input> -f mp3 <output>`, read output bytes, clean up; fail-fast on ffmpeg error (FR-025)
- [X] T055 [US12] Create `internal/command/mp3.go` — `Mp3Handler`; `CanHandle`: starts with `!mp3`; `Handle`: validate quoted message is audio/voice/video; download media; call `ConvertToMP3`; extract optional filename from command; send via `MessageSender.SendDocument` as `{filename}.mp3`; reply with error if no media or conversion fails
- [X] T056 [US12] Register `Mp3Handler` in `cmd/bot/main.go`

**Checkpoint**: US12 complete. `!mp3` converts and sends audio files.

---

## Phase 18: User Story 13 — Polls (Priority: P3)

**Goal**: `!checagem` and `!vainele` send pre-defined WhatsApp polls.

**Independent Test**: Send `!checagem` in a permitted group. Bot posts a poll with the defined title and options.

### Implementation for User Story 13

- [X] T057 [P] [US13] Create `internal/command/checagem.go` — `ChecagemHandler`; `CanHandle`: body == `!checagem`; `Handle`: send poll via `MessageSender.SendPoll` with title `🍆🍆🍆 CHECAGEM DA PEÇA NO GRUPO 🍆🍆🍆` and options `["MOLE","MEIA BOMBA","DURA","TOMEI UM TADALA"]`
- [X] T058 [P] [US13] Create `internal/command/vainele.go` — `VaiNeleHandler`; `CanHandle`: body == `!vainele`; `Handle`: send poll with title `Vai nele? 🤔` and options `["Sim","Não","Tal tal"]`
- [X] T059 [US13] Register `ChecagemHandler` and `VaiNeleHandler` in `cmd/bot/main.go`

**Checkpoint**: US13 complete. Poll commands work.

---

## Phase 19: User Story 14 — Command Menu (Priority: P3)

**Goal**: `!menu` returns a formatted list of all available commands.

**Independent Test**: Send `!menu` in a permitted group. Bot replies with the full command list.

### Implementation for User Story 14

- [X] T060 [US14] Create `internal/command/menu.go` — `MenuHandler`; `CanHandle`: body == `!menu`; `Handle`: build static formatted text listing all 20 commands with trigger, brief description, and example; reply with the formatted list
- [X] T061 [US14] Register `MenuHandler` in `cmd/bot/main.go`

**Checkpoint**: US14 complete. `!menu` shows the command reference.

---

## Phase 20: User Story 15 — Hotline Information (Priority: P3)

**Goal**: `!aa` replies with AA hotline information.

**Independent Test**: Send `!aa` in a permitted group. Bot replies with `0800-725-6366` and the website.

### Implementation for User Story 15

- [X] T062 [US15] Create `internal/command/aa.go` — `AaHandler`; `CanHandle`: body == `!aa`; `Handle`: reply with Portuguese AA message including hotline `0800-725-6366` and official website
- [X] T063 [US15] Register `AaHandler` in `cmd/bot/main.go`

**Checkpoint**: US15 complete.

---

## Phase 21: User Story 16b — Automatic Responses (easter eggs)

**Goal**: The `deuita` substring auto-reply and the targeted probabilistic reply work in permitted groups.

**Independent Test**: Send a message containing `deuita` in a permitted group. Bot replies with the fixed response.

### Implementation

- [X] T064 [P] [US16] Create `internal/command/deuita.go` — `DeuitaHandler`; `CanHandle`: `strings.Contains(strings.ToLower(body), "deuita")` AND not bot's own message; `Handle`: reply `🤖 pau no cu do deuita`
- [X] T065 [P] [US16] Create `internal/command/gilso.go` — `GilsoHandler`; `CanHandle`: sender JID matches hardcoded value AND `rand.Float64() < 0.15`; no permission check; `Handle`: reply `🤖 cala boca seu corrupto`
- [X] T066 [US16] Register `DeuitaHandler` and `GilsoHandler` in `cmd/bot/main.go`

**Checkpoint**: All user stories complete.

---

## Phase 22: Message Persistence (Cross-cutting, all stories that use stats)

**Purpose**: Persist message records for all groups with `SAVE_MESSAGE` permission. Required by US8, US9, US10 but implemented as a cross-cutting concern in the message listener.

- [X] T067 Update `internal/bot/dispatcher.go` (or `internal/listener/message.go`) — after passing replay check, if group has `SAVE_MESSAGE` permission, construct `MessageRecord` from event fields (ID, group JID, author JID, type, has_media, is_forwarded, character_count, day string in UTC-3, timestamp) and call `MessageRepo.Save`; also upsert `GroupMember` from `evt.Info.PushName` if non-empty

---

## Phase 23: Polish & Cross-Cutting Concerns

**Purpose**: Observability, error hardening, Dockerfile, and documentation.

- [X] T068 [P] Create `internal/bot/logger.go` — structured log helper; define `EventLog` struct (`CorrelationID`, `HandlerName`, `Outcome`, `LatencyMs`, `Error`); implement `LogEvent(log EventLog)` writing JSON to stdout (FR-024); use `BOT_DB_PATH`-based correlation ID generation (message ID)
- [X] T069 [P] Create `Dockerfile` — multi-stage: `golang:1.22-alpine` builder → `alpine:latest` runtime; install `ffmpeg` in runtime stage; copy binary; `ENTRYPOINT ["./leniser-bot"]`
- [X] T070 [P] Update `docker-compose.yml` — replace existing Node.js service with Go service; mount `bot_data` volume for `bot.db`; pass all env vars via `env_file: .env`
- [ ] T071 [P] Update `README.md` — replace yarn/Node.js instructions with Go quickstart (reference `specs/001-whatsapp-bot-functional-spec/quickstart.md`)
- [X] T072 Verify full `go build ./...` and `go vet ./...` pass with no errors
- [ ] T073 [P] Run `go test ./...` and confirm all tests pass
- [ ] T074 End-to-end smoke test per `quickstart.md` — QR pair, send `!ping`, `!menu`, `!bot hello`, `!ranking`; verify responses

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 completion — **blocks all user stories**
- **US17, US1 (Phases 3–4)**: Depend on Foundational only — implement first (no external services)
- **US18 (Phase 5)**: Depends on Foundational — API management layer
- **US16 (Phase 6)**: Depends on Foundational
- **US2 (Phase 7)**: Depends on Foundational + `OpenAIService` (T030)
- **US3 (Phase 8)**: Depends on `OpenAIService` (T030) being complete — shares it with US2
- **US4, US5 (Phases 9–10)**: Depend on `OpenAIService` (T030) — can start in parallel with US2
- **US6 (Phase 11)**: Depends on `SunoService` (T039) — independent of OpenAI
- **US7 (Phase 12)**: Depends on `ImgflipService` (T042) — independent
- **US8, US9, US10 (Phases 13–15)**: Depend on `MessageRepo` persistence (T067)
- **US11, US12, US13, US14, US15 (Phases 16–20)**: Depend only on Foundational
- **Message Persistence (Phase 22)**: Should be implemented immediately after T017 (dispatcher); stats stories depend on it
- **Polish (Phase 23)**: After all desired stories complete

### User Story Dependencies

- **US1 (P1)**: No service dependencies — implement first
- **US17 (P1)**: No service dependencies — implement alongside US1
- **US2 (P1)**: Needs `OpenAIService` — blocks US3, US4, US5 on the service layer (but the service is shared, not duplicated)
- **US3 (P1)**: Shares `OpenAIService` with US2
- **US4, US5 (P2)**: Share `OpenAIService` with US2
- **US6 (P2)**: Independent `SunoService`
- **US7 (P2)**: Independent `ImgflipService`
- **US8, US9, US10 (P2/P3)**: Require message persistence (T067) to be active
- **US11–US15 (P3)**: No external service dependencies beyond the bot skeleton

### Parallel Opportunities

All tasks marked `[P]` within a phase can be worked on simultaneously. Specifically:

```bash
# Phase 1: can all run in parallel after T001
T002 T003 T004 T005 T007

# Phase 2 storage layer: all parallel
T011 T012 T013 T014 T015

# After OpenAIService is done (T030):
T031  # !bot
T035  # !fala   (different file)
T037  # !transcrever (different file)

# Meme commands: parallel
T043 T044

# Polls: parallel
T057 T058

# Easter eggs: parallel
T064 T065

# Polish: parallel
T068 T069 T070 T071 T073
```

---

## Implementation Strategy

### MVP First (User Stories 1, 17, 2, 3)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL)
3. Complete Phase 3 (US1: `!ping`) → **validate bot is alive**
4. Complete Phase 4 (US17: group auto-register)
5. Complete Phase 5 (US18: REST API management) → **can now grant permissions from frontend**
6. Complete Phase 7 (US2: `!bot`) → **core AI feature working**
7. Complete Phase 8 (US3: `!imagem`) → **image generation with cooldown**
8. **STOP and VALIDATE**: Test all MVP features end-to-end per `quickstart.md`

### Incremental Delivery

After MVP, add stories in priority order:
- P2: US16 (deletion disclosure), US4 (`!fala`), US5 (`!transcrever`), US6 (`!musica`), US7 (memes), US8 (`!resumo`), US9 (`!ranking`)
- P3: US10 (`!msgsdia`), US11 (`!sticker`), US12 (`!mp3`), US13 (polls), US14 (`!menu`), US15 (`!aa`)
- Cross-cutting: T067 (message persistence) — enable before US8/US9/US10

### Parallel Team Strategy

With multiple developers:
1. **Dev A**: Phase 1–2 (foundation, storage, bot skeleton)
2. **Dev B** (once storage interfaces exist): `OpenAIService` (T030) + `SunoService` (T039) + `ImgflipService` (T042)
3. **Dev A** completes: command registry, dispatcher, API server
4. Devs work in parallel on individual command files (each is an independent file)

---

## Notes

- `[P]` tasks = different files, no unresolved dependencies at time of execution
- `[Story]` label maps each task to a user story for traceability
- Each user story phase is independently completable and testable
- Register every new `Handler` in `cmd/bot/main.go` — the registry is the single authoritative list
- Message persistence (T067) is a pre-requisite for US8, US9, US10 — implement it before or alongside those phases
- `ConvertToMP3` (T054) requires `ffmpeg` on `$PATH`; the Dockerfile must install it (T069)
- All external service calls must have an explicit `context.WithTimeout` — enforced in each service file, not in the dispatcher
