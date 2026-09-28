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
  metadata TEXT,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  published_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL
);

CREATE INDEX deployments_account_project_idx ON deployments(account_id, project_id);
CREATE INDEX deployments_project_status_idx ON deployments(project_id, status);

CREATE TABLE deployment_logs (
  id TEXT PRIMARY KEY,
  deployment_id TEXT NOT NULL REFERENCES deployments(id),
  account_id TEXT NOT NULL REFERENCES accounts(id),
  event TEXT NOT NULL,
  message TEXT NOT NULL,
  metadata TEXT,
  created_at TIMESTAMP NOT NULL
);

CREATE INDEX deployment_logs_deployment_created_idx ON deployment_logs(deployment_id, created_at);
CREATE INDEX deployment_logs_account_idx ON deployment_logs(account_id);
