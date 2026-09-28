CREATE TABLE checkout_sessions (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES accounts(id),
  project_id TEXT NOT NULL REFERENCES projects(id),
  plan_id TEXT NOT NULL,
  plan_snapshot TEXT NOT NULL,
  term_months INTEGER NOT NULL CHECK (term_months IN (12, 36)),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending_payment', 'completed', 'cancelled')),
  promotional_total INTEGER NOT NULL CHECK (promotional_total >= 0),
  renewal_total INTEGER NOT NULL CHECK (renewal_total >= 0),
  currency TEXT NOT NULL,
  payment_reference TEXT,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL
);

CREATE INDEX checkout_sessions_account_created_idx ON checkout_sessions(account_id, created_at);
CREATE INDEX checkout_sessions_project_idx ON checkout_sessions(project_id);
