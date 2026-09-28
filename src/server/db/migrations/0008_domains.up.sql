CREATE TABLE domains (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES accounts(id),
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('searching', 'available', 'reserved', 'pending', 'registered', 'connected', 'renewal_due', 'expiring', 'expired')),
  registration TEXT NOT NULL,
  hosting_connection TEXT,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL
);

CREATE INDEX domains_account_created_idx ON domains(account_id, created_at);
CREATE INDEX domains_name_idx ON domains(name);
