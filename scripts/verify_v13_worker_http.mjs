// One HTTP submission through the dedicated V1.3 synthetic Worker, followed
// by a read from its isolated remote D1. The synthetic gate is enabled and
// disabled separately; see v13-isolated/README.md.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { V13_PROFILES, SCHEMA_VERSION, validateV13 } from "../public/js/research-v13-contract.js";

const [workerUrl, database, expectedId] = process.argv.slice(2);
let origin;
try { origin = new URL(workerUrl).origin; } catch {}
if (!origin || !/^https:\/\/pulse-srf-v13-isolated-test\.[a-z0-9-]+\.workers\.dev$/.test(origin)
    || !/^pulse-research-v13-isolated-[a-z0-9-]+$/.test(database || "")
    || !/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/.test(expectedId || "")) {
  console.error("Usage: node scripts/verify_v13_worker_http.mjs https://pulse-srf-v13-isolated-test.SUBDOMAIN.workers.dev <isolated DB name> <DB UUID>");
  process.exit(2);
}

function wrangler(args) {
  const result = spawnSync("npx", ["wrangler", "d1", ...args], { encoding: "utf8", cwd: new URL("..", import.meta.url) });
  if (result.error || result.status !== 0) throw new Error(result.error?.message || result.stderr || result.stdout);
  return JSON.parse(result.stdout);
}
const dbInfo = wrangler(["info", database, "--json"]);
function containsId(value) {
  if (typeof value === "string") return value === expectedId;
  if (Array.isArray(value)) return value.some(containsId);
  return value !== null && typeof value === "object" && Object.values(value).some(containsId);
}
assert.ok(containsId(dbInfo), "Isolated D1 UUID mismatch; no HTTP submission was sent.");
function query(sql) {
  const response = wrangler(["execute", database, "--remote", "--json", "--command", sql]);
  const envelopes = Array.isArray(response) ? response : [response];
  if (envelopes.some(item => item?.success === false)) throw new Error("D1 query failed.");
  return envelopes.flatMap(item => Array.isArray(item?.results) ? item.results : []);
}

async function get(path) {
  const response = await fetch(origin + path, { signal: AbortSignal.timeout(15000) });
  assert.equal(response.status, 200, `${path}: HTTP ${response.status}`);
  return response.json();
}
const health = await get("/api/health");
assert.equal(health.research_test_worker, true);
assert.equal(health.synthetic_pipeline_ready, true, "Synthetic test gate is locked; no submission sent.");
assert.equal(health.collection_enabled, false);
assert.equal(health.research_collection_locked, true);
assert.equal(health.research_free_text_locked, true);
const config = await get("/api/v13/config");
assert.equal(config.collection_enabled, false);
assert.equal(config.research_schema_version, SCHEMA_VERSION);
assert.equal(query("SELECT count(*) AS n FROM research_v13_submissions WHERE record_kind = 'research'")[0]?.n, 0);

const profile = V13_PROFILES["fi-fleet"].fleet_driver;
const body = {
  schema_version: SCHEMA_VERSION, variant: "fi-fleet", participant_group: "fleet_driver",
  workshop_code: "TEST_PIPELINE", language: "en", consent_confirmed: true,
  prototype_disclaimer_confirmed: true, scenario_choice: "protect_departure",
  recovery_choice: "stop_and_leave", comprehension_answers: ["yes", "no", "export", "driver"],
  service_confidence_1: 4, service_confidence_2: 5,
  ...Object.fromEntries(profile.outcomes.map(key => [key, 4])),
  ...Object.fromEntries(Array.from({ length: 10 }, (_, i) => [`sus_${String(i + 1).padStart(2, "0")}`, i % 2 ? 1 : 5])),
  synthetic_test: true, turnstile_token: "XXXX.DUMMY.TOKEN.XXXX"
};
assert.equal(validateV13(body, { synthetic: true }), null);
const lockedResearch = await fetch(origin + "/api/v13/submit", {
  method: "POST", headers: { origin, "content-type": "application/json" },
  body: JSON.stringify(body), signal: AbortSignal.timeout(15000)
});
assert.equal(lockedResearch.status, 503, "The research submission route must remain locked.");
const response = await fetch(origin + "/api/v13/synthetic-submit", {
  method: "POST", headers: { origin, "content-type": "application/json" },
  body: JSON.stringify(body), signal: AbortSignal.timeout(15000)
});
const result = await response.json();
assert.equal(response.status, 200, JSON.stringify(result));
assert.equal(result.record_kind, "synthetic_test");
assert.match(result.submission_id, /^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/);

const rows = query(`SELECT record_kind, schema_version, variant, participant_group,
  comprehension_score, sus_score, service_confidence_score, payload_json
  FROM research_v13_submissions WHERE id = '${result.submission_id}'`);
assert.equal(rows.length, 1, "The response ID was not found in the named isolated D1.");
assert.equal(rows[0].record_kind, "synthetic_test");
assert.equal(rows[0].schema_version, SCHEMA_VERSION);
assert.equal(rows[0].variant, "fi-fleet");
assert.equal(rows[0].comprehension_score, 4);
assert.equal(rows[0].sus_score, 100);
assert.equal(rows[0].service_confidence_score, 4.5);
const stored = JSON.parse(rows[0].payload_json);
assert.ok(!Object.hasOwn(stored, "turnstile_token"));
assert.ok(!Object.hasOwn(stored, "synthetic_test"));
assert.equal(query("SELECT count(*) AS n FROM research_v13_submissions WHERE record_kind = 'research'")[0]?.n, 0);
console.log(`V1.3 isolated HTTP pipeline passed; 1 synthetic Worker submission in D1, 0 research rows. ID: ${result.submission_id}`);
