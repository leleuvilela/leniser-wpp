-- 005_create_request_registers.down.sql
DROP INDEX IF EXISTS idx_req_registers_author_type;
DROP INDEX IF EXISTS idx_req_registers_group_type;
DROP TABLE IF EXISTS request_registers;
