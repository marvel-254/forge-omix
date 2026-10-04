CREATE TABLE media_assets (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES accounts(id),
  project_id TEXT REFERENCES projects(id),
  filename TEXT NOT NULL,
  stored_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('image', 'gif', 'video')),
  byte_size INTEGER NOT NULL,
  width INTEGER,
  height INTEGER,
  alt TEXT,
  created_at INTEGER NOT NULL
);

CREATE INDEX media_assets_account_created_idx ON media_assets(account_id, created_at);
CREATE INDEX media_assets_project_idx ON media_assets(project_id);