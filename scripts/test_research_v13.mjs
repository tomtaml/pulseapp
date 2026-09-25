import assert from "node:assert/strict";
import { V13_PROFILES, validateV13, scoreV13, minimisedV13 } from "../public/js/research-v13-contract.js";
import { resolveWorkshopView, workshopPages, resolveWorkshopMode } from "../public/js/v13-questions.js";
import { submitV13 } from "../src/research-v13.js";
import baseWorker from "../src/index.js";
import syntheticWorker from "../src/research-test-entry.js";

const fixtures = Object.entries(V13_PROFILES).flatMap(([variant, profiles]) =>
  Object.entries(profiles).map(([participant_group, profile]) => ({
    schema_version: "research-v1.3", variant, participant_group, workshop_code: "TEST_PIPELINE",
    language: variant === "gr-prosumer" ? "el" : variant === "fi-fleet" ? "fi" : "en",
    consent_confirmed: true, prototype_disclaimer_confirmed: true,
    scenario_choice: variant === "fi-fleet" ? "protect_departure" : variant === "gr-prosumer" ? "wait_for_res_surplus" : "protect_trip",
    recovery_choice: variant === "fi-fleet" ? "stop_and_leave" : variant === "gr-prosumer" ? "retry" : "use_conductive_fallback",
    comprehension_answers: ["yes", "no", variant === "uk-v2h" ? "home" : "export", "driver"],
    service_confidence_1: 4, service_confidence_2: 5,
    ...Object.fromEntries(profile.outcomes.map(key => [key, 4])),
    ...(profile.sus ? Object.fromEntries(Array.from({ length: 10 }, (_, i) => [`sus_${String(i + 1).padStart(2,"0")}`, i % 2 ? 1 : 5])) : {}),
    turnstile_token: "test-token", synthetic_test: true
  }))
);

const view = query => resolveWorkshopView(new URLSearchParams(query));
const demoView = view("view=demo");
const questionView = view("view=questions");
const fullView = view("view=full");
const customView = view("view=full&questions=0&sus=0&scales=1");
assert.deepEqual(demoView.modules, { questions: false, sus: false, scales: false });
assert.deepEqual(questionView.modules, { questions: true, sus: false, scales: false });
assert.deepEqual(fullView.modules, { questions: true, sus: true, scales: true });
assert.deepEqual(customView.modules, { questions: false, sus: false, scales: true });
assert.deepEqual(view("demo=1&questions=1").modules, demoView.modules);
assert.equal(view("view=unknown").workshopOnly, true);
assert.equal(view("").workshopOnly, false);
assert.deepEqual(workshopPages("fi-fleet", "fleet_driver", demoView.modules, V13_PROFILES), ["intro", "alignment", "scenario", "energy", "recovery", "done"]);
assert.deepEqual(workshopPages("gr-prosumer", "passenger_prosumer", questionView.modules, V13_PROFILES), ["intro", "scenario", "energy", "recovery", "comprehension", "done"]);
assert.deepEqual(workshopPages("fi-fleet", "dispatcher", fullView.modules, V13_PROFILES), ["intro", "alignment", "scenario", "energy", "recovery", "comprehension", "outcomes", "done"]);
assert.deepEqual(workshopPages("uk-v2h", "accessible_driver", fullView.modules, V13_PROFILES), ["intro", "scenario", "energy", "recovery", "comprehension", "sus", "outcomes", "done"]);
assert.equal(resolveWorkshopMode({ instrument_mode: "research", collection_enabled: true }, questionView), "instrument-preview");
assert.equal(resolveWorkshopMode({ instrument_mode: "research", collection_enabled: true }, fullView), "instrument-preview");
assert.equal(resolveWorkshopMode({ instrument_mode: "research", collection_enabled: true }, view("")), "research");
assert.equal(resolveWorkshopMode({ instrument_mode: "instrument-preview", collection_enabled: false }, view("")), "instrument-preview");

const stored = [];
const db = { prepare(sql) { assert.match(sql, /research_v13_submissions/); return {
  bind(...values) { return { async run() { stored.push(values); return { success: true }; } }; }
}; } };
const env = { DB: db };
const options = {
  ready: true, synthetic: true, expectedOrigin: "https://preview.example",
  rateLimiter: { async limit() { return { success: true }; } },
  verifyHuman: async () => ({ success: true })
};

for (const body of fixtures) {
  assert.equal(validateV13(body, { synthetic: true }), null, `${body.variant}/${body.participant_group}`);
  assert.equal(scoreV13(body).comprehension_score, 4);
  assert.equal(scoreV13(body).sus_score, V13_PROFILES[body.variant][body.participant_group].sus ? 100 : null);
  assert.equal(scoreV13(body).service_confidence_score, 4.5);
  assert.ok(!Object.hasOwn(minimisedV13(body), "turnstile_token"));
  assert.ok(!Object.hasOwn(minimisedV13(body), "synthetic_test"));
  const request = new Request("https://preview.example/api/v13/synthetic-submit", {
    method: "POST", headers: { origin: "https://preview.example", "content-type": "application/json", "sec-fetch-site": "same-origin" },
    body: JSON.stringify(body)
  });
  const response = await submitV13(request, env, options);
  assert.equal(response.status, 200, await response.text());
}
assert.equal(stored.length, 5);
for (const values of stored) {
  const payload = JSON.parse(values.at(-1));
  assert.equal(payload.schema_version, "research-v1.3");
  assert.ok(!Object.hasOwn(payload, "turnstile_token"));
  assert.equal(Object.keys(payload).some(key => /name|email|gps|vin/i.test(key)), false);
}

const baseline = fixtures[0];
for (const [change, expected] of [
  [{ participant_group: "passenger_prosumer" }, /does not match/],
  [{ unexpected: "private" }, /Unexpected/],
  [{ email: "example@example.test" }, /Unexpected/],
  [{ sus_01: "5" }, /1–5/],
  [{ comprehension_answers: ["yes", "no", "export"] }, /Four/],
  [{ synthetic_test: false }, /marker/]
]) assert.match(validateV13({ ...baseline, ...change }, { synthetic: true }), expected);

const noSus = fixtures.find(value => value.participant_group === "dispatcher");
assert.match(validateV13({ ...noSus, sus_01: 3 }, { synthetic: true }), /hidden/);
assert.match(validateV13({ ...baseline, v2h_intention_t1: 3 }, { synthetic: true }), /hidden/);
const blocked = await submitV13(new Request("https://preview.example/api/v13/synthetic-submit", { method: "POST" }), env, { ...options, ready: false });
assert.equal(blocked.status, 503);
const badOrigin = await submitV13(new Request("https://preview.example/api/v13/synthetic-submit", { method: "POST", headers: { origin: "https://other.example", "content-type": "application/json" }, body: JSON.stringify(baseline) }), env, options);
assert.equal(badOrigin.status, 403);

// The deployed shared Worker remains locked; exercising the branch entry points
// locally must not cause writes even with a syntactically valid fixture.
const lockedEnv = { COLLECTION_ENABLED: "false", SYNTHETIC_PIPELINE_ENABLED: "false", ENVIRONMENT: "preview" };
assert.equal((await baseWorker.fetch(new Request("https://preview.example/api/v13/submit", { method: "POST" }), lockedEnv)).status, 503);
assert.equal((await syntheticWorker.fetch(new Request("https://preview.example/api/v13/synthetic-submit", { method: "POST" }), lockedEnv)).status, 503);
assert.equal(stored.length, 5);
console.log("research-v1.3: five profiles, strict fields, scoring, storage and locked gates passed");
