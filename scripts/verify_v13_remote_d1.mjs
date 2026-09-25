// One synthetic persistence/export probe against a newly created V1.3 D1 DB.
// Never use this with a partner, preview, or collection database.
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { spawnSync } from "node:child_process";
import { V13_PROFILES, validateV13, scoreV13, minimisedV13, SCHEMA_VERSION } from "../public/js/research-v13-contract.js";

const [database, expectedId] = process.argv.slice(2);
if (!/^pulse-research-v13-isolated-[a-z0-9-]+$/.test(database || "") || !/^[0-9a-f-]{36}$/.test(expectedId || "")) {
  console.error("Usage: node scripts/verify_v13_remote_d1.mjs pulse-research-v13-isolated-NAME <database UUID>");
  process.exit(2);
}

function command(binary, args) {
  const result = spawnSync(binary, args, { encoding: "utf8", cwd: new URL("..", import.meta.url) });
  if (result.error || result.status !== 0) throw new Error(`${binary} failed: ${result.error?.message || result.stderr || result.stdout}`);
  try { return JSON.parse(result.stdout); }
  catch { throw new Error(`${binary} did not return JSON: ${result.stdout.slice(0, 300)}`); }
}

const info = command("npx", ["wrangler", "d1", "info", database, "--json"]);
// Compare the exact UUID without depending on Wrangler's info envelope shape.
function containsId(value) {
  if (typeof value === "string") return value === expectedId;
  if (Array.isArray(value)) return value.some(containsId);
  return value !== null && typeof value === "object" && Object.values(value).some(containsId);
}
assert.ok(containsId(info), "D1 UUID does not match the named isolated database; no write was attempted.");

function execute(sql) {
  const payload = command("npx", ["wrangler", "d1", "execute", database, "--remote", "--json", "--command", sql]);
  const envelopes = Array.isArray(payload) ? payload : [payload];
  if (envelopes.some(item => item?.success === false)) throw new Error("D1 reported an unsuccessful query.");
  return envelopes.flatMap(item => Array.isArray(item?.results) ? item.results : []);
}

assert.equal(execute("SELECT count(*) AS n FROM sqlite_schema WHERE type = 'table' AND name = 'research_v13_submissions'")[0]?.n, 1,
  "V1.3 migration is missing; no write was attempted.");
assert.equal(execute("SELECT count(*) AS n FROM research_v13_submissions")[0]?.n, 0,
  "This database already has rows; the probe only runs on an empty isolated database.");

const profile = V13_PROFILES["fi-fleet"].fleet_driver;
const body = {
  schema_version: SCHEMA_VERSION, variant: "fi-fleet", participant_group: "fleet_driver",
  workshop_code: "TEST_PIPELINE", language: "en", consent_confirmed: true,
  prototype_disclaimer_confirmed: true, scenario_choice: "protect_departure",
  recovery_choice: "stop_and_leave", comprehension_answers: ["yes", "no", "export", "driver"],
  service_confidence_1: 4, service_confidence_2: 5,
  ...Object.fromEntries(profile.outcomes.map(key => [key, 4])),
  ...Object.fromEntries(Array.from({ length: 10 }, (_, i) => [`sus_${String(i + 1).padStart(2, "0")}`, i % 2 ? 1 : 5])),
  synthetic_test: true, turnstile_token: "probe-not-sent"
};
assert.equal(validateV13(body, { synthetic: true }), null);
const scores = scoreV13(body);
const id = randomUUID();
const values = [id, "synthetic_test", SCHEMA_VERSION, body.variant, body.participant_group,
  body.workshop_code, body.language, scores.comprehension_score, scores.sus_score,
  scores.service_confidence_score, scores.wpt_intention_t1, scores.v2g_intention_t1,
  scores.v2h_intention_t1, JSON.stringify(minimisedV13(body))];
const quoted = values.map(value => value === null ? "NULL" : typeof value === "number" ? String(value) : `'${value.replaceAll("'", "''")}'`);
execute(`INSERT INTO research_v13_submissions
  (id, record_kind, schema_version, variant, participant_group, workshop_code, language,
   comprehension_score, sus_score, service_confidence_score, wpt_intention_t1,
   v2g_intention_t1, v2h_intention_t1, payload_json)
  VALUES (${quoted.join(", ")})`);

const { columns, query } = command("python3", ["-c",
  "import json; from scripts.export_analysis import V13_COLUMNS, v13_query; print(json.dumps({'columns': V13_COLUMNS, 'query': v13_query('synthetic_test')}))"]);
const rows = execute(query);
assert.equal(rows.length, 1);
assert.deepEqual(Object.keys(rows[0]), columns);
assert.equal(rows[0].comprehension_score, 4);
assert.equal(rows[0].sus_score, 100);
assert.equal(rows[0].service_confidence_score, 4.5);
assert.equal(rows[0].comprehension_04, "driver");
assert.ok(!Object.hasOwn(rows[0], "payload_json"));
assert.ok(!Object.hasOwn(rows[0], "id"));
assert.equal(execute("SELECT count(*) AS n FROM research_v13_submissions WHERE record_kind = 'research'")[0]?.n, 0);
console.log(`Isolated D1 probe passed: 1 synthetic row, 0 research rows, export allow-list verified. Probe ID: ${id}`);
