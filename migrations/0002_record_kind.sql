ALTER TABLE submissions ADD COLUMN record_kind TEXT NOT NULL DEFAULT 'research'
  CHECK (record_kind IN ('research','synthetic_test'));

CREATE INDEX IF NOT EXISTS idx_submissions_record_kind_time
  ON submissions (record_kind, submitted_at);
