CREATE TABLE IF NOT EXISTS team_members (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT NOT NULL,
  color      TEXT NOT NULL DEFAULT '#4A90D9',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS chores (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  title               TEXT NOT NULL,
  description         TEXT,
  default_assignee_id INTEGER REFERENCES team_members(id) ON DELETE SET NULL,
  is_recurring        INTEGER NOT NULL DEFAULT 0,
  is_active           INTEGER NOT NULL DEFAULT 1,
  created_at          TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at          TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS recurrence_rules (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  chore_id       INTEGER NOT NULL REFERENCES chores(id) ON DELETE CASCADE,
  frequency      TEXT NOT NULL CHECK(frequency IN ('daily','weekly','monthly','custom')),
  interval_value INTEGER NOT NULL DEFAULT 1,
  days_of_week   TEXT,
  day_of_month   INTEGER,
  start_date     TEXT NOT NULL,
  end_date       TEXT,
  generate_until TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS chore_instances (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  chore_id        INTEGER NOT NULL REFERENCES chores(id) ON DELETE CASCADE,
  due_date        TEXT NOT NULL,
  assignee_id     INTEGER REFERENCES team_members(id) ON DELETE SET NULL,
  status          TEXT NOT NULL DEFAULT 'pending'
                       CHECK(status IN ('pending','completed','skipped')),
  completed_at    TEXT,
  completed_by_id INTEGER REFERENCES team_members(id) ON DELETE SET NULL,
  notes           TEXT,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(chore_id, due_date)
);

CREATE INDEX IF NOT EXISTS idx_instances_due_date ON chore_instances(due_date);
CREATE INDEX IF NOT EXISTS idx_instances_status   ON chore_instances(status);
CREATE INDEX IF NOT EXISTS idx_instances_chore_id ON chore_instances(chore_id);
