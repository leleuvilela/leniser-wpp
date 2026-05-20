-- 002_create_groups.up.sql
CREATE TABLE IF NOT EXISTS groups (
    jid         TEXT    PRIMARY KEY,
    name        TEXT    NOT NULL DEFAULT '',
    created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS group_permissions (
    group_jid   TEXT    NOT NULL REFERENCES groups(jid) ON DELETE CASCADE,
    permission  TEXT    NOT NULL,
    granted_at  TEXT    NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (group_jid, permission)
);

CREATE TABLE IF NOT EXISTS group_configs (
    group_jid               TEXT    PRIMARY KEY REFERENCES groups(jid) ON DELETE CASCADE,
    bot_prefix              TEXT,
    system_prompt           TEXT,
    image_cooldown_enabled  INTEGER,
    image_cooldown_minutes  INTEGER,
    updated_at              TEXT    NOT NULL DEFAULT (datetime('now'))
);
