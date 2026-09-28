import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { V13_PROFILES, V13_CHOICES, validateV13, scoreV13, minimisedV13 } from "../public/js/research-v13-contract.js";
import { SITES, resolveWorkshopView, workshopPages, resolveWorkshopMode, rc1FleetWorkshopMode } from "../public/js/v13-questions.js";
import { grTimingCard, grEnergyCard, ukAlignmentCard, ukStreetChargeCard, ukHomeParkingCard, ukEnergyCard, ukOvernightFrame, ukEnergyLedger, ukRecoveryCard } from "../public/js/v13-site-visuals.js";
import { routeProfile } from "../public/js/variant-registry.js";
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
assert.equal(routeProfile("fi-fleet", "dispatcher").sus, false);
assert.equal(routeProfile("fi-fleet", "fleet_manager").sus, false);
assert.deepEqual(workshopPages("gr-prosumer", "passenger_prosumer", questionView.modules, V13_PROFILES), ["intro", "scenario", "energy", "recovery", "comprehension", "done"]);
assert.deepEqual(workshopPages("fi-fleet", "dispatcher", fullView.modules, V13_PROFILES), ["intro", "alignment", "scenario", "energy", "recovery", "comprehension", "outcomes", "done"]);
assert.deepEqual(workshopPages("uk-v2h", "accessible_driver", fullView.modules, V13_PROFILES), ["intro", "alignment", "street_charge", "recovery", "home_intro", "scenario", "energy", "comprehension", "sus", "outcomes", "done"]);
assert.deepEqual(workshopPages("uk-v2h", "accessible_driver", demoView.modules, V13_PROFILES), ["intro", "alignment", "street_charge", "recovery", "home_intro", "scenario", "energy", "done"]);
assert.match(grTimingCard("wait_for_res_surplus"), /charging-window selected[^>]*><strong>Renewable surplus later/);
assert.match(grEnergyCard("wait_for_lower_tariff", false), /Grid charges vehicle; V2G is not permitted/);
assert.match(grEnergyCard("wait_for_lower_tariff", true), /Vehicle sends energy to grid with separate permission/);
assert.match(ukAlignmentCard("ready"), /Position confirmed/);
assert.match(ukStreetChargeCard(true), /Grid sends energy to the vehicle at the street bay/);
assert.match(ukHomeParkingCard(true), /Vehicle parked beside the house in a marked parking space/);
assert.match(ukHomeParkingCard(false), /separate from the street bay/);
assert.match(ukEnergyCard("support_home", 3, true, true, true), /Vehicle sends energy to home/);
assert.match(ukEnergyCard("support_home", 3, false, true), /Home support was stopped/);
assert.match(ukEnergyCard("support_home", 1, true, false), /Grid charges vehicle/);
assert.match(ukEnergyCard("protect_trip", 5, false, false), /Morning departure: the vehicle is ready at 70%/);
assert.match(ukEnergyCard("support_home", 0, true, false), /Run overnight example/);
assert.match(ukEnergyCard("support_home", 2, true, false, true), /Pause example/);
assert.match(ukEnergyCard("support_home", 2, true, false), /Next checkpoint/);
assert.match(ukEnergyCard("support_home", 2, true, false), /Cancel home support/);
assert.match(ukEnergyCard("support_home", 3, true, true), /Stop home support/);
assert.doesNotMatch(ukEnergyCard("charge_now", 3, false, false), /data-uk-sharing/);
assert.match(ukEnergyCard("support_home", 5, false, true), /Replay overnight example/);
assert.match(ukEnergyCard("support_home", 5, false, true), /Taken from car for V2H<\/span><strong data-uk-drawn>3\.0 kWh/);
assert.match(ukEnergyCard("support_home", 5, false, true), /Delivered to house<\/span><strong data-uk-home>2\.7 kWh/);
assert.match(ukEnergyCard("support_home", 5, false, true), /energy cost difference<\/span><strong data-uk-difference>£0\.36/);
assert.deepEqual(ukEnergyLedger("support_home", 5, true), { chargedKwh: 6, drawnKwh: 3, homeKwh: 2.7, avoidedPounds: 0.81, replacementPounds: 0.45, differencePounds: 0.36 });
assert.equal(ukEnergyLedger("support_home", 2, false).drawnKwh, 0, "No V2H delivery before export");
assert.equal(ukEnergyLedger("support_home", 5, false).differencePounds, 0, "Cancelling V2H has no claimed saving");
assert.equal(ukEnergyLedger("charge_now", 5, true).drawnKwh, 0, "Charge-only never exports");
assert.equal(ukEnergyLedger("protect_trip", 5, true).chargedKwh, 0, "Protected trip is not a charging session");
assert.equal(ukOvernightFrame("charge_now", 5, true, true).soc, 80, "Only the home-support choice may export energy");
assert.equal(ukOvernightFrame("support_home", 1, true, false).soc, 75);
assert.equal(ukOvernightFrame("support_home", 2, true, false).soc, 80);
assert.equal(ukOvernightFrame("support_home", 3, true, true).direction, "home");
assert.equal(ukOvernightFrame("support_home", 5, false, true).soc, 75, "Stopping after export preserves the last illustrative charge");
assert.equal(ukOvernightFrame("support_home", 5, false, false).soc, 80, "Cancelling before export preserves charged vehicle");
for (const choice of V13_CHOICES["uk-v2h"].scenario) for (let phase = 0; phase <= 5; phase++) {
  for (const active of [false, true]) {
    const frame = ukOvernightFrame(choice, phase, active, choice === "support_home" && phase >= 3 && active);
    assert.ok(frame.soc >= 65, `${choice}/${phase} must preserve the illustrative trip reserve`);
    if (choice !== "support_home") assert.notEqual(frame.direction, "home");
  }
}
assert.match(ukRecoveryCard(), /Home energy sharing is not assumed through the fallback/);
assert.equal(resolveWorkshopMode({ instrument_mode: "research", collection_enabled: true }, questionView), "instrument-preview");
assert.equal(resolveWorkshopMode({ instrument_mode: "research", collection_enabled: true }, fullView), "instrument-preview");
assert.equal(resolveWorkshopMode({ instrument_mode: "research", collection_enabled: true }, view("")), "research");
assert.equal(resolveWorkshopMode({ instrument_mode: "instrument-preview", collection_enabled: false }, view("")), "instrument-preview");
for (const preset of [demoView, questionView, fullView, customView]) {
  const rc1 = rc1FleetWorkshopMode(preset);
  assert.equal(rc1.submit, false);
  assert.equal(rc1.constructPayload, false);
  assert.equal(rc1.modules.measurementFields, false);
  assert.equal(rc1.modules.comprehension, preset.modules.questions);
  assert.equal(rc1.modules.sus, preset.modules.sus);
  assert.equal(rc1.modules.outcomes, preset.modules.scales);
}
const publicFile = name => readFileSync(new URL(`../public/${name}`, import.meta.url), "utf8");
const styleHrefs = html => [...html.matchAll(/<link rel="stylesheet" href="([^"]+)"/g)].map(match => match[1]);
const imports = js => [...js.matchAll(/^import "([^"]+)";/gm)].map(match => match[1]);
assert.deepEqual(styleHrefs(publicFile("v13-fleet.html")), styleHrefs(publicFile("index.html")), "Finnish V1.3 must retain the RC1 mobile styles.");
assert.deepEqual(imports(publicFile("v13-fleet-app.js")), imports(publicFile("app.js")).filter(name => !name.includes("research-test-browser-shim")), "Finnish V1.3 must retain the RC1 animations and overlays.");
assert.match(publicFile("v13.html"), /v13-router\.js/);
assert.deepEqual(SITES["fi-fleet"].demoFi.scenarioOptions.map(([key]) => key), V13_CHOICES["fi-fleet"].scenario);
assert.deepEqual(SITES["fi-fleet"].demoFi.recoveryOptions.map(([key]) => key), V13_CHOICES["fi-fleet"].recovery);

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
