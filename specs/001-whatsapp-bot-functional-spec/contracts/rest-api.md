# REST API Contract: Bot Management API

**Version**: v1
**Base path**: `/api/v1`
**Authentication**: All endpoints require `Authorization: Bearer <BOT_API_KEY>` header.
**Content-Type**: `application/json` for all request and response bodies.
**CORS**: Configurable via `BOT_CORS_ORIGIN` env var (default: `*` in dev, explicit origin in prod).

---

## Error Response Format

All errors return a JSON body:

```json
{
  "error": "human-readable message"
}
```

Standard HTTP status codes apply: `400` bad request, `401` unauthorized,
`404` not found, `409` conflict, `422` validation error, `500` internal error.

---

## Groups

### `GET /api/v1/groups`

List all registered groups.

**Response `200`**:
```json
[
  {
    "jid": "120363000000000000@g.us",
    "name": "Família Silva",
    "permissions": ["MESSAGE_CREATE", "SAVE_MESSAGE"],
    "config": {
      "bot_prefix": "🤖",
      "system_prompt": "",
      "image_cooldown_enabled": false,
      "image_cooldown_minutes": 60
    },
    "created_at": "2026-05-19T10:00:00Z",
    "updated_at": "2026-05-19T10:00:00Z"
  }
]
```

`config` is the **resolved** config (global defaults merged with per-group
overrides). The frontend always sees the effective value.

---

### `GET /api/v1/groups/{jid}`

Get a single group by JID.

**Path params**: `jid` — URL-encoded WhatsApp JID.

**Response `200`**: Same shape as a single element in the list above.

**Response `404`**: Group not found.

---

### `PUT /api/v1/groups/{jid}/permissions`

Replace the full set of permissions for a group.

**Request body**:
```json
{
  "permissions": ["MESSAGE_CREATE", "SAVE_MESSAGE"]
}
```

Valid permission values: `"MESSAGE_CREATE"`, `"SAVE_MESSAGE"`, `"MESSAGE_REVOKE"`.

**Response `200`**:
```json
{
  "jid": "120363000000000000@g.us",
  "permissions": ["MESSAGE_CREATE", "SAVE_MESSAGE"]
}
```

**Response `422`**: Unknown permission value in the list.

---

### `PUT /api/v1/groups/{jid}/config`

Update per-group configuration overrides. Send only the fields to override;
omit or send `null` to clear an override and revert to the global default.

**Request body**:
```json
{
  "bot_prefix": "👾",
  "system_prompt": "Responda sempre em inglês.",
  "image_cooldown_enabled": true,
  "image_cooldown_minutes": 30
}
```

All fields are optional. Sending `null` for a field clears the override.

**Response `200`**: The resolved (merged) config for that group:
```json
{
  "bot_prefix": "👾",
  "system_prompt": "Responda sempre em inglês.",
  "image_cooldown_enabled": true,
  "image_cooldown_minutes": 30
}
```

**Response `422`**: Validation error (e.g. `image_cooldown_minutes` out of range).

---

### `POST /api/v1/groups/{jid}/messages`

Send a text message to a group from the web frontend.

**Request body**:
```json
{
  "text": "Mensagem enviada pelo painel."
}
```

**Response `202`**:
```json
{
  "status": "queued"
}
```

**Response `404`**: Group not found.
**Response `422`**: `text` is empty or exceeds 4096 characters.

---

## Global Configuration

### `GET /api/v1/config`

Get the global default configuration.

**Response `200`**:
```json
{
  "bot_prefix": "🤖",
  "system_prompt": "",
  "image_cooldown_enabled": false,
  "image_cooldown_minutes": 60,
  "updated_at": "2026-05-19T10:00:00Z"
}
```

---

### `PUT /api/v1/config`

Update global defaults. All fields are required.

**Request body**:
```json
{
  "bot_prefix": "🤖",
  "system_prompt": "Você é um assistente divertido.",
  "image_cooldown_enabled": true,
  "image_cooldown_minutes": 120
}
```

**Response `200`**: The updated config (same shape as GET response).

**Response `422`**: Validation error.

---

## Statistics (Read-only)

### `GET /api/v1/groups/{jid}/stats/ranking`

Get message-count ranking for a group.

**Query params**:

| Param | Values | Description |
|---|---|---|
| `period` | `all`, `day`, `week`, `month` | Time window. Default: `all`. |
| `date` | `YYYY-MM-DD` | Specific date (overrides `period`). |

**Response `200`**:
```json
{
  "group_jid": "120363000000000000@g.us",
  "period": "week",
  "total_messages": 342,
  "ranking": [
    { "user_jid": "5511999990000@s.whatsapp.net", "name": "João", "count": 120, "pct": 35.09 },
    { "user_jid": "5511999991111@s.whatsapp.net", "name": "Maria", "count": 90,  "pct": 26.32 }
  ]
}
```

---

### `GET /api/v1/groups/{jid}/stats/daily`

Get per-calendar-day message counts for a group (all time).

**Response `200`**:
```json
{
  "group_jid": "120363000000000000@g.us",
  "days": [
    { "date": "2026-05-19", "count": 87 },
    { "date": "2026-05-18", "count": 120 }
  ]
}
```

---

## Bot Connection Status

### `GET /api/v1/status`

Returns the current WhatsApp connection state. No auth required (used by
frontend dashboard to show bot liveness).

**Response `200`**:
```json
{
  "connected": true,
  "phone": "+5511999990000",
  "since": "2026-05-19T08:00:00Z"
}
```

**Response `200`** (disconnected):
```json
{
  "connected": false,
  "phone": null,
  "since": null
}
```

> Note: This endpoint is intentionally unauthenticated because the information
> it exposes (bot online/offline) is not sensitive and the frontend's loading
> screen needs it before the user might have injected the API key.
> Reconsider if multi-user access is added in the future.

---

## Future Endpoints (Planned, Not in Scope for This Phase)

The following endpoints are **not implemented in this phase** but the API
path structure is reserved to avoid future conflicts:

- `POST /api/v1/auth/qr` — serve QR code for WhatsApp pairing
- `POST /api/v1/auth/logout` — disconnect and clear session
- `GET /api/v1/events` — SSE stream for live incoming message events
- `GET /api/v1/groups/{jid}/members` — list group members from WhatsApp
- `DELETE /api/v1/groups/{jid}` — remove group record
