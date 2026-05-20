# WhatsApp Command Contract

**Feature**: `001-whatsapp-bot-functional-spec`
**Date**: 2026-05-19

This document is the canonical reference for all WhatsApp commands the bot
understands. It is the contract between the `internal/command/` package and
the users who interact with the bot in WhatsApp groups.

---

## Handler Interface

Every command implements:

```go
// internal/command/handler.go
type Handler interface {
    // CanHandle returns true if this handler should process the event.
    // Must be fast (no I/O); used in the dispatch loop.
    CanHandle(evt *events.Message, group *storage.Group) bool

    // Handle processes the event. Returns an error only for unexpected
    // failures; user-facing errors are sent as WhatsApp replies, not
    // returned here.
    Handle(ctx context.Context, evt *events.Message, group *storage.Group) error
}
```

The `CommandRegistry` iterates all registered handlers in order per message.
**Multiple handlers may match the same message** (e.g. `deuita` substring
handler + no other — but in practice predicates are disjoint).

---

## Permission Gate

All commands except `!ping` require the group to have the `MESSAGE_CREATE`
permission. The dispatcher checks this before calling `CanHandle`. If the
group lacks the permission, the message is silently ignored — no reply.

`!ping` bypasses the permission check entirely (any group, any user).

---

## Trigger Types

| Type | Description | Example |
|---|---|---|
| `prefix` | Body starts with a fixed string | `!bot hello` |
| `prefix-reply` | Prefix + message must be a reply to another message | `!transcrever` as reply |
| `substring` | Body contains a string (case-insensitive), no prefix required | any message containing `deuita` |
| `author-id` | Automatic; fires based on sender JID, probabilistic | targeted reply |

---

## Command Reference

### `!ping`
| Field | Value |
|---|---|
| Trigger type | `prefix` |
| Prefix | `!ping` |
| Permission required | None |
| Cooldown | None |
| Input | None |
| Reply | `{prefix} pong!` |
| Error cases | None |

---

### `!menu`
| Field | Value |
|---|---|
| Trigger type | `prefix` |
| Prefix | `!menu` |
| Permission required | `MESSAGE_CREATE` |
| Cooldown | None |
| Input | None |
| Reply | Formatted list of all available commands |
| Error cases | None |

---

### `!aa`
| Field | Value |
|---|---|
| Trigger type | `prefix` |
| Prefix | `!aa` |
| Permission required | `MESSAGE_CREATE` |
| Cooldown | None |
| Input | None |
| Reply | Alcoholics Anonymous hotline (`0800-725-6366`) and website |
| Error cases | None |

---

### `!bot`
| Field | Value |
|---|---|
| Trigger type | `prefix` (optionally with quoted message chain) |
| Prefix | `!bot` |
| Permission required | `MESSAGE_CREATE` |
| Cooldown | None |
| Input | Text prompt after `!bot`; optional quoted message chain (text / image / audio) |
| Typing indicator | Shown during AI processing |
| Reply | AI-generated response using the group's (or global) system prompt |
| Registers | `ReqText` on success |
| Error cases | No prompt and no quoted context → reply asking for content. AI timeout/failure → user-facing error, no retry (FR-025). |

**Multi-turn context resolution**:
1. Walk the quoted message chain recursively (quoted → quoted's quoted → …).
2. For each message: extract text body; if image, download + pass as image
   context; if audio/voice, transcribe via Whisper and inject as
   `"Transcrição de áudio: …"`.
3. Assemble messages oldest-first and send to the AI model.

---

### `!fala`
| Field | Value |
|---|---|
| Trigger type | `prefix` or `prefix-reply` |
| Prefix | `!fala` |
| Permission required | `MESSAGE_CREATE` |
| Cooldown | None |
| Input | Text after `!fala`; OR body of the quoted message (if sent as reply and no inline text) |
| Recording indicator | Shown during TTS synthesis |
| Reply | Audio message (`audio/mpeg`) with synthesised speech |
| Registers | `ReqAudio` on success |
| Error cases | No text and no quoted text body → error reply. TTS failure → user-facing error (Portuguese), no retry. |

---

### `!imagem`
| Field | Value |
|---|---|
| Trigger type | `prefix` |
| Prefix | `!imagem` |
| Permission required | `MESSAGE_CREATE` |
| Cooldown | Per-group; controlled by `image_cooldown_enabled` and `image_cooldown_minutes` in group/global config |
| Input | Prompt text after `!imagem` |
| Reply | Generated image (`image/jpeg`) |
| Registers | `ReqImage` on success |
| Error cases | In cooldown → reply with cooldown notice, no service call. No prompt → error reply. Image service failure → user-facing error, no retry. Missing image data → specific error message. |

**Cooldown check** (before calling the image service):
```
last = ReqRegisterRepo.LastByGroup(ctx, groupJID, ReqImage)
if last != nil && time.Since(last.CreatedAt) < cooldownDuration {
    reply("Pera aí, tá em cooldown...")
    return
}
```

---

### `!musica` / `!música`
| Field | Value |
|---|---|
| Trigger type | `prefix` |
| Prefixes | `!musica`, `!música` |
| Permission required | `MESSAGE_CREATE` |
| Cooldown | None |
| Input | Prompt text |
| Immediate reply | Warning: "Gerando música... (Leva em média 3 minutos)" |
| Final reply | Audio file from the generated track |
| Registers | `ReqAudio` on success |
| Error cases | Music service error response → reply with failure notice. Service timeout → user-facing error, no retry. |

---

### `!meme`
| Field | Value |
|---|---|
| Trigger type | `prefix` |
| Prefix | `!meme` |
| Permission required | `MESSAGE_CREATE` |
| Cooldown | None |
| Input | Search query after `!meme` |
| Reply | First matching meme image |
| Registers | `ReqMeme` on success |
| Error cases | No results → error reply. Service failure → user-facing error, no retry. |

---

### `!aimeme`
| Field | Value |
|---|---|
| Trigger type | `prefix` |
| Prefix | `!aimeme` |
| Permission required | `MESSAGE_CREATE` |
| Cooldown | None |
| Input | Prompt (English works best) |
| Reply | AI-generated meme image |
| Registers | `ReqMeme` on success |
| Error cases | Service failure → user-facing error, no retry. |

---

### `!transcrever`
| Field | Value |
|---|---|
| Trigger type | `prefix-reply` (must reply to an audio or voice message) |
| Prefix | `!transcrever` |
| Permission required | `MESSAGE_CREATE` |
| Cooldown | None |
| Input | Quoted audio/voice message |
| Typing indicator | Shown during transcription |
| Reply | Transcribed text |
| Registers | `ReqAudio` on success |
| Error cases | No quoted message, or quoted message is not audio/voice → error reply. Transcription failure → user-facing error, no retry. |

---

### `!resumo`
| Field | Value |
|---|---|
| Trigger type | `prefix` |
| Prefix | `!resumo` |
| Permission required | `MESSAGE_CREATE` |
| Cooldown | None |
| Input | Optional integer N (default 50, max 200) |
| Reply | AI-generated natural-language summary of the last N messages |
| Registers | `ReqText` on success |
| Error cases | N > 200 → capped to 200. No stored messages → empty-state reply. AI failure → user-facing error, no retry. |

**Group requires** `SAVE_MESSAGE` permission for stored messages to exist.

---

### `!sticker`
| Field | Value |
|---|---|
| Trigger type | `prefix` attached to image/video, OR `prefix-reply` to image/video |
| Prefix | `!sticker` |
| Permission required | `MESSAGE_CREATE` |
| Cooldown | None |
| Input | Attached image/video or quoted image/video |
| Reply | WhatsApp sticker (`sendMediaAsSticker: true`), author: "Bot" |
| Error cases | No media in message or quote → error reply. |

---

### `!mp3`
| Field | Value |
|---|---|
| Trigger type | `prefix-reply` (must reply to audio / voice / video) |
| Prefix | `!mp3` |
| Permission required | `MESSAGE_CREATE` |
| Cooldown | None |
| Input | Quoted audio/voice/video; optional filename after `!mp3` |
| Reply | Audio document attachment named `{filename}.mp3` (default: `converted.mp3`) |
| Error cases | No quoted audio/video → error reply. Conversion failure → user-facing error. |

---

### `!ranking`
| Field | Value |
|---|---|
| Trigger type | `prefix` |
| Prefix | `!ranking` |
| Permission required | `MESSAGE_CREATE` |
| Cooldown | None |
| Input | Optional period modifier and/or `graph` keyword |
| Reply | Ranked leaderboard of message counts |
| Error cases | No stored messages → empty-state reply. |

**Period modifiers**:

| Input | Window |
|---|---|
| *(none)* | All time |
| `dia` | Current calendar day (UTC-3) |
| `semana` | Current calendar week (Sunday start, UTC-3) |
| `mes` | Current calendar month (UTC-3) |
| `DD/MM/YYYY` | Specific date |

**`graph` keyword**: append a proportional `█` bar (max 30 chars) to each
entry, scaled relative to the top result.

---

### `!msgsdia`
| Field | Value |
|---|---|
| Trigger type | `prefix` |
| Prefix | `!msgsdia` |
| Permission required | `MESSAGE_CREATE` |
| Cooldown | None |
| Input | None |
| Reply | Per-calendar-day message counts, descending, with Portuguese day-of-week labels |
| Error cases | No stored messages → empty-state reply. |

---

### `!checagem`
| Field | Value |
|---|---|
| Trigger type | `prefix` |
| Prefix | `!checagem` |
| Permission required | `MESSAGE_CREATE` |
| Cooldown | None |
| Input | None |
| Reply | WhatsApp Poll: title `🍆🍆🍆 CHECAGEM DA PEÇA NO GRUPO 🍆🍆🍆`, options `MOLE / MEIA BOMBA / DURA / TOMEI UM TADALA` |
| Error cases | None |

---

### `!vainele`
| Field | Value |
|---|---|
| Trigger type | `prefix` |
| Prefix | `!vainele` |
| Permission required | `MESSAGE_CREATE` |
| Cooldown | None |
| Input | None |
| Reply | WhatsApp Poll: title `Vai nele? 🤔`, options `Sim / Não / Tal tal` |
| Error cases | None |

---

### `deuita` (automatic substring)
| Field | Value |
|---|---|
| Trigger type | `substring` (case-insensitive, not a command) |
| Substring | `deuita` |
| Permission required | `MESSAGE_CREATE` |
| Cooldown | None |
| Reply | `🤖 pau no cu do deuita` |
| Guard | Must not be the bot's own message (prevents loop) |
| Error cases | None |

---

### Targeted Probabilistic Reply (easter egg)
| Field | Value |
|---|---|
| Trigger type | `author-id` |
| Condition | Sender JID == hardcoded JID AND `rand.Float64() < 0.15` |
| Permission required | None |
| Cooldown | None |
| Reply | `🤖 cala boca seu corrupto` |
| Error cases | None |

---

## Listener Contracts (non-command events)

### Deletion Disclosure Listener

**Fires on**: `*events.Message` with inner `ProtocolMessage_REVOKE`.

**Condition**: Group has `MESSAGE_REVOKE` permission.

**Behaviour**: Posts to the group chat:
```
🤖 apagou mensagem né safado? @{sender_number}
_{original message body}_
```
Mentions (`@tag`) the deleting user. No action if the original message had no
text body.

---

### Group Join Listener

**Fires on**: `*events.GroupInfo` with `Join` action.

**Behaviour**: Upsert a `Group` record with the group JID and chat name.
Permissions list is empty. Idempotent (no error if group already exists).
