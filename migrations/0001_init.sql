CREATE TABLE IF NOT EXISTS submissions (
  id TEXT PRIMARY KEY,
  submitted_at TEXT NOT NULL DEFAULT (datetime('now')),
  variant TEXT NOT NULL,
  workshop_code TEXT NOT NULL,
  participant_group TEXT NOT NULL,
  language TEXT NOT NULL,
  comprehension_score INTEGER,
  sus_completed INTEGER NOT NULL DEFAULT 0,
  sus_score REAL,
  trust_score REAL,
  wireless_acceptance INTEGER,
  bidirectional_participation INTEGER,
  payload_json TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_submissions_variant_time
  ON submissions (variant, submitted_at);
CREATE INDEX IF NOT EXISTS idx_submissions_workshop_time
  ON submissions (workshop_code, submitted_at);
