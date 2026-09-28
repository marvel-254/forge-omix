CREATE TABLE ai_creation_sessions (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES accounts(id),
  status TEXT NOT NULL DEFAULT 'draft',
  step TEXT NOT NULL DEFAULT 'brief',
  brief TEXT NOT NULL,
  project_name TEXT NOT NULL,
  clarifications TEXT NOT NULL,
  assets TEXT NOT NULL,
  generated_project TEXT,
  error TEXT,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL
);

CREATE INDEX ai_creation_sessions_account_id_idx ON ai_creation_sessions(account_id);
CREATE INDEX ai_creation_sessions_status_idx ON ai_creation_sessions(status);
