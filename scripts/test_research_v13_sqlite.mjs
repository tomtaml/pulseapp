// An isolated SQLite round trip for the V1.3 migration, submission handler and
// operator export query. This uses an in-memory database and never contacts D1.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { DatabaseSync } from "node:sqlite";
import { V13_PROFILES } from "../public/js/research-v13-contract.js";
import { submitV13 } from "../src/research-v13.js";

const db = new DatabaseSync(":memory:");
db.exec(readFileSync(new URL("../migrations/0003_research_v13.sql", import.meta.url), "utf8"));
const env = { DB: { prepare(sql) { return {
  bind(...values) { return { run: async () => db.prepare(sql).run(...values) }; }
}; } } };
const origin = "https://isolated.example";
const options = {
  ready: true, synthetic: true, expectedOrigin: origin,
  rateLimiter: { limit: async () => ({ success: true }) },
  verifyHuman: async () => ({ success: true })
};

function fixture(variant, participant_group, profile) {
  return {
    schema_version: "research-v1.3", variant, participant_group,
    workshop_code: "TEST_PIPELINE", language: "en", consent_confirmed: true,
    prototype_disclaimer_confirmed: true,
    scenario_choice: variant === "fi-fleet" ? "protect_departure" : variant === "gr-prosumer" ? "wait_for_res_surplus" : "support_home",
    recovery_choice: variant === "fi-fleet" ? "stop_and_leave" : variant === "gr-prosumer" ? "retry" : "use_conductive_fallback",
    comprehension_answers: ["yes", "no", variant === "uk-v2h" ? "home" : "export", "driver"],
    service_confidence_1: 4, service_confidence_2: 5,
    ...Object.fromEntries(profile.outcomes.map(key => [key, 4])),
    ...(profile.sus ? Object.fromEntries(Array.from({ length: 10 }, (_, i) => [`sus_${String(i + 1).padStart(2, "0")}`, i % 2 ? 1 : 5])) : {}),
    turnstile_token: "local-test-token", synthetic_test: true
  };
}

async function submit(body, synthetic = true) {
  const request = new Request(`${origin}/api/v13/${synthetic ? "synthetic-submit" : "submit"}`, {
    method: "POST", headers: { origin, "content-type": "application/json", "sec-fetch-site": "same-origin" },
    body: JSON.stringify(body)
  });
  const response = await submitV13(request, env, { ...options, synthetic });
  assert.equal(response.status, 200, await response.text());
}

for (const [variant, profiles] of Object.entries(V13_PROFILES)) {
  for (const [participant_group, profile] of Object.entries(profiles)) {
    await submit(fixture(variant, participant_group, profile));
  }
}
assert.equal(db.prepare("SELECT count(*) AS count FROM research_v13_submissions WHERE record_kind = 'synthetic_test'").get().count, 5);

// Verify the real operator query, including JSON extraction and the column
// allow-list, against rows stored through the handler.
const queryResult = spawnSync("python3", ["-c", "import json; from scripts.export_analysis import V13_COLUMNS, v13_query; print(json.dumps({'columns': V13_COLUMNS, 'synthetic': v13_query('synthetic_test'), 'research': v13_query('research')}))"], {
  cwd: new URL("..", import.meta.url), encoding: "utf8"
});
assert.equal(queryResult.status, 0, queryResult.stderr);
const { columns, synthetic: syntheticQuery, research: researchQuery } = JSON.parse(queryResult.stdout);
const rows = db.prepare(syntheticQuery).all();
assert.equal(rows.length, 5);
for (const row of rows) {
  assert.deepEqual(Object.keys(row), columns);
  assert.equal(row.schema_version, "research-v1.3");
  assert.equal(row.comprehension_score, 4);
  assert.equal(row.service_confidence_score, 4.5);
  assert.equal(row.comprehension_04, "driver");
  assert.equal(row.sus_score, ["dispatcher", "fleet_manager"].includes(row.participant_group) ? null : 100);
  assert.equal(row.sus_01, row.sus_score === null ? null : 5);
  assert.ok(!Object.hasOwn(row, "payload_json"));
  assert.ok(!Object.hasOwn(row, "id"));
  assert.ok(!Object.hasOwn(row, "turnstile_token"));
}

const researchBody = fixture("fi-fleet", "fleet_driver", V13_PROFILES["fi-fleet"].fleet_driver);
delete researchBody.synthetic_test;
researchBody.workshop_code = "ISOLATED";
await submit(researchBody, false);
assert.equal(db.prepare(syntheticQuery).all().length, 5);
assert.equal(db.prepare(researchQuery).all().length, 1);
db.close();
console.log("research-v1.3: isolated SQLite migration, handler persistence and export query passed");
