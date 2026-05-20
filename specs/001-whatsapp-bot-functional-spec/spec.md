# Feature Specification: Leniser WhatsApp Bot — Functional Overview

**Feature Branch**: `001-whatsapp-bot-functional-spec`
**Created**: 2026-05-19
**Status**: Draft
**Input**: Reverse-engineered from existing source code in `./src`

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Bot Responsiveness Check (Priority: P1)

A group member wants to confirm the bot is online and responding. They send
`!ping` and the bot immediately replies with a confirmation message.

**Why this priority**: All other features depend on the bot being reachable.
This is the single fastest way to verify bot health without any external
service dependency.

**Independent Test**: Send `!ping` to a group where the bot is present.
Bot must reply within a few seconds regardless of whether any external service
is available.

**Acceptance Scenarios**:

1. **Given** the bot is running and present in a group, **When** any user sends
   `!ping`, **Then** the bot replies with `pong!` (optionally prefixed with the
   configured bot prefix).
2. **Given** the bot is restarting, **When** a `!ping` message arrives after
   restart, **Then** the bot processes and replies — confirming message replay
   is handled.

---

### User Story 2 — AI Conversation Assistant (Priority: P1)

A group member wants to ask a question or continue a conversation with the
bot by sending `!bot` followed by their prompt. The bot understands plain
text, responds to image context, and can follow multi-turn conversations by
reading quoted (replied-to) message chains.

**Why this priority**: `!bot` is the core AI interaction feature that drives
most of the bot's perceived value.

**Independent Test**: Send `!bot What is the capital of France?` in a
permitted group. Bot must respond with a coherent AI-generated answer.

**Acceptance Scenarios**:

1. **Given** a user sends `!bot [prompt]`, **When** the prompt is non-empty,
   **Then** the bot replies with a contextually relevant AI-generated response.
2. **Given** a user replies to a previous message (quote chain) with `!bot`,
   **When** the chain contains text and images, **Then** the bot includes both
   text and images as context for its response.
3. **Given** a user replies to an audio message with `!bot`, **When** the
   audio is accessible, **Then** the bot transcribes the audio and includes
   the transcription as part of the conversation context.
4. **Given** a user sends `!bot` with no prompt and no quoted context,
   **When** the bot receives the message, **Then** the bot replies asking the
   user to provide content.
5. **Given** a group has a custom system prompt configured, **When** `!bot` is
   used, **Then** the AI response follows the tone and constraints defined by
   that prompt.

---

### User Story 3 — AI Image Generation (Priority: P1)

A group member sends `!imagem [description]` to generate an image. The bot
calls an AI image generation service and returns the image directly in chat.
Groups can have a configurable cooldown to prevent overuse.

**Why this priority**: High-value, high-visibility feature; subject to
external API cost, so the cooldown mechanism is critical.

**Independent Test**: Send `!imagem a cat wearing sunglasses` in a permitted
group. Bot must reply with a generated image.

**Acceptance Scenarios**:

1. **Given** a user sends `!imagem [prompt]`, **When** the group is not in
   cooldown, **Then** the bot replies with the generated image.
2. **Given** a group has a cooldown enabled and a recent image was requested,
   **When** another `!imagem` is sent before the cooldown expires, **Then**
   the bot replies with a cooldown notice and does not call the image service.
3. **Given** the image service fails or returns no data, **When** `!imagem` is
   called, **Then** the bot replies with a user-friendly error message.

---

### User Story 4 — AI Text-to-Speech (Priority: P2)

A user sends `!fala [text]` (or replies to a text message with `!fala`) to
have the bot read the text aloud and reply with an audio message.

**Why this priority**: Adds entertainment value; depends on external TTS
service, so it is secondary to core text interaction.

**Independent Test**: Send `!fala hello world` in a permitted group. Bot must
reply with an audio message containing the synthesized speech.

**Acceptance Scenarios**:

1. **Given** a user sends `!fala [text]`, **When** the text is non-empty,
   **Then** the bot replies with an audio message in the same chat.
2. **Given** a user sends `!fala` as a reply to a text message, **When** the
   quoted message has a body, **Then** the bot synthesizes the quoted text into
   speech and replies with an audio message.
3. **Given** the TTS service fails, **When** `!fala` is called, **Then** the
   bot replies with an error message (in Portuguese).

---

### User Story 5 — Audio Transcription (Priority: P2)

A user replies to a voice or audio message with `!transcrever` to obtain a
text transcription of that audio.

**Why this priority**: Practical utility; complements `!bot`'s audio context
feature and serves accessibility needs.

**Independent Test**: Reply to an audio message with `!transcrever`. Bot must
respond with the transcribed text.

**Acceptance Scenarios**:

1. **Given** a user replies to an audio/voice message with `!transcrever`,
   **When** the audio is accessible, **Then** the bot replies with the
   transcribed text.
2. **Given** a user sends `!transcrever` without replying to any audio message,
   **When** the command is received, **Then** the bot replies with an error
   indicating no audio was found.

---

### User Story 6 — AI Music Generation (Priority: P2)

A user sends `!musica [description]` to have the bot generate an original
music track and share it as audio in the chat. The bot warns users the process
may take several minutes.

**Why this priority**: Experimental/entertainment feature; slow external
service makes it lower priority than instant-response features.

**Independent Test**: Send `!musica lo-fi chill beats` in a permitted group.
Bot must eventually reply with an audio message (even if it takes minutes).

**Acceptance Scenarios**:

1. **Given** a user sends `!musica [prompt]`, **When** the command is received,
   **Then** the bot immediately sends a progress notice indicating the
   estimated wait time (approximately 3 minutes).
2. **Given** the music generation completes successfully, **When** the audio is
   available, **Then** the bot sends the generated audio file in chat.
3. **Given** the music generation service returns an error, **When** the error
   is received, **Then** the bot notifies the user of the failure.

---

### User Story 7 — Meme Search and Generation (Priority: P2)

A user can retrieve an existing meme template (`!meme [query]`) or generate a
new AI-composed meme (`!aimeme [prompt]`) and have the bot post the image in
the chat.

**Why this priority**: Entertainment/social feature; no rate limiting risk
comparable to image generation.

**Independent Test**: Send `!meme drake` in a permitted group. Bot must reply
with a meme image.

**Acceptance Scenarios**:

1. **Given** a user sends `!meme [query]`, **When** matching templates exist,
   **Then** the bot replies with the first matching meme image.
2. **Given** a user sends `!aimeme [prompt]`, **When** the service is
   available, **Then** the bot replies with an AI-generated meme image.
3. **Given** no results are found or the service fails, **When** `!meme` is
   called, **Then** the bot replies with an appropriate error message.

---

### User Story 8 — Conversation Summary (Priority: P2)

A user sends `!resumo` (optionally with a number) to request an AI-generated
summary of the most recent messages in the group. The bot reads the last N
messages, resolves participant names, and produces a natural-language recap.

**Why this priority**: High utility for catching up in active groups; depends
on both message history storage and AI, so it requires both to be operational.

**Independent Test**: In a group where messages are being saved, send `!resumo
20`. Bot must reply with a readable summary mentioning participant names.

**Acceptance Scenarios**:

1. **Given** a user sends `!resumo`, **When** there are stored messages for
   the group, **Then** the bot replies with a summary of up to 50 recent
   messages.
2. **Given** a user sends `!resumo [N]` where N ≤ 200, **When** there are at
   least N stored messages, **Then** the bot summarizes the last N messages.
3. **Given** a user sends `!resumo [N]` where N > 200, **When** the command
   is processed, **Then** the bot caps the count at 200 and proceeds.
4. **Given** no stored messages exist for the group, **When** `!resumo` is
   sent, **Then** the bot provides a meaningful empty-state response.

---

### User Story 9 — Message Statistics: Ranking (Priority: P2)

A user sends `!ranking` (with optional modifiers) to see a leaderboard of
group members ordered by message count for a given time period.

**Why this priority**: Engagement/gamification feature; requires message
history collection to be active.

**Independent Test**: In a group with stored messages, send `!ranking semana`.
Bot must reply with a ranked list of members and their weekly message counts.

**Acceptance Scenarios**:

1. **Given** a user sends `!ranking`, **Then** the bot replies with an
   all-time ranking of members by message count for that group.
2. **Given** a user sends `!ranking dia`, **Then** the ranking is scoped to
   today's messages only.
3. **Given** a user sends `!ranking semana`, **Then** the ranking covers the
   current calendar week.
4. **Given** a user sends `!ranking mes`, **Then** the ranking covers the
   current calendar month.
5. **Given** a user sends `!ranking DD/MM/YYYY`, **Then** the ranking covers
   that specific date.
6. **Given** the `graph` keyword is appended (e.g., `!ranking graph`), **Then**
   each entry includes a proportional bar chart alongside the count.

---

### User Story 10 — Message Statistics: Daily Volume (Priority: P3)

A user sends `!msgsdia` to see how many messages were sent in the group on
each calendar day, presented in descending order.

**Why this priority**: Informational; lower urgency than the ranking feature.

**Independent Test**: Send `!msgsdia` in a group with stored messages. Bot
must reply with a list of dates and counts in Portuguese day-of-week format.

**Acceptance Scenarios**:

1. **Given** a user sends `!msgsdia`, **When** the group has stored message
   history, **Then** the bot replies with a per-day message count, sorted from
   most recent to oldest, with Portuguese day-of-week labels.

---

### User Story 11 — Sticker Creation (Priority: P3)

A user can convert an image or video to a WhatsApp sticker by sending
`!sticker` attached to the media or as a reply to a media message.

**Why this priority**: Fun/utility feature with no external service
dependency, making it low-risk and easy to implement.

**Independent Test**: Reply to an image with `!sticker`. Bot must resend the
image as a WhatsApp sticker.

**Acceptance Scenarios**:

1. **Given** a user sends `!sticker` while attaching an image or video,
   **Then** the bot replies with that media converted to a sticker.
2. **Given** a user replies to an image or video with `!sticker`, **Then**
   the bot replies with the quoted media converted to a sticker.
3. **Given** the message has no media and is not a reply to media, **Then**
   the bot replies with an error indicating no media was found.

---

### User Story 12 — Media Conversion to MP3 (Priority: P3)

A user replies to an audio, voice, or video message with `!mp3` to receive the
media converted to an MP3 file, optionally specifying a filename.

**Why this priority**: Utility feature; depends on a local media conversion
tool.

**Independent Test**: Reply to a voice note with `!mp3`. Bot must reply with
the audio as an MP3 file.

**Acceptance Scenarios**:

1. **Given** a user replies to an audio/voice message with `!mp3`, **Then**
   the bot replies with the audio converted to MP3.
2. **Given** a user sends `!mp3 mysong` as the command, **Then** the bot names
   the returned file `mysong.mp3`.
3. **Given** no audio or video is quoted, **When** `!mp3` is sent, **Then**
   the bot replies with an error.

---

### User Story 13 — Polls (Priority: P3)

A user can trigger pre-defined WhatsApp polls in the group using shortcut
commands. Two polls are available: a fun group engagement check (`!checagem`)
and a yes/no decision poll (`!vainele`).

**Why this priority**: Lightweight social feature; no external dependencies.

**Independent Test**: Send `!checagem` in a permitted group. Bot must post a
WhatsApp poll with the defined options.

**Acceptance Scenarios**:

1. **Given** a user sends `!checagem`, **Then** the bot sends a poll with the
   defined title and options.
2. **Given** a user sends `!vainele`, **Then** the bot sends a yes/no poll
   with the defined options.

---

### User Story 14 — Command Menu (Priority: P3)

A user sends `!menu` to receive a formatted list of all available commands
with brief descriptions and usage examples.

**Why this priority**: Discoverability aid; secondary to the commands
themselves.

**Independent Test**: Send `!menu` in a permitted group. Bot must reply with a
structured list of commands.

**Acceptance Scenarios**:

1. **Given** a user sends `!menu`, **Then** the bot replies with a complete,
   formatted list of all available commands.

---

### User Story 15 — Hotline Information (Priority: P3)

A user sends `!aa` to receive information about the Alcoholics Anonymous
support hotline.

**Why this priority**: Static informational content; no external dependencies.

**Independent Test**: Send `!aa` in a permitted group. Bot must reply with the
AA hotline number and website.

**Acceptance Scenarios**:

1. **Given** a user sends `!aa`, **Then** the bot replies with the national AA
   hotline (`0800-725-6366`) and official website link.

---

### User Story 16 — Deleted Message Disclosure (Priority: P2)

When a group member deletes a message for everyone, the bot automatically
quotes the deleted message content and tags the sender — effectively
preventing silent deletions in groups that have this feature enabled.

**Why this priority**: Trust/transparency feature for group owners; must be
opt-in at the group level.

**Independent Test**: In a group with the revoke feature enabled, delete a
previously sent text message. Bot must immediately post the original content
and tag the deleting user.

**Acceptance Scenarios**:

1. **Given** a group has the deleted-message disclosure feature enabled,
   **When** a member deletes a text message for everyone, **Then** the bot
   posts the original message body and mentions the deleter.
2. **Given** the deleted message was a media-only message (no text body),
   **When** the revoke event fires, **Then** the bot does not attempt to
   disclose content (no body to share).
3. **Given** a group does NOT have the feature enabled, **When** a member
   deletes a message, **Then** the bot does nothing.

---

### User Story 17 — New Group Auto-Registration (Priority: P1)

When the bot is added to a new WhatsApp group, the group is automatically
registered in the system with a default (no-permissions) profile so it can
later be granted bot functionality by an administrator.

**Why this priority**: Required for the entire on-boarding flow; without this,
new groups cannot use the bot.

**Independent Test**: Add the bot to a new group. Verify a new group record
with empty permissions is created in the system.

**Acceptance Scenarios**:

1. **Given** the bot is added to a group that has not been seen before,
   **When** the join event fires, **Then** a new group record is created with
   the group's name and an empty permissions list.
2. **Given** the bot is added to a group that already exists in the system,
   **When** the join event fires, **Then** no duplicate record is created.

---

### Edge Cases

- What happens when the bot is offline and receives a flood of messages on
  reconnect? Messages older than 20 seconds are silently discarded and not
  processed as commands.
- What happens when a group member is not registered in the system? The bot
  treats them as having no permissions, effectively denying all commands.
- What happens when the AI service is unavailable? The bot replies with a
  user-facing error message; it does not crash or hang indefinitely.
- What happens when the image generation cooldown is not yet expired? The bot
  replies with a cooldown notice and does not call the external service.
- What happens when a quoted audio in a `!bot` chain cannot be transcribed?
  The bot includes a fallback note in the conversation context (transcription
  error) rather than failing the whole request.
- What happens when `!resumo` is requested and member display names are not
  available for some JIDs? The bot falls back to the raw JID identifier.
- What happens when an external service call times out or returns an error?
  The bot replies with a user-facing error immediately — no retries are
  attempted. The user may resend the command.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The bot MUST respond to `!ping` in any group where it is
  present, regardless of group permissions, to confirm liveness.
- **FR-002**: The bot MUST respond to `!bot [prompt]` using an AI language
  model, supporting multi-turn context via quoted message chains (text, image,
  and audio inputs).
- **FR-003**: The bot MUST respond to `!imagem [prompt]` by generating and
  returning an AI-generated image, subject to a per-group configurable
  cooldown.
- **FR-004**: The bot MUST respond to `!fala [text]` (or `!fala` as a reply)
  by synthesizing the text into speech and returning an audio message.
- **FR-005**: The bot MUST respond to `!transcrever` (as a reply to an
  audio/voice message) by returning a text transcription of that audio.
- **FR-006**: The bot MUST respond to `!musica [prompt]` by generating and
  returning an AI-composed audio track, with an upfront wait-time warning.
- **FR-007**: The bot MUST respond to `!meme [query]` with a meme image
  matching the query, and to `!aimeme [prompt]` with an AI-generated meme.
- **FR-008**: The bot MUST respond to `!resumo [N]` (N ≤ 200, default 50) by
  generating an AI-authored natural-language summary of recent group messages.
- **FR-009**: The bot MUST respond to `!ranking [period] [graph]` with a
  message-count leaderboard for the requested time window, with an optional
  bar chart.
- **FR-010**: The bot MUST respond to `!msgsdia` with a per-calendar-day
  message-count breakdown for the group.
- **FR-011**: The bot MUST respond to `!sticker` (attached to or replying to
  image/video) by returning the media as a WhatsApp sticker.
- **FR-012**: The bot MUST respond to `!mp3` (as a reply to audio/voice/video)
  by returning the media converted to MP3, with optional filename.
- **FR-013**: The bot MUST respond to `!checagem` and `!vainele` by posting
  pre-defined WhatsApp polls.
- **FR-014**: The bot MUST respond to `!menu` with a formatted list of all
  available commands.
- **FR-015**: The bot MUST respond to `!aa` with Alcoholics Anonymous contact
  information.
- **FR-016**: In groups with the deleted-message disclosure feature enabled,
  the bot MUST automatically post the body of any text message deleted for
  everyone, tagging the deleter.
- **FR-017**: When added to a new group, the bot MUST automatically create a
  group record with the group's name and an empty permissions profile.
- **FR-018**: The bot MUST only respond to commands from groups/chats that
  have been granted the appropriate permissions in the system. New groups start
  with no permissions. Permissions are managed exclusively via direct database
  access by an operator; no in-bot command exists for permission management.
- **FR-019**: Messages in groups with the message-saving permission enabled
  MUST be persisted for use in statistics and summary features.
- **FR-020**: Every AI-powered command that completes successfully MUST log
  a request register (type, author, group, timestamp) for audit and rate
  management purposes.
- **FR-021**: Messages arriving more than 20 seconds in the past (e.g., after
  a reconnect) MUST NOT be processed as commands.
- **FR-022**: Per-group configuration (bot reply prefix, AI system prompt,
  image cooldown settings) MUST be customizable at the group level, with
  system-wide defaults as fallback.
- **FR-023**: The bot MUST NOT persist or log message body content that would
  identify individual users at a non-debug verbosity level.
- **FR-024**: Every incoming WhatsApp event processed by the bot MUST emit a
  structured log entry containing: a correlation identifier for that message,
  the name of the handler invoked (or "no-match" if none matched), the outcome
  (success / failure / skipped), and the elapsed processing time. No external
  monitoring tool is required.
- **FR-025**: All calls to external services (AI providers, music generation,
  meme services) MUST have an explicit timeout. On failure or timeout, the bot
  MUST immediately reply with a user-facing error message. No automatic retries
  are performed; the user may resend the command.

### Key Entities

- **Group (Member)**: Represents a WhatsApp group or chat registered with the
  bot. Has a unique identifier (group JID), a display name, a list of granted
  permissions, and optional per-group configuration overrides.
- **Permission**: A capability flag assigned to a group. Controls which bot
  features are available in that group (e.g., command processing, message
  saving, deletion disclosure).
- **Configuration**: Global defaults for bot behavior including reply prefix,
  AI system prompt, and image cooldown settings. May be overridden per group.
- **Message Record**: A normalized snapshot of a WhatsApp message including
  sender, group, timestamp (with UTC-3 offset), message type, and character
  count. Used for statistical aggregation.
- **Request Register**: A log entry created each time a user invokes an
  AI-powered command. Contains the user's identifier, group identifier,
  timestamp, and request type (text, image, audio/music, meme).
- **Group Member Directory**: A mapping of phone number identifiers to display
  names within a specific group, used to humanize statistical output.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user sending `!ping` receives a response within 3 seconds
  under normal operating conditions.
- **SC-002**: A user sending `!bot [prompt]` receives an AI-generated response
  within 60 seconds for a single-turn prompt with no media context.
- **SC-003**: A user sending `!imagem [prompt]` receives a generated image
  within 30 seconds when the group is not in cooldown.
- **SC-004**: A user sending `!transcrever` on an audio message receives the
  transcription within 20 seconds.
- **SC-005**: A user sending `!ranking` receives a complete leaderboard within
  5 seconds for groups with up to 10,000 stored messages.
- **SC-006**: A user sending `!resumo` receives a summary within 60 seconds
  for the default 50-message window.
- **SC-007**: When a message is deleted in a disclosure-enabled group, the bot
  posts the disclosure within 5 seconds of the deletion event.
- **SC-008**: When added to a new group, the bot creates the group record
  within 10 seconds of the join event.
- **SC-009**: The bot handles at least 10 concurrent group conversations
  without command processing errors or dropped events.
- **SC-010**: Image generation cooldown enforcement is 100% reliable — no
  group can bypass it by sending multiple concurrent requests.
- **SC-011**: All AI-powered commands that complete successfully log a request
  register; no register is emitted for failed or rejected requests.
- **SC-012**: If the bot process crashes or loses its WhatsApp session, it
  automatically restarts and re-establishes the connection within 5 minutes,
  with no formal uptime SLA required.

---

## Clarifications

### Session 2026-05-19

- Q: What is the acceptable recovery posture when the bot goes offline? → A: Auto-restart on crash, reconnect within 5 minutes, no formal SLA.
- Q: Should the HTTP health-check and reload endpoints be retained? → A: Remove both endpoints — no HTTP API in scope.
- Q: What is the minimum observability requirement? → A: Structured logs per message event (correlation ID, handler, outcome, latency); no external tooling required.
- Q: Should the bot retry failed external service calls? → A: Fail fast — one attempt, immediate user-facing error on failure; no retries.
- Q: How are group permissions managed? → A: Direct database access only — no in-bot operator command.

---

## Assumptions

- The bot operates primarily in Brazilian Portuguese-language group chats;
  statistical output (day-of-week labels, response messages) uses Portuguese.
- Groups must be manually granted permissions by an operator with direct
  database access. This is the only supported method — there is no in-bot
  operator command and no self-service flow for group owners.
- The bot is deployed as a single instance connected to one WhatsApp account;
  horizontal scaling is out of scope for this specification.
- The Suno music generation service is accessed via an unofficial proxy; API
  availability and rate limits are outside the bot's control.
- Message body content in the stored message records is limited to metadata
  (character count, type); full message bodies are stored only in the raw
  audit collection, not in the normalized analytics collection.
- The bot requires a persistent browser session to connect to WhatsApp; session
  management (QR code scanning, session persistence across restarts) is
  considered infrastructure, not a user-facing feature.
- The `!resumo` and `!ranking` features are only useful in groups where the
  `SAVE_MESSAGE` permission has been granted; users in unsaved groups will
  receive an empty or error response.
- The hardcoded targeted-response behavior (auto-reply to specific user /
  keyword) is intentional product behavior, not a bug.
