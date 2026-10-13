CREATE TABLE comments (
  id TEXT PRIMARY KEY,
  project_id TEXT REFERENCES projects(id),
  page_id TEXT,
  author TEXT NOT NULL,
  email TEXT,
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'approved' CHECK (status IN ('approved', 'pending', 'spam')),
  created_at INTEGER NOT NULL
);

CREATE INDEX comments_project_created_idx ON comments(project_id, created_at);
CREATE INDEX comments_page_created_idx ON comments(page_id, created_at);
