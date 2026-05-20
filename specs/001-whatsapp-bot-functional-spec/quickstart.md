# Quickstart: Leniser WhatsApp Bot (Go Rewrite)

**Feature**: `001-whatsapp-bot-functional-spec`
**Date**: 2026-05-19

---

## Prerequisites

- Go 1.22+ (`go version`)
- `ffmpeg` on `$PATH` (required for `!mp3` media conversion)
- Docker + Docker Compose (optional, for containerised deployment)
- A dedicated WhatsApp number (not your primary number — unofficial API)
- API keys for external services (see Environment Variables below)

---

## Environment Variables

Create a `.env` file at the repository root (never commit this file):

```env
# WhatsApp session database (SQLite)
BOT_DB_PATH=./bot.db

# Management API
BOT_API_ADDR=:8080
BOT_API_KEY=change-me-to-a-random-secret
BOT_CORS_ORIGIN=http://localhost:3000

# OpenAI (chat, TTS, image, Whisper)
OPENAI_API_KEY=sk-...

# Suno music generation proxy
SUNO_API_URL=https://sunoapi-eight.vercel.app/api/generate

# Imgflip (meme search + AI meme)
IMGFLIP_USERNAME=...
IMGFLIP_PASSWORD=...

# Log level: debug | info | warn | error (default: info)
LOG_LEVEL=info

# Environment: production | development (development disables some guards)
APP_ENV=production
```

---

## First Run (QR Code Pairing)

```bash
go run ./cmd/bot
```

On first run, a QR code is printed to the terminal. Scan it with WhatsApp
on your dedicated number (`Linked Devices → Link a Device`). The session is
saved to `BOT_DB_PATH` and reused on subsequent restarts.

---

## Subsequent Runs

```bash
go run ./cmd/bot
```

The bot reconnects silently using the stored session. No QR code required.

---

## Build

```bash
go build -o leniser-bot ./cmd/bot
./leniser-bot
```

The binary is statically linked (`modernc.org/sqlite` is pure Go). Cross-compilation
to Linux from macOS:

```bash
GOOS=linux GOARCH=amd64 go build -o leniser-bot-linux ./cmd/bot
```

---

## Running Tests

```bash
# All tests
go test ./...

# With verbose output
go test -v ./...

# A specific package
go test ./internal/command/...
go test ./internal/storage/sqlite/...
```

All tests are self-contained. No external services or network connections
are required. SQLite tests use an in-memory database (`:memory:`).

---

## Docker Compose

```yaml
# docker-compose.yml
services:
  bot:
    build: .
    restart: unless-stopped
    env_file: .env
    volumes:
      - bot_data:/data
    environment:
      BOT_DB_PATH: /data/bot.db

volumes:
  bot_data:
```

```bash
docker compose up -d --build
docker compose logs -f bot   # watch logs; find QR code on first run
```

---

## Management API

Once running, the REST API is available at `http://localhost:8080/api/v1`.

```bash
# Check connection status (no auth required)
curl http://localhost:8080/api/v1/status

# List groups (auth required)
curl -H "Authorization: Bearer $BOT_API_KEY" \
     http://localhost:8080/api/v1/groups

# Grant permissions to a group
curl -X PUT \
     -H "Authorization: Bearer $BOT_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{"permissions":["MESSAGE_CREATE","SAVE_MESSAGE"]}' \
     "http://localhost:8080/api/v1/groups/120363000000000000%40g.us/permissions"
```

Full API reference: [contracts/rest-api.md](contracts/rest-api.md)

---

## Adding a New Command

1. Create `internal/command/yourcommand.go`.
2. Implement the `Handler` interface (`CanHandle`, `Handle`).
3. Register the handler in `cmd/bot/main.go` (or a dedicated `wire.go`):
   ```go
   registry.Register(command.NewYourCommand(sender, deps...))
   ```
4. Add the command to the `!menu` response in `internal/command/menu.go`.
5. Write a unit test in `internal/command/yourcommand_test.go` using a fake
   `MessageSender`.

---

## Granting Permissions to a New Group

When the bot joins a group it auto-registers with no permissions. To activate
it via the API:

```bash
curl -X PUT \
  -H "Authorization: Bearer $BOT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"permissions":["MESSAGE_CREATE","SAVE_MESSAGE","MESSAGE_REVOKE"]}' \
  "http://localhost:8080/api/v1/groups/<GROUP_JID>/permissions"
```

Or use the web frontend (future) once it is available.

---

## Resetting the Session (Re-pair)

Delete the `bot.db` file (or `BOT_DB_PATH`) and restart. The bot will show a
new QR code. All application data (groups, permissions, message history)
stored in separate tables of the same DB file will also be lost — back up
first if needed.

To reset only the whatsmeow session tables without losing application data,
use the SQLite CLI to drop the `whatsmeow_*` tables:

```bash
sqlite3 bot.db "DROP TABLE IF EXISTS whatsmeow_device; ..."
```

Then restart the bot.
