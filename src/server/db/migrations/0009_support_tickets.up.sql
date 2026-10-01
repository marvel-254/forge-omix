CREATE TABLE support_tickets (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES accounts(id),
  subject TEXT NOT NULL,
  category TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'waiting_customer', 'resolved', 'closed')),
  assigned_to TEXT REFERENCES accounts(id),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  closed_at INTEGER
);

CREATE INDEX support_tickets_account_updated_idx ON support_tickets(account_id, updated_at);
CREATE INDEX support_tickets_status_updated_idx ON support_tickets(status, updated_at);

CREATE TABLE support_messages (
  id TEXT PRIMARY KEY,
  ticket_id TEXT NOT NULL REFERENCES support_tickets(id),
  account_id TEXT NOT NULL REFERENCES accounts(id),
  body TEXT NOT NULL,
  internal INTEGER NOT NULL DEFAULT 0 CHECK (internal IN (0, 1)),
  created_at INTEGER NOT NULL
);

CREATE INDEX support_messages_ticket_created_idx ON support_messages(ticket_id, created_at);
