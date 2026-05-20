-- 004_create_message_records.up.sql
CREATE TABLE IF NOT EXISTS message_records (
    id              TEXT    PRIMARY KEY,
    group_jid       TEXT    NOT NULL REFERENCES groups(jid) ON DELETE CASCADE,
    author_jid      TEXT    NOT NULL,
    message_type    TEXT    NOT NULL,
    has_media       INTEGER NOT NULL DEFAULT 0,
    is_forwarded    INTEGER NOT NULL DEFAULT 0,
    character_count INTEGER NOT NULL DEFAULT 0,
    day             TEXT    NOT NULL,
    timestamp_utc   INTEGER NOT NULL,
    timestamp_local INTEGER NOT NULL,
    recorded_at     TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_message_records_group_day
    ON message_records(group_jid, day);

CREATE INDEX IF NOT EXISTS idx_message_records_group_author
    ON message_records(group_jid, author_jid);
