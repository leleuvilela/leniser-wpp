-- 001_create_config.up.sql
CREATE TABLE IF NOT EXISTS config (
    id                      INTEGER PRIMARY KEY CHECK (id = 1),
    bot_prefix              TEXT    NOT NULL DEFAULT '🤖',
    system_prompt           TEXT    NOT NULL DEFAULT '',
    image_cooldown_enabled  INTEGER NOT NULL DEFAULT 0,
    image_cooldown_minutes  INTEGER NOT NULL DEFAULT 60,
    updated_at              TEXT    NOT NULL DEFAULT (datetime('now'))
);

INSERT OR IGNORE INTO config (id) VALUES (1);
