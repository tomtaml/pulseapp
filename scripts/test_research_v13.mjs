import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { V13_PROFILES, V13_CHOICES, validateV13, scoreV13, minimisedV13 } from "../public/js/research-v13-contract.js";
import { SITES, resolveWorkshopView, workshopPages, resolveWorkshopMode, resolveSiteMode, workshopOutcomeKeys, rc1FleetWorkshopMode } from "../public/js/v13-questions.js";
import { ukHomeParkingCard, ukEnergyCard, ukOvernightFrame, ukEnergyLedger } from "../public/js/v13-site-visuals.js";
import { grPlanCard, grEnergyCard, grFrame, grWindow, grExportCheckpoint, grCanExport, GR_OFFER_TERMS } from "../public/js/v13-gr-journey.js";
import { initialGrParking, grParkingTransition, grParkingCard } from "../public/js/v13-gr-parking.js";
import { initialUkParking, ukParkingTransition } from "../public/js/v13-uk-parking.js";
import { ukTaskItems, UK_TASK_ITEMS, UK_COMPREHENSION } from "../public/js/v13-uk-instrument.js";
import { GR_TASK_ITEMS, GR_COMPREHENSION } from "../public/js/v13-gr-instrument.js";
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
assert.deepEqual(workshopPages("gr-prosumer", "passenger_prosumer", questionView.modules, V13_PROFILES), ["intro", "gr_arrival", "scenario", "energy", "gr_probes", "comprehension", "done"]);
assert.deepEqual(workshopPages("gr-prosumer", "passenger_prosumer", demoView.modules, V13_PROFILES), ["intro", "gr_arrival", "scenario", "energy", "done"]);
assert.deepEqual(workshopPages("gr-prosumer", "passenger_prosumer", demoView.modules, V13_PROFILES, true), ["intro", "gr_arrival", "scenario", "energy", "recovery", "done"], "The fault exercise is a separate next-day challenge after the baseline session");
assert.deepEqual(workshopPages("uk-v2h", "accessible_driver", demoView.modules, V13_PROFILES, true), ["intro", "home_intro", "energy", "done"], "The Trikala switch does not affect other sites");
assert.equal(GR_TASK_ITEMS.length, 6);
assert.equal(GR_COMPREHENSION.length, 4);
assert.deepEqual(workshopPages("fi-fleet", "dispatcher", fullView.modules, V13_PROFILES), ["intro", "alignment", "scenario", "energy", "recovery", "comprehension", "outcomes", "done"]);
assert.deepEqual(workshopPages("uk-v2h", "accessible_driver", fullView.modules, V13_PROFILES), ["intro", "home_intro", "energy", "uk_probes", "comprehension", "sus", "outcomes", "done"]);
assert.deepEqual(workshopPages("uk-v2h", "accessible_driver", questionView.modules, V13_PROFILES), ["intro", "home_intro", "energy", "uk_probes", "comprehension", "done"]);
assert.deepEqual(workshopPages("uk-v2h", "accessible_driver", demoView.modules, V13_PROFILES), ["intro", "home_intro", "energy", "done"]);
let grPark = initialGrParking();
assert.match(grParkingCard(grPark), /shared crossing/i);
assert.equal(grParkingTransition(grPark, "start").stage, "approach", "Guidance needs a route check");
grPark = grParkingTransition(grPark, "inspect");
grPark = grParkingTransition(grPark, "start");
assert.equal(grPark.stage, "moving");
assert.match(grParkingCard(grPark), /Stop manoeuvre/);
grPark = grParkingTransition(grPark, "pedestrian");
assert.equal(grPark.stage, "paused");
assert.equal(grParkingTransition(grPark, "aligned").stage, "paused", "Pedestrian stop cannot be bypassed");
grPark = grParkingTransition(grPark, "review");
let grManual = grParkingTransition(grPark, "manual");
assert.match(grParkingCard(grManual), /gr-dpad/);
grManual = grParkingTransition(grManual, "move_left");
assert.equal(grManual.manualStep, 0);
assert.match(grParkingCard(grManual), /That arrow did not advance/);
for (const move of ["forward", "right", "back"]) grManual = grParkingTransition(grManual, `move_${move}`);
assert.equal(grManual.stage, "manual_aligned");
assert.match(grParkingCard(grManual), /data-gr-manual-step="3"/);
assert.equal(grParkingTransition(grManual, "confirm").stage, "aligned");
assert.equal(grParkingTransition(grParkingTransition(grPark, "resume"), "aligned").stage, "aligned");
assert.equal(grWindow("wait_for_res_surplus", "14:15").feasible, true);
assert.equal(grWindow("wait_for_res_surplus", "14:15", 30).feasible, false, "Delay invalidates a late window");
assert.equal(grWindow("wait_for_lower_tariff", "17:30").cost, 4.2);
assert.equal(grWindow("charge_now", "14:15", 30).ready, "11:30");
assert.match(grPlanCard("charge_now", 65, "14:15"), /unverified 22 kW AC-side equipment class/);
assert.match(grPlanCard("charge_now", 65, "14:15"), /charging only/);
assert.match(grPlanCard("charge_now", 65, "17:30"), /possible V2G/);
assert.match(grPlanCard("charge_now", 65, "17:30", "offer_a"), /data-gr-consent/);
assert.match(grPlanCard("charge_now", 70, "17:30", "offer_a"), /leave about 75% in the car, not below your 70% protected minimum/);
assert.match(grPlanCard("charge_now", 75, "17:30", "offer_a"), /leave about 75% in the car, not below your 75% protected minimum/);
assert.match(grPlanCard("wait_for_lower_tariff", 70, "17:30", "offer_a"), /up to €0\.54/);
assert.match(grPlanCard("wait_for_lower_tariff", 70, "17:30", "offer_b"), /up to €0\.90/);
assert.match(grPlanCard("charge_now", 70, "17:30", "none"), /Gross credit<\/b>€0; no export/);
assert.match(grPlanCard("charge_now", 70, "17:30"), /before later replacement energy, losses, battery wear and fees/);
assert.match(grPlanCard("charge_now", 65, "17:30", "offer_a", true), /data-gr-consent checked/);
assert.match(grPlanCard("charge_now", 65, "17:30", "none"), /Charging only · no V2G/);
assert.doesNotMatch(grPlanCard("charge_now", 65, "14:15", "offer_a", true), /data-gr-consent/);
assert.doesNotMatch(grPlanCard("charge_now", 80, "17:30", "offer_a", true), /data-gr-consent/);
assert.equal(grFrame("charge_now", 0, 70).soc, 45, "Reserve never fabricates initial energy");
assert.equal(grFrame("charge_now", 3, 75).label, "Charging · reserve not reached yet");
assert.equal(grFrame("charge_now", 4, 75, 3).soc, 75);
assert.equal(grFrame("charge_now", 4, 80, 3).exportedKwh, 0, "Export cannot exceed an 80% protected minimum");
assert.equal(grFrame("charge_now", 2, 65, 0, 30).time, "10:04", "Charging checkpoints show actual example times");
assert.equal(grCanExport("offer_a", true, 65, "17:30"), true);
assert.equal(grCanExport("offer_a", false, 65, "17:30"), false, "Offer choice alone cannot authorise export");
assert.equal(grCanExport("offer_a", true, 80, "17:30"), false);
assert.equal(grCanExport("offer_b", true, 65, "14:15"), false);
assert.equal(grCanExport("none", true, 65, "17:30"), false);
assert.deepEqual([0, 1, 2, 3, 4].map(step => grExportCheckpoint(step, 65).exportedKwh), [0, 0.75, 1.5, 2.25, 3]);
assert.equal(grExportCheckpoint(2, 65).time, "15:30");
assert.equal(grExportCheckpoint(4, 80).exportedKwh, 0, "Export cannot cross the reserve floor");
assert.match(grEnergyCard({ phase: 0 }), /Start planned session/);
assert.doesNotMatch(grEnergyCard({ phase: 0 }), /Next checkpoint/, "Participant demo has one session start");
assert.match(grEnergyCard({ phase: 0, facilitatorControls: true }), /Next checkpoint/, "Instrument review can step through the example");
assert.match(grEnergyCard({ phase: 4, reserve: 80 }), /charging-only stop/);
assert.match(grEnergyCard({ phase: 4, departure: "14:15" }), /Charging only/);
assert.doesNotMatch(grEnergyCard({ phase: 4, reserve: 65 }), /name="offer_choice"/, "Contract selection happens before starting the session");
assert.equal(GR_OFFER_TERMS.offer_b.rate, 0.30);
assert.match(grEnergyCard({ phase: 0, reserve: 65, offerChoice: "offer_a", v2gEnabled: true }), /V2G enabled under Offer A/);
const grWaiting = grEnergyCard({ phase: 4, reserve: 65, offerChoice: "offer_a", v2gEnabled: true, permission: "scheduled", delayMinutes: 30 });
assert.match(grWaiting, /The car remains parked at 80% until the 15:00 V2G window/);
assert.match(grWaiting, /Cancel planned V2G/);
assert.match(grWaiting, /No energy transfer is active/);
assert.match(grEnergyCard({ phase: 4, reserve: 65, offerChoice: "offer_a", v2gEnabled: true, permission: "canceled" }), /V2G canceled before 15:00; no energy was exported/);
const grExporting = grEnergyCard({ phase: 4, reserve: 65, offerChoice: "offer_a", v2gEnabled: true, permission: "active", exportStep: 2, exportedKwh: 1.5 });
assert.match(grExporting, /V2G: car sends energy to grid/);
assert.match(grExporting, /15:30 · exporting/);
assert.match(grExporting, /1.50 of 3.00 kWh/);
assert.match(grExporting, /Pause V2G/);
const grPaused = grEnergyCard({ phase: 4, reserve: 65, offerChoice: "offer_a", v2gEnabled: true, permission: "paused", exportStep: 2, exportedKwh: 1.5 });
assert.match(grPaused, /Resume V2G/);
assert.doesNotMatch(grPaused, /Next 15-minute checkpoint/);
assert.match(grEnergyCard({ phase: 4, reserve: 65, offerChoice: "offer_a", v2gEnabled: true, permission: "paused", facilitatorControls: true }), /Next 15-minute checkpoint/);
assert.match(grPaused, /No energy transfer is active/);
assert.match(grEnergyCard({ phase: 4, reserve: 65, offerChoice: "offer_b", v2gEnabled: true, permission: "stopped", exportStep: 2, exportedKwh: 1.5 }), /V2G stopped at 15:30 at your request/);
assert.match(grEnergyCard({ phase: 4, reserve: 65, offerChoice: "offer_b", v2gEnabled: true, permission: "complete", exportStep: 4, exportedKwh: 3 }), /16:00 after 3.00 kWh/);
let parking = initialUkParking();
assert.match(ukHomeParkingCard(parking), /Check surroundings/);
parking = ukParkingTransition(parking, "inspect");
assert.doesNotMatch(ukHomeParkingCard(parking), /Use manual guidance/, "Initial parking requires obstacle or fault recovery before manual fallback");
assert.equal(ukParkingTransition(parking, "manual").stage, "checked", "Manual path cannot bypass an initial guidance attempt or fault");
parking = ukParkingTransition(parking, "start");
assert.match(ukHomeParkingCard(parking), /Stop manoeuvre/);
parking = ukParkingTransition(parking, "obstacle");
assert.equal(parking.stage, "blocked");
assert.match(ukHomeParkingCard(parking), /Parking stopped automatically; charging and V2H have not started/);
assert.equal(ukParkingTransition(parking, "parked").stage, "blocked", "Obstacle cannot be skipped");
assert.equal(ukParkingTransition(parking, "manual").stage, "blocked", "Manual recovery also requires an obstacle review");
const support = ukParkingTransition(parking, "support");
assert.equal(support.stage, "support");
assert.match(ukHomeParkingCard(support), /no real message has been sent/);
assert.match(ukHomeParkingCard(support), /no provider contact and sends no request/);
assert.equal(ukParkingTransition(support, "parked").stage, "support", "Support does not bypass the route check");
parking = ukParkingTransition(parking, "review");
assert.equal(parking.obstacleCleared, true);
assert.match(ukHomeParkingCard(parking), /Confirm route clear and resume/);
assert.match(ukHomeParkingCard(parking), /Use manual guidance/);
let manualParking = ukParkingTransition(parking, "manual");
assert.equal(manualParking.stage, "manual_guidance");
assert.equal(ukParkingTransition(manualParking, "manual_confirm").stage, "manual_guidance", "Manual approach cannot skip positioning");
assert.match(ukHomeParkingCard(manualParking), /data-uk-move="forward" class="recommended"/);
assert.match(ukHomeParkingCard(manualParking), /home-dpad-center/, "The arrows have a central vehicle marker");
assert.match(ukHomeParkingCard(manualParking), /Recommended correction: a short step forward/);
manualParking = ukParkingTransition(manualParking, "move_left");
assert.equal(manualParking.manualStep, 0, "Wrong arrow must not advance manoeuvre");
assert.equal(manualParking.wrongMoves, 1);
assert.match(ukHomeParkingCard(manualParking), /Wrong-direction attempts: 1/);
assert.match(ukHomeParkingCard(manualParking), /That arrow did not advance the illustration/);
manualParking = ukParkingTransition(manualParking, "move_forward");
assert.equal(manualParking.manualStep, 1);
assert.equal(manualParking.lastMoveWasWrong, false);
assert.match(ukHomeParkingCard(manualParking), /data-uk-move="right" class="recommended"/);
manualParking = ukParkingTransition(manualParking, "move_right");
assert.equal(manualParking.manualStep, 2);
assert.match(ukHomeParkingCard(manualParking), /data-uk-move="back" class="recommended"/);
assert.equal(ukParkingTransition(manualParking, "stop").stage, "stopped", "Manual manoeuvre can be stopped");
assert.equal(ukParkingTransition(ukParkingTransition(manualParking, "stop"), "manual_confirm").stage, "stopped", "Stopped manual movement cannot be confirmed");
manualParking = ukParkingTransition(manualParking, "move_back");
assert.equal(manualParking.stage, "manual_aligned");
assert.equal(ukParkingTransition(manualParking, "parked").stage, "manual_aligned", "Driver must confirm the clear route");
assert.match(ukHomeParkingCard(manualParking), /Three illustrated corrections are complete/);
manualParking = ukParkingTransition(manualParking, "manual_confirm");
assert.equal(manualParking.stage, "parked");
assert.match(ukHomeParkingCard(manualParking), /using driver-controlled steps/);
parking = ukParkingTransition(parking, "resume");
assert.equal(ukParkingTransition(parking, "stop").stage, "stopped", "Manual stop works during resumed movement");
parking = ukParkingTransition(parking, "parked");
assert.equal(parking.stage, "parked");
assert.match(ukHomeParkingCard(parking), /Vehicle parked beside the house after the guided obstacle check/);
let manualStop = ukParkingTransition(ukParkingTransition(initialUkParking(), "inspect"), "start");
manualStop = ukParkingTransition(manualStop, "stop");
assert.equal(ukParkingTransition(manualStop, "review").stage, "checked", "Manual stop requires a fresh check before another attempt");
let faultParking = ukParkingTransition(ukParkingTransition(initialUkParking(), "inspect"), "guidance_fault");
assert.equal(faultParking.stage, "fault");
assert.equal(ukParkingTransition(faultParking, "manual").stage, "fault", "Fault needs route recheck before manual movement");
faultParking = ukParkingTransition(faultParking, "review");
assert.equal(ukParkingTransition(faultParking, "manual").stage, "manual_guidance");
assert.match(ukHomeParkingCard(ukParkingTransition(faultParking, "manual")), /automatic guidance unavailable/);
assert.equal(ukTaskItems(false).length, UK_TASK_ITEMS.length - 1, "Manual clarity item is asked only when arrows were used");
assert.equal(ukTaskItems(true).length, UK_TASK_ITEMS.length);
assert.equal(UK_COMPREHENSION.length, 4);
assert.deepEqual(UK_COMPREHENSION.map(([,choices]) => choices[0][0]), ["review", "minimum", "home", "driver"]);
assert.ok(UK_TASK_ITEMS.every(item => /^UK-[WH]\d$/.test(item.hypothesis)));
assert.equal(new Set(UK_TASK_ITEMS.map(item => item.key)).size, UK_TASK_ITEMS.length);
assert.match(readFileSync(new URL("../public/js/v13-app.js", import.meta.url), "utf8"), /variant === "uk-v2h" \? UK_COMPREHENSION : variant === "gr-prosumer" \? GR_COMPREHENSION : COMPREHENSION/);
assert.match(ukEnergyCard("support_home", 4, true, 5, true), /Vehicle sends energy to home/);
assert.match(ukEnergyCard("support_home", 4, false, 5), /Home support was stopped/);
assert.match(ukEnergyCard("support_home", 1, true, 0), /Grid charges vehicle/);
assert.match(ukEnergyCard("protect_trip", 7, false, 0), /Morning departure: the vehicle is at 50%, below the selected 70% minimum/);
assert.match(ukEnergyCard("support_home", 0, true, 0), /Run overnight example/);
assert.match(ukEnergyCard("support_home", 2, true, 0, true), /Pause example/);
assert.match(ukEnergyCard("support_home", 2, true, 0), /Next checkpoint/);
assert.match(ukEnergyCard("support_home", 2, true, 0), /Cancel home support/);
assert.match(ukEnergyCard("support_home", 4, true, 5), /Stop home support/);
assert.doesNotMatch(ukEnergyCard("charge_now", 4, false, 0), /data-uk-sharing/);
assert.match(ukEnergyCard("support_home", 7, true, 10), /Replay overnight example/);
assert.match(ukEnergyCard("support_home", 7, false, 5), /Replay with home support/);
assert.match(ukEnergyCard("support_home", 7, false, 10), /Taken from car for V2H<\/span><strong data-uk-drawn>6\.0 kWh/);
assert.match(ukEnergyCard("support_home", 7, false, 10), /Delivered to house<\/span><strong data-uk-home>5\.4 kWh/);
assert.match(ukEnergyCard("support_home", 7, false, 10), /energy cost difference<\/span><strong data-uk-difference>£0\.72/);
assert.deepEqual(ukEnergyLedger("support_home", 7, 10), { chargedKwh: 18, drawnKwh: 6, homeKwh: 5.4, avoidedPounds: 1.62, replacementPounds: 0.9, differencePounds: 0.72 });
assert.equal(ukEnergyLedger("support_home", 3, 0).drawnKwh, 0, "No V2H delivery before export");
assert.equal(ukEnergyLedger("support_home", 7, 0).differencePounds, 0, "Cancelling V2H has no claimed saving");
assert.equal(ukEnergyLedger("charge_now", 7, 10).drawnKwh, 0, "Charge-only never exports");
assert.equal(ukEnergyLedger("protect_trip", 7, 10).chargedKwh, 0, "Protected trip is not a charging session");
assert.equal(ukOvernightFrame("charge_now", 7, true, 10).soc, 80, "Only the home-support choice may export energy");
assert.equal(ukOvernightFrame("support_home", 1, true, 0).soc, 60);
assert.equal(ukOvernightFrame("support_home", 3, true, 0).soc, 80);
assert.equal(ukOvernightFrame("support_home", 4, true, 5).direction, "home");
assert.equal(ukOvernightFrame("support_home", 5, true, 5, 75).direction, "idle", "No transfer after the chosen 75% minimum is reached");
assert.equal(ukOvernightFrame("support_home", 7, false, 5).soc, 75, "Stopping after export preserves the last illustrative charge");
assert.equal(ukOvernightFrame("support_home", 7, false, 0).soc, 80, "Cancelling before export preserves charged vehicle");
for (const reserve of [65, 70, 75, 80]) for (const choice of V13_CHOICES["uk-v2h"].scenario) for (let phase = 0; phase <= 7; phase++) {
  for (const active of [false, true]) {
    const points = choice === "support_home" && active && phase >= 4 ? phase === 4 ? Math.min(5, 80 - reserve) : 80 - reserve : 0;
    const frame = ukOvernightFrame(choice, phase, active, points, reserve);
    if (phase >= 3 && choice === "support_home") assert.ok(frame.soc >= reserve, `${choice}/${phase}/${reserve} must preserve the chosen morning minimum`);
    if (choice !== "support_home") assert.notEqual(frame.direction, "home");
    if (choice === "support_home" && phase === 7 && active) assert.equal(frame.soc, reserve);
  }
}
assert.equal(ukEnergyLedger("support_home", 7, 15, 65).homeKwh, 8.1);
assert.equal(ukEnergyLedger("support_home", 7, 5, 75).differencePounds, 0.36);
assert.equal(ukEnergyLedger("support_home", 7, 10, 80).drawnKwh, 0, "80% morning minimum prevents export");
assert.equal(resolveWorkshopMode({ instrument_mode: "research", collection_enabled: true }, questionView), "instrument-preview");
assert.equal(resolveWorkshopMode({ instrument_mode: "research", collection_enabled: true }, fullView), "instrument-preview");
assert.equal(resolveWorkshopMode({ instrument_mode: "research", collection_enabled: true }, view("")), "research");
assert.equal(resolveSiteMode({ instrument_mode: "research", collection_enabled: true }, view(""), "uk-v2h"), "instrument-preview", "UK route stays storage-free until its instrument is revised");
assert.equal(resolveSiteMode({ instrument_mode: "research", collection_enabled: true }, view(""), "gr-prosumer"), "instrument-preview", "GR draft journey stays storage-free until review");
assert.equal(resolveSiteMode({ instrument_mode: "research", collection_enabled: true }, view(""), "fi-fleet"), "research");
assert.deepEqual(workshopOutcomeKeys("uk-v2h", V13_PROFILES["uk-v2h"].accessible_driver), ["v2h_intention_t1", "accessibility_item", "actor_trust_item"]);
assert.deepEqual(workshopOutcomeKeys("fi-fleet", V13_PROFILES["fi-fleet"].fleet_driver), V13_PROFILES["fi-fleet"].fleet_driver.outcomes);
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
assert.match(publicFile("v13-study.css"), /grid-template-areas: "\. forward \." "left center right" "\. back \."/, "Forward and Back must share the vertical axis");
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
const ukSynthetic = fixtures.find(body => body.variant === "uk-v2h");
assert.equal(validateV13({ ...ukSynthetic, uk_positioning_independence: 4 }, { synthetic: true }), "Unexpected or hidden response field.", "Draft UK probes cannot enter the collection contract");
assert.equal(validateV13({ ...ukSynthetic, comprehension_answers: ["review", "minimum", "home", "driver"] }, { synthetic: true }), "Four controlled comprehension answers are required.", "UK preview wording is not silently treated as approved research comprehension");
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
