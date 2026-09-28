-- Beta feedback capture (Phase 13): in-app feedback widget submissions.
-- Write-mostly table. Triage reads recent rows. No user identity stored.

CREATE TABLE IF NOT EXISTS feedback (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL,
  message TEXT NOT NULL,
  contact TEXT,
  app_version TEXT,
  created_at INTEGER NOT NULL
);
