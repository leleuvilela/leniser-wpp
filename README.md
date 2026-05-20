# Leniser WhatsApp Bot

A WhatsApp bot written in Go using [whatsmeow](https://go.mau.fi/whatsmeow), with a management REST API.

## Prerequisites

- Go 1.22+
- `ffmpeg` on `$PATH` (required for `!mp3` command)
- Docker + Docker Compose (optional)
- A dedicated WhatsApp number

## Environment Variables

Create a `.env` file at the repository root:

```env
BOT_DB_PATH=./bot.db
BOT_API_ADDR=:8080
BOT_API_KEY=change-me-to-a-random-secret
BOT_CORS_ORIGIN=http://localhost:3000
OPENAI_API_KEY=sk-...
SUNO_API_URL=https://sunoapi-eight.vercel.app/api/generate
IMGFLIP_USERNAME=...
IMGFLIP_PASSWORD=...
LOG_LEVEL=info
APP_ENV=production
```

## First Run (QR Code Pairing)

```bash
go run ./cmd/bot
```

Scan the QR code printed to the terminal with WhatsApp (`Linked Devices → Link a Device`). The session is saved to `BOT_DB_PATH` and reused on subsequent restarts.

## Build

```bash
go build -o leniser-bot ./cmd/bot
./leniser-bot
```

Cross-compile to Linux:

```bash
GOOS=linux GOARCH=amd64 CGO_ENABLED=0 go build -o leniser-bot-linux ./cmd/bot
```

## Docker Compose

```bash
docker compose up -d --build
docker compose logs -f bot   # find QR code on first run
```

## Management API

The REST API is available at `http://localhost:8080/api/v1`.

```bash
# Check connection status (no auth required)
curl http://localhost:8080/api/v1/status

# List groups
curl -H "Authorization: Bearer $BOT_API_KEY" http://localhost:8080/api/v1/groups

# Grant permissions to a group
curl -X PUT \
     -H "Authorization: Bearer $BOT_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{"permissions":["MESSAGE_CREATE","SAVE_MESSAGE"]}' \
     "http://localhost:8080/api/v1/groups/<GROUP_JID>/permissions"
```

## Commands

| Command | Description |
|---------|-------------|
| `!ping` | Check bot is alive |
| `!bot [prompt]` | AI conversation (ChatGPT) |
| `!imagem [prompt]` | AI image generation |
| `!fala [text]` | Text-to-speech |
| `!transcrever` | Transcribe audio (reply to voice note) |
| `!musica [prompt]` | AI music generation |
| `!meme [query]` | Search meme |
| `!aimeme [prompt]` | AI meme generation |
| `!resumo [N]` | Summarise last N messages |
| `!ranking [period]` | Message count leaderboard |
| `!msgsdia` | Daily message volume |
| `!sticker` | Convert image/video to sticker |
| `!mp3` | Convert audio/video to MP3 |
| `!checagem` | Send a poll |
| `!vainele` | Send a poll |
| `!menu` | Show all commands |
| `!aa` | AA hotline information |

For full details see [specs/001-whatsapp-bot-functional-spec/quickstart.md](specs/001-whatsapp-bot-functional-spec/quickstart.md).
