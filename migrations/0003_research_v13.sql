-- New table: the legacy v1.2 submissions and their exports remain intact.
CREATE TABLE IF NOT EXISTS research_v13_submissions (
  id TEXT PRIMARY KEY,
  submitted_at TEXT NOT NULL DEFAULT (datetime('now')),
  record_kind TEXT NOT NULL CHECK (record_kind IN ('research', 'synthetic_test')),
  schema_version TEXT NOT NULL CHECK (schema_version = 'research-v1.3'),
  variant TEXT NOT NULL,
  participant_group TEXT NOT NULL,
  workshop_code TEXT NOT NULL,
  language TEXT NOT NULL,
  comprehension_score INTEGER NOT NULL CHECK (comprehension_score BETWEEN 0 AND 4),
  sus_score REAL CHECK (sus_score BETWEEN 0 AND 100),
  service_confidence_score REAL NOT NULL CHECK (service_confidence_score BETWEEN 1 AND 5),
  wpt_intention_t1 INTEGER CHECK (wpt_intention_t1 BETWEEN 1 AND 5),
  v2g_intention_t1 INTEGER CHECK (v2g_intention_t1 BETWEEN 1 AND 5),
  v2h_intention_t1 INTEGER CHECK (v2h_intention_t1 BETWEEN 1 AND 5),
  payload_json TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_research_v13_kind_site_time
  ON research_v13_submissions (record_kind, variant, submitted_at);
