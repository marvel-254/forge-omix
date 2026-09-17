-- NOTE: the schema_versions tracking table is created by the migration
-- runner itself (SchemaVersionManager.ensureRecordTable). It must NOT be
-- created here — the runner pre-creates it, and CREATE TABLE without
-- IF NOT EXISTS would fail every fresh-DB migration run.

CREATE TABLE projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  version TEXT NOT NULL,
  framework TEXT NOT NULL DEFAULT 'react',
  css_strategy TEXT NOT NULL DEFAULT 'tailwind',
  router_mode TEXT NOT NULL DEFAULT 'file',
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL
);

CREATE TABLE pages (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id),
  path TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  schema TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL
);

CREATE TABLE components (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id),
  type TEXT NOT NULL,
  name TEXT,
  schema TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL
);

CREATE TABLE design_tokens (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id),
  version TEXT NOT NULL,
  colors TEXT,
  typography TEXT,
  spacing TEXT,
  radius TEXT,
  shadows TEXT,
  breakpoints TEXT,
  motion TEXT,
  z_index TEXT,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL
);

CREATE TABLE flows (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id),
  name TEXT NOT NULL,
  description TEXT,
  version TEXT NOT NULL,
  steps TEXT NOT NULL,
  transitions TEXT,
  triggers TEXT,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL
);

CREATE TABLE tasks (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  type TEXT NOT NULL,
  status TEXT NOT NULL,
  priority TEXT NOT NULL,
  dependencies TEXT,
  affected_screens TEXT,
  affected_components TEXT,
  acceptance_criteria TEXT,
  estimated_tokens TEXT,
  assignee TEXT,
  labels TEXT,
  notes TEXT,
  context TEXT,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL,
  completed_at TIMESTAMP
);

CREATE TABLE templates (
  id TEXT PRIMARY KEY,
  project_id TEXT REFERENCES projects(id),
  name TEXT NOT NULL,
  version TEXT NOT NULL,
  author TEXT,
  license TEXT,
  category TEXT,
  tags TEXT,
  preview TEXT,
  variables TEXT,
  dependencies TEXT,
  schema TEXT,
  import_metadata TEXT,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL
);
