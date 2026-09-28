DROP INDEX IF EXISTS feedback_account_id_idx;
ALTER TABLE feedback DROP COLUMN account_id;
DROP INDEX IF EXISTS projects_account_id_idx;
ALTER TABLE projects DROP COLUMN account_id;
DROP INDEX IF EXISTS sessions_expires_at_idx;
DROP INDEX IF EXISTS sessions_account_id_idx;
DROP TABLE IF EXISTS sessions;
DROP TABLE IF EXISTS accounts;
