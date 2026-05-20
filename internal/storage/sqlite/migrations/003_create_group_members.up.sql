-- 003_create_group_members.up.sql
CREATE TABLE IF NOT EXISTS group_members (
    group_jid   TEXT    NOT NULL REFERENCES groups(jid) ON DELETE CASCADE,
    user_jid    TEXT    NOT NULL,
    name        TEXT    NOT NULL DEFAULT '',
    updated_at  TEXT    NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (group_jid, user_jid)
);
