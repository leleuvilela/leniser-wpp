-- 004_create_message_records.down.sql
DROP INDEX IF EXISTS idx_message_records_group_author;
DROP INDEX IF EXISTS idx_message_records_group_day;
DROP TABLE IF EXISTS message_records;
