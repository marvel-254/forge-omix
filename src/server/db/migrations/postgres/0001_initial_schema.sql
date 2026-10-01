-- PostgreSQL baseline for the future Neon/Cloudflare adapter.
-- This is intentionally separate from the historical SQLite migrations; do
-- not rewrite or run it through the current LibSQL migration runner. The
-- application cutover must add a PostgreSQL-aware runner and a verified
-- SQLite export/import before this baseline is applied to production.

CREATE TABLE accounts (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  display_name TEXT,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE projects (
  id TEXT PRIMARY KEY,
  account_id TEXT REFERENCES accounts(id),
  name TEXT NOT NULL,
  description TEXT,
  version TEXT NOT NULL,
  framework TEXT NOT NULL DEFAULT 'react',
  css_strategy TEXT NOT NULL DEFAULT 'tailwind',
  router_mode TEXT NOT NULL DEFAULT 'file',
  settings JSONB,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX projects_account_id_idx ON projects(account_id);

CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES accounts(id),
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  last_used_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX sessions_account_id_idx ON sessions(account_id);
CREATE INDEX sessions_expires_at_idx ON sessions(expires_at);

CREATE TABLE ai_creation_sessions (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES accounts(id),
  status TEXT NOT NULL DEFAULT 'draft',
  step TEXT NOT NULL DEFAULT 'brief',
  brief TEXT NOT NULL,
  project_name TEXT NOT NULL,
  clarifications JSONB NOT NULL,
  assets JSONB NOT NULL,
  generated_project JSONB,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX ai_creation_sessions_account_id_idx ON ai_creation_sessions(account_id);
CREATE INDEX ai_creation_sessions_status_idx ON ai_creation_sessions(status);

CREATE TABLE pages (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id),
  path TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  "schema" JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE components (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id),
  type TEXT NOT NULL,
  name TEXT,
  "schema" JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE design_tokens (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id),
  version TEXT NOT NULL,
  colors JSONB,
  typography JSONB,
  spacing JSONB,
  radius JSONB,
  shadows JSONB,
  breakpoints JSONB,
  motion JSONB,
  z_index JSONB,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE flows (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id),
  name TEXT NOT NULL,
  description TEXT,
  version TEXT NOT NULL,
  steps JSONB NOT NULL,
  transitions JSONB,
  triggers JSONB,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE tasks (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  type TEXT NOT NULL,
  status TEXT NOT NULL,
  priority TEXT NOT NULL,
  dependencies JSONB,
  affected_screens JSONB,
  affected_components JSONB,
  acceptance_criteria JSONB,
  estimated_tokens JSONB,
  assignee TEXT,
  labels JSONB,
  notes TEXT,
  context JSONB,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ
);

CREATE TABLE templates (
  id TEXT PRIMARY KEY,
  project_id TEXT REFERENCES projects(id),
  name TEXT NOT NULL,
  version TEXT NOT NULL,
  author JSONB,
  license TEXT,
  category TEXT,
  tags JSONB,
  preview JSONB,
  variables JSONB,
  dependencies JSONB,
  "schema" JSONB,
  import_metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE deployments (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES accounts(id),
  project_id TEXT NOT NULL REFERENCES projects(id),
  environment TEXT NOT NULL,
  version TEXT,
  status TEXT NOT NULL DEFAULT 'queued',
  failure TEXT,
  preview_url TEXT,
  live_url TEXT,
  commit_hash TEXT,
  commit_message TEXT,
  commit_author TEXT,
  metadata JSONB,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX deployments_account_project_idx ON deployments(account_id, project_id);
CREATE INDEX deployments_project_status_idx ON deployments(project_id, status);

CREATE TABLE deployment_logs (
  id TEXT PRIMARY KEY,
  deployment_id TEXT NOT NULL REFERENCES deployments(id),
  account_id TEXT NOT NULL REFERENCES accounts(id),
  event TEXT NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX deployment_logs_deployment_created_idx ON deployment_logs(deployment_id, created_at);
CREATE INDEX deployment_logs_account_idx ON deployment_logs(account_id);

CREATE TABLE checkout_sessions (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES accounts(id),
  project_id TEXT NOT NULL REFERENCES projects(id),
  plan_id TEXT NOT NULL,
  plan_snapshot JSONB NOT NULL,
  term_months INTEGER NOT NULL CHECK (term_months IN (12, 36)),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending_payment', 'completed', 'cancelled')),
  promotional_total INTEGER NOT NULL CHECK (promotional_total >= 0),
  renewal_total INTEGER NOT NULL CHECK (renewal_total >= 0),
  currency TEXT NOT NULL,
  payment_reference TEXT,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX checkout_sessions_account_created_idx ON checkout_sessions(account_id, created_at);
CREATE INDEX checkout_sessions_project_idx ON checkout_sessions(project_id);

CREATE TABLE domains (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES accounts(id),
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('searching', 'available', 'reserved', 'pending', 'registered', 'connected', 'renewal_due', 'expiring', 'expired')),
  registration JSONB NOT NULL,
  hosting_connection JSONB,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX domains_account_created_idx ON domains(account_id, created_at);
CREATE INDEX domains_name_idx ON domains(name);

CREATE TABLE feedback (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL,
  message TEXT NOT NULL,
  contact TEXT,
  app_version TEXT,
  account_id TEXT REFERENCES accounts(id),
  created_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX feedback_account_id_idx ON feedback(account_id);

CREATE TABLE support_tickets (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES accounts(id),
  subject TEXT NOT NULL,
  category TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'waiting_customer', 'resolved', 'closed')),
  assigned_to TEXT REFERENCES accounts(id),
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  closed_at TIMESTAMPTZ
);
CREATE INDEX support_tickets_account_updated_idx ON support_tickets(account_id, updated_at);
CREATE INDEX support_tickets_status_updated_idx ON support_tickets(status, updated_at);

CREATE TABLE support_messages (
  id TEXT PRIMARY KEY,
  ticket_id TEXT NOT NULL REFERENCES support_tickets(id),
  account_id TEXT NOT NULL REFERENCES accounts(id),
  body TEXT NOT NULL,
  internal BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX support_messages_ticket_created_idx ON support_messages(ticket_id, created_at);

-- Include `state`, which the existing migration runner already reads/writes,
-- while keeping the schema version ledger compatible with its other fields.
CREATE TABLE schema_versions (
  version TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  checksum TEXT,
  state TEXT NOT NULL DEFAULT 'applied'
);
