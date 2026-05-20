-- 005_create_request_registers.up.sql
CREATE TABLE IF NOT EXISTS request_registers (
    id          TEXT    PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    group_jid   TEXT    NOT NULL REFERENCES groups(jid) ON DELETE CASCADE,
    author_jid  TEXT    NOT NULL,
    req_type    TEXT    NOT NULL,
    created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_req_registers_group_type
    ON request_registers(group_jid, req_type, created_at);

CREATE INDEX IF NOT EXISTS idx_req_registers_author_type
    ON request_registers(author_jid, req_type, created_at);
