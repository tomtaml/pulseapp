import { V13_PROFILES, SCHEMA_VERSION } from "./research-v13-contract.js";
import { SITES, COMMON_QUESTIONS, OUTCOME_QUESTIONS, COMPREHENSION, resolveWorkshopView, workshopPages, resolveSiteMode, workshopOutcomeKeys } from "./v13-questions.js?v=20260930b";
import { alignmentVisual, fleetScenarioCard, v2gOffer } from "./screens-core.js";
import { ukHomeParkingCard, ukEnergyCard, ukOvernightFrame, ukEnergyLedger } from "./v13-site-visuals.js";
import { grPlanCard, grEnergyCard, grFrame, grWindow, grExportCheckpoint, grCanExport, GR_OFFER_TERMS } from "./v13-gr-journey.js?v=20260930b";
import { initialGrParking, grParkingTransition, grParkingCard } from "./v13-gr-parking.js";
import { initialUkParking, ukParkingTransition } from "./v13-uk-parking.js";
import { ukTaskItems, UK_COMPREHENSION } from "./v13-uk-instrument.js";
import { grCheckpointItem, GR_CLOSING_ITEMS, GR_FAULT_FOLLOWUP, grSharedItems, grAnswerValue } from "./v13-gr-instrument.js?v=20260930b";
import { susItems } from "./copy.js";
import { esc } from "./ui.js";

const params = new URLSearchParams(location.search);
const variant = Object.hasOwn(SITES, params.get("variant")) ? params.get("variant") : "fi-fleet";
const site = SITES[variant];
const workshop = /^[A-Za-z0-9_-]{1,32}$/.test(params.get("workshop") || "") ? params.get("workshop") : "PREVIEW";
const view = resolveWorkshopView(params);
const { modules } = view;
const grFaultExercise = variant === "gr-prosumer" && params.get("fault") === "1";
const demo = !modules.questions && !modules.sus && !modules.scales;
const requestedLanguage = params.get("lang") || "en";
const finnishDemo = variant === "fi-fleet" && requestedLanguage === "fi" && demo;
const siteCopy = finnishDemo ? { ...site, ...site.demoFi } : site;
const demoText = (en, fi) => finnishDemo ? fi : en;
if (finnishDemo) document.documentElement.lang = "fi";
// Wording is currently English for instrument review. Language-coded research
// submissions require approved translated wording before field use.
const language = "en";
const screen = document.querySelector("#screen");
const values = variant === "uk-v2h" ? { participant_group: "accessible_driver", scenario_choice: "support_home" } : variant === "gr-prosumer" ? { participant_group: "passenger_prosumer", scenario_choice: "charge_now" } : {};
// The illustrative fleet state and visuals come from the existing RC1 screens.
// No vehicle, charger or participant data is fetched for this workshop route.
const fleetState = {
  alignment_stage: "approach", alignment_completed: false,
  current_soc: 55, minimum_soc: 65, dwell_minutes: 90, departure_time: "17:00"
};
let grParking = initialGrParking();
let grParkingTimer = null;
let grReserve = 65;
let grDeparture = "17:30";
let grPhase = 0;
let grRunning = false;
let grTimer = null;
let grPermission = "off";
let grExported = 0;
let grExportStep = 0;
let grExportTimer = null;
let grLeftEarly = false;
let grOfferChoice = null;
let grV2gEnabled = false;
let grCheckpointPage = null;
const grCompletedCheckpoints = new Set();
let ukParking = initialUkParking();
let ukParkingTimer = null;
let ukOvernightPhase = 0;
let ukHomeSharing = false;
let ukHomeExported = 0;
let ukMorningMinimum = 70;
let ukCycleRunning = false;
let ukCycleTimer = null;
let stage = 0;
// Do not expose the demo route while the collection configuration is pending.
// A fast click could otherwise skip the preview/research acknowledgement.
let mode = demo ? "demo" : "loading";
let config = { collection_enabled: false, turnstile_site_key: null };
let tokenWidget = null;
let submitted = false;
let submissionId = "";

document.querySelector("#siteBadge").textContent = siteCopy.badge;
document.querySelector("#textButton").addEventListener("click", event => {
  const pressed = document.body.classList.toggle("large-text");
  event.currentTarget.setAttribute("aria-pressed", String(pressed));
});
document.querySelector("#contrastButton").addEventListener("click", event => {
  const pressed = document.body.classList.toggle("high-contrast");
  event.currentTarget.setAttribute("aria-pressed", String(pressed));
});
if (variant === "uk-v2h" && "speechSynthesis" in window) {
  const button = document.querySelector("#readButton");
  button.hidden = false;
  button.addEventListener("click", () => {
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(screen.innerText);
    utterance.lang = "en-GB";
    speechSynthesis.speak(utterance);
  });
}

function profile() { return V13_PROFILES[variant][values.participant_group]; }
function outcomeKeys() { return workshopOutcomeKeys(variant, profile()); }
function pages() { return workshopPages(variant, values.participant_group, modules, V13_PROFILES, grFaultExercise); }
function currentPage() { return pages()[stage] || "done"; }
function nextLabel() { return pages()[stage + 1] === "done" ? demoText("Finish preview", "Viimeistele esittely") : demoText("Continue", "Jatka"); }

function energyPreview() {
  if (variant === "fi-fleet") {
    return `<p class="study-note">${demoText("This is a conditional, illustrative V2G offer. Energy would flow from vehicle to grid only with the agreed permission and protected reserve.", "Tämä on kuvitteellinen V2G-tarjous. Sähköä siirtyisi autosta verkkoon vain sovitulla luvalla ja suojatun lähtövarauksen rajoissa.")}</p>${v2gOffer(finnishDemo ? "fi" : "en", fleetState)}`;
  }
  if (variant === "gr-prosumer") {
    return grEnergyCard({ choice: values.scenario_choice, reserve: grReserve, departure: grDeparture, phase: grPhase, running: grRunning, permission: grPermission, offerChoice: grOfferChoice, v2gEnabled: grV2gEnabled, facilitatorControls: mode !== "demo" && params.get("view") !== "light", exportStep: grExportStep, exportedKwh: grExported });
  }
  return ukEnergyCard(values.scenario_choice, ukOvernightPhase, ukHomeSharing, ukHomeExported, ukCycleRunning, ukMorningMinimum);
}

function stopGrTimers() {
  clearTimeout(grTimer);
  clearTimeout(grExportTimer);
  grTimer = null;
  grExportTimer = null;
  grRunning = false;
  if (grPermission === "active") grPermission = "stopped";
}

function stopGrParkingTimer() { clearTimeout(grParkingTimer); grParkingTimer = null; }
function grParkingAction(action) {
  stopGrParkingTimer();
  const previous = grParking;
  grParking = grParkingTransition(grParking, action);
  render();
  const car = screen.querySelector(".gr-car");
  const manualPositions = ["translate(-35px, 10px)", "translate(-20px, -8px)", "translate(-6px, -8px)", "translate(0)"];
  if (car && action.startsWith("move_") && previous.manualStep !== grParking.manualStep) {
    const destination = manualPositions[grParking.manualStep];
    car.style.transform = manualPositions[previous.manualStep];
    void car.offsetWidth;
    requestAnimationFrame(() => { if (screen.contains(car)) car.style.transform = destination; });
  } else if (car && ["moving", "resuming"].includes(grParking.stage)) {
    const from = grParking.stage === "moving" ? "translate(-105px, 20px)" : "translate(-35px, 10px)";
    const to = grParking.stage === "moving" ? "translate(-35px, 10px)" : "translate(0)";
    car.style.transform = from;
    void car.offsetWidth;
    requestAnimationFrame(() => { if (screen.contains(car)) car.style.transform = to; });
  }
  if (grParking.stage === "moving" || grParking.stage === "resuming") {
    grParkingTimer = setTimeout(() => grParkingAction(grParking.stage === "moving" ? "pedestrian" : "aligned"), 1600);
  }
  if (action.startsWith("move_") && grParking.stage === "manual") screen.querySelector('[data-gr-move].recommended')?.focus();
  else screen.querySelector('[data-gr-parking]')?.focus();
  if (grParking.stage === "aligned") screen.querySelector('[data-action="next"]')?.focus();
}

function resetGrSession(preservePlan = false) {
  stopGrTimers();
  grCompletedCheckpoints.delete("energy");
  grCheckpointPage = null;
  delete values.gr_reserve_understanding;
  grPhase = 0;
  grPermission = "off";
  grExported = 0;
  grExportStep = 0;
  grLeftEarly = false;
  if (!preservePlan) { grOfferChoice = null; grV2gEnabled = false; values.recovery_choice = null; }
}

function grNextCheckpoint() {
  if (grPhase >= 4) return;
  grPhase += 1;
  grLeftEarly = false;
  if (grPhase === 4) {
    grRunning = false;
    if (grCanExport(grOfferChoice, grV2gEnabled, grReserve, grDeparture)) {
      grPermission = "scheduled";
      grExportStep = 0;
      grExported = 0;
      grExportTimer = setTimeout(grStartExport, 2200);
    }
  }
  render();
  if (grRunning) grTimer = setTimeout(grNextCheckpoint, 1250);
}

function grStartExport() {
  if (grPermission !== "scheduled") return;
  grPermission = "active";
  render();
  grExportTimer = setTimeout(grNextExport, 1800);
}

function grNextExport(manual = false) {
  if (grPermission !== "active" && !(manual && grPermission === "paused")) return;
  grExportStep = Math.min(4, grExportStep + 1);
  grExported = grExportCheckpoint(grExportStep, grReserve).exportedKwh;
  if (grExportStep === 4) grPermission = "complete";
  render();
  if (grPermission === "active") grExportTimer = setTimeout(grNextExport, 1800);
  else if (manual) screen.querySelector('[data-gr-session="step_export"]')?.focus();
}

function grRecoveryNotice() {
  if (!values.recovery_choice) return "";
  const retry = grWindow(values.scenario_choice, grDeparture, 30);
  const earlier = grWindow("charge_now", grDeparture, 30);
  const notice = values.recovery_choice === "retry"
    ? `A 30-minute retry on the selected window would be ready at ${retry.ready}, ${retry.feasible ? "within" : "past"} the ${grDeparture} departure margin.`
    : values.recovery_choice === "charge_now"
      ? `An earlier charge-now fallback would be ready at ${earlier.ready} at an example €${earlier.cost.toFixed(2)} for this different day.`
      : "Ask the provider how assisted recovery would work. Contacting them does not itself guarantee a start time or charge level; no request is sent.";
  return `<p class="study-note" role="status">${notice} This is a next-day thought exercise; it does not change the completed energy session above.</p>`;
}

function stopUkCycle() {
  clearTimeout(ukCycleTimer);
  ukCycleTimer = null;
  ukCycleRunning = false;
}

function stopUkParkingTimer() {
  clearTimeout(ukParkingTimer);
  ukParkingTimer = null;
}

function parkingAction(action) {
  stopUkParkingTimer();
  const previousParking = ukParking;
  const previousStage = ukParking.stage;
  ukParking = ukParkingTransition(ukParking, action);
  render();
  if (action.startsWith("move_") && ukParking.manualStep !== previousParking.manualStep) {
    const vehicle = screen.querySelector(".home-vehicle");
    const positions = ["translate(16px, 8px)", "translate(16px, -4px)", "translate(4px, -4px)", "translate(0)"];
    const destination = positions[ukParking.manualStep];
    vehicle.style.transform = positions[previousParking.manualStep];
    void vehicle.offsetWidth;
    requestAnimationFrame(() => { if (screen.contains(vehicle)) vehicle.style.transform = destination; });
  } else if (ukParking.stage === "moving" || ukParking.stage === "resuming") {
    const destinationStage = ukParking.stage;
    const vehicle = screen.querySelector(".home-vehicle");
    vehicle.classList.replace(destinationStage, previousStage);
    void vehicle.offsetWidth;
    requestAnimationFrame(() => {
      if (screen.contains(vehicle)) vehicle.classList.replace(previousStage, destinationStage);
    });
    const arrival = destinationStage === "moving" ? "obstacle" : "parked";
    ukParkingTimer = setTimeout(() => parkingAction(arrival), destinationStage === "moving" ? 1800 : 1500);
  }
  if (action.startsWith("move_") && ukParking.stage === "manual_guidance") screen.querySelector(`[data-uk-move="${action.slice(5)}"]`)?.focus();
  else screen.querySelector("[data-uk-parking]")?.focus();
  if (ukParking.stage === "parked") screen.querySelector('[data-action="next"]')?.focus();
}

function updateUkEnergy() {
  const card = screen.querySelector(".overnight-card");
  if (!card) return;
  const frame = ukOvernightFrame(values.scenario_choice, ukOvernightPhase, ukHomeSharing, ukHomeExported, ukMorningMinimum);
  const ledger = ukEnergyLedger(values.scenario_choice, ukOvernightPhase, ukHomeExported, ukMorningMinimum);
  const effectiveDirection = ukCycleRunning && ukOvernightPhase === 0 && values.scenario_choice !== "protect_trip" ? "charge" : frame.direction;
  const direction = effectiveDirection === "home" ? "Vehicle sends energy to home" : effectiveDirection === "charge" ? "Grid charges vehicle" : "No energy transfer is active";
  const paused = !ukCycleRunning && ukOvernightPhase > 0 && ukOvernightPhase < 7;
  const flow = card.querySelector("[data-uk-flow]");
  card.querySelector("[data-uk-time]").textContent = frame.time;
  card.querySelector("[data-uk-soc]").textContent = `${frame.soc}%`;
  card.querySelector("[data-uk-battery]").setAttribute("aria-label", `Vehicle battery ${frame.soc} percent; chosen morning minimum ${ukMorningMinimum} percent`);
  card.querySelector("[data-uk-fill]").style.width = `${frame.soc}%`;
  card.querySelector("[data-uk-marker]").style.left = `${ukMorningMinimum}%`;
  card.querySelector("[data-uk-reserve]").textContent = `${ukMorningMinimum}%`;
  card.querySelector("[data-uk-minimum]").disabled = ukOvernightPhase !== 0 || ukCycleRunning;
  const potential = ukEnergyLedger("support_home", 7, 80 - ukMorningMinimum, ukMorningMinimum);
  card.querySelector("[data-uk-min-preview]").textContent = `At ${ukMorningMinimum}% minimum, up to ${potential.homeKwh.toFixed(1)} kWh could reach the house after charging to 80%; illustrative energy cost difference £${potential.differencePounds.toFixed(2)} under the assumptions below. ${ukMorningMinimum === 80 ? "No V2H export is available." : "Compare household support with the charge retained for travel."}`;
  card.querySelector("[data-uk-state]").textContent = ukOvernightPhase === 7 ? "Ready for next trip" : ukCycleRunning ? "Running" : paused ? "Paused" : "Ready to start";
  flow.classList.toggle("idle", !ukCycleRunning || effectiveDirection === "idle");
  flow.setAttribute("aria-label", paused ? "Paused; no energy transfer is active" : direction);
  card.querySelector("[data-uk-from]").innerHTML = effectiveDirection === "home" ? "🚐<small>Vehicle</small>" : "⚡<small>Grid</small>";
  card.querySelector("[data-uk-to]").innerHTML = effectiveDirection === "home" ? "🏠<small>Home</small>" : "🚐<small>Vehicle</small>";
  card.querySelector("[data-uk-direction]").textContent = paused ? "Paused · no energy transfer" : direction;
  card.querySelector("[data-uk-status]").textContent = paused ? `Session paused at ${frame.time}. Vehicle battery ${frame.soc}%; no energy transfer. The ${ukMorningMinimum}% morning minimum remains protected.` : ukCycleRunning && ukOvernightPhase === 0 ? "Charging started at the home setting. Vehicle battery is 50%; next checkpoint 19:30." : frame.status;
  card.querySelector("[data-uk-charged]").textContent = `${ledger.chargedKwh.toFixed(1)} kWh`;
  card.querySelector("[data-uk-drawn]").textContent = `${ledger.drawnKwh.toFixed(1)} kWh`;
  card.querySelector("[data-uk-home]").textContent = `${ledger.homeKwh.toFixed(1)} kWh`;
  card.querySelector("[data-uk-difference]").textContent = `£${ledger.differencePounds.toFixed(2)}`;
  card.querySelector("[data-uk-equation]").textContent = `House import avoided: £${ledger.avoidedPounds.toFixed(2)} − battery energy replacement: £${ledger.replacementPounds.toFixed(2)} = £${ledger.differencePounds.toFixed(2)}.`;
  card.querySelectorAll("[data-uk-checkpoint]").forEach(item => item.classList.toggle("current", Number(item.dataset.ukCheckpoint) === ukOvernightPhase));
  card.querySelector("[data-uk-night]").textContent = ukOvernightPhase === 7 ? ukHomeSharing ? "Replay overnight example" : "Replay with home support" : ukCycleRunning ? "Pause example" : ukOvernightPhase === 0 ? "Run overnight example" : "Resume example";
  card.querySelector("[data-uk-night-step]").hidden = ukCycleRunning || ukOvernightPhase === 7;
  card.querySelector("[data-uk-night-skip]").hidden = ukOvernightPhase === 7;
  const sharing = card.querySelector("[data-uk-sharing]");
  if (sharing) {
    sharing.hidden = !ukHomeSharing || ukOvernightPhase === 7;
    sharing.textContent = ukOvernightPhase < 4 ? "Cancel home support" : "Stop home support";
  }
}

function advanceUkCycle() {
  if (ukOvernightPhase >= 7) return;
  ukOvernightPhase += 1;
  if (ukHomeSharing && ukOvernightPhase === 4) ukHomeExported = Math.min(5, 80 - ukMorningMinimum);
  if (ukHomeSharing && ukOvernightPhase === 5) ukHomeExported = 80 - ukMorningMinimum;
  if (ukOvernightPhase === 7) stopUkCycle();
  updateUkEnergy();
  if (ukCycleRunning) ukCycleTimer = setTimeout(advanceUkCycle, 1400);
}

function options(name, choices, selected = values[name]) {
  return `<div class="study-options">${choices.map(([value, label]) => `<label class="study-option"><input type="radio" name="${esc(name)}" value="${esc(value)}" ${String(selected) === String(value) ? "checked" : ""}><span>${esc(label)}</span></label>`).join("")}</div>`;
}
function scale(name, label, optional = false) {
  return `<fieldset class="study-question"><legend>${esc(label)}</legend><p class="study-note">1 = strongly disagree · 5 = strongly agree</p><div class="study-scale">${[1,2,3,4,5].map(number => `<label class="study-option"><input type="radio" name="${esc(name)}" value="${number}" ${values[name] === number ? "checked" : ""}><span>${number}</span></label>`).join("")}</div>${optional ? options(name, [["cannot_judge", "Cannot judge"]]) : ""}</fieldset>`;
}
function grQuestion(item) {
  if (item.key === "gr_alignment_ease") {
    const ratings = item.choices.filter(([value]) => /^[1-5]$/.test(value));
    const other = item.choices.filter(([value]) => !/^[1-5]$/.test(value));
    return `<fieldset class="study-question"><legend>${esc(item.label)}</legend><div class="study-scale study-scale-labelled">${ratings.map(([value, label]) => `<label class="study-option"><input type="radio" name="${esc(item.key)}" value="${esc(value)}" ${String(values[item.key]) === value ? "checked" : ""}><span class="scale-number" aria-hidden="true">${esc(value)}</span><span class="scale-label">${esc(label)}</span></label>`).join("")}</div>${options(item.key, other)}</fieldset>`;
  }
  return `<fieldset class="study-question"><legend>${esc(item.label)}</legend>${options(item.key, item.choices)}</fieldset>`;
}
function buttonRow(label = demoText("Continue", "Jatka")) {
  if (variant === "gr-prosumer" && grCheckpointPage === currentPage()) {
    const item = grCheckpointItem(grCheckpointPage, grReserve);
    return `<section class="gr-checkpoint" tabindex="-1" aria-label="Optional question after the completed task"><h2>One quick question · optional</h2><p class="study-note">You can answer or skip. There is no pass mark.</p>${grQuestion(item)}<div class="study-actions"><button type="button" class="secondary" data-action="back">Back</button><button type="button" class="primary" data-action="next">Continue</button><button type="button" class="secondary" data-action="skip_checkpoint">Skip question</button></div></section>`;
  }
  return `<div class="study-actions">${stage ? `<button type="button" class="secondary" data-action="back">${demoText("Back", "Takaisin")}</button>` : ""}<button type="button" class="primary" data-action="next">${esc(label)}</button></div>`;
}

function render() {
  if (mode === "loading") {
    document.querySelector("#modeBadge").textContent = "Loading instrument";
    screen.innerHTML = `<h1>${esc(site.title)}</h1><p class="study-status" role="status">Loading the study instrument…</p>`;
    return;
  }
  const page = currentPage();
  const count = pages().length - 1;
  const status = mode === "demo" ? demoText("Demo · no survey or submission", "Esittely · ei kyselyä eikä lähetystä") : mode === "research" ? "Research · collection enabled" : "Workshop preview · no submission";
  document.querySelector("#modeBadge").textContent = status;
  let body = `<p class="study-progress">${page === "done" ? demoText("Complete", "Valmis") : demoText(`Step ${stage + 1} of ${count}`, `Vaihe ${stage + 1} / ${count}`)}</p><p class="study-status">${status}</p>`;
  if (page === "intro") {
    body += `<h1>${esc(siteCopy.title)}</h1><p class="lead">${esc(siteCopy.intro)}</p>`;
    if (requestedLanguage !== "en" && !finnishDemo) body += `<p class="study-status">The ${requestedLanguage === "fi" ? "Finnish" : requestedLanguage === "el" ? "Greek" : "requested"} instrument wording is awaiting review. This preview uses English.</p>`;
    if (variant === "fi-fleet") body += `<fieldset class="study-question"><legend>${demoText("Your perspective", "Oma näkökulmasi")}</legend>${options("participant_group", Object.entries(siteCopy.roles))}</fieldset>`;
    if (variant === "gr-prosumer") body += `<section class="study-question" aria-label="Preview participation and privacy information"><h2>About this preview</h2><p>Your answers and choices stay in this page and are not submitted or saved as a participant record. Reloading the page clears them. You may skip survey questions or stop at any time. Separate facilitator notes follow the workshop information provided to you.</p><label class="study-option"><input type="checkbox" name="gr_preview_notice_confirmed" ${values.gr_preview_notice_confirmed ? "checked" : ""}><span>I have read this preview information and choose to continue.</span></label></section>`;
    if (mode === "research") body += `<label class="study-option"><input type="checkbox" name="consent_confirmed" ${values.consent_confirmed ? "checked" : ""}><span>I have read the study information provided by the facilitator and agree to continue.</span></label>`;
    body += `<label class="study-option"><input type="checkbox" name="prototype_disclaimer_confirmed" ${values.prototype_disclaimer_confirmed ? "checked" : ""}><span>${demoText("I understand this is a simulation, not a real charging service.", "Ymmärrän, että tämä on simulaatio eikä oikea latauspalvelu.")}</span></label>${buttonRow()}`;
  } else if (page === "alignment") {
    body += `<h1>${demoText("Approach the wireless charging bay", "Aja langattomalle latauspaikalle")}</h1><p class="lead">${demoText("A snowbank narrows the space. Use the guidance to align the van with the wireless pad before the next delivery.", "Lumivalli kaventaa ruutua. Kohdista auto latausalustaan ennen seuraavaa toimitusta.")}</p>${alignmentVisual(finnishDemo ? "fi" : "en", fleetState)}`;
    if (values.participant_group === "fleet_driver") {
      body += `<div class="alignment-controls"><button type="button" class="secondary" data-align="guided">${demoText("Show manoeuvre guidance", "Näytä ajo-ohje")}</button><button type="button" class="primary" data-align="auto">${demoText("Try automatic alignment", "Kokeile automaattista kohdistusta")}</button></div>`;
    } else {
      body += `<p class="study-note">${demoText("Review how alignment is shown to the driver. The driver would make the manoeuvre.", "Tarkastele, miten kohdistus näkyy kuljettajalle. Kuljettaja tekisi varsinaisen ajoliikkeen.")}</p>`;
    }
    body += buttonRow();
  } else if (page === "gr_arrival") {
    body += `<h1>Arrive at the Trikala wireless bay</h1><p class="lead">Park for a longer daily stop at a shared bay. Watch the crossing. In this staged example a pedestrian enters the route, so guided parking stops until you check the path again.</p>${grParkingCard(grParking)}${buttonRow()}`;
  } else if (page === "home_intro") {
    body += `<h1>Check and park beside the house</h1><p class="lead">Follow one home V2H journey. Watch the space around the vehicle and the accessible entrance route. A guided manoeuvre can stop at an obstacle, or guidance can become unavailable. Recheck the route and choose guided parking or the three-step manual arrow controls; Stop remains available.</p>${ukHomeParkingCard(ukParking)}${buttonRow()}`;
  } else if (page === "scenario") {
    body += `<h1>${demoText("Plan the energy session", "Suunnittele latausjakso")}</h1><p class="lead">${esc(siteCopy.roleScenario?.[values.participant_group] || siteCopy.scenario)}</p>`;
    if (variant === "fi-fleet") body += fleetScenarioCard(finnishDemo ? "fi" : "en", fleetState);
    if (variant === "gr-prosumer") body += grPlanCard(values.scenario_choice, grReserve, grDeparture, grOfferChoice, grV2gEnabled);
    else body += `<fieldset class="study-question"><legend>${demoText("Choose one action", "Valitse toimintatapa")}</legend>${options("scenario_choice",siteCopy.scenarioOptions)}</fieldset>`;
    body += buttonRow(variant === "gr-prosumer" ? "Confirm session plan" : demoText("Continue", "Jatka"));
  } else if (page === "energy") {
    body += `<h1>${variant === "uk-v2h" ? "Home charging and V2H" : variant === "gr-prosumer" ? "One parked energy session" : demoText("Follow the energy flow", "Seuraa energian suuntaa")}</h1><p class="lead">${variant === "uk-v2h" ? "Choose the minimum car charge needed for the morning. In this simulation home support is authorised, the car charges from 50% to 80%, then supplies some household demand only above your chosen minimum. Run, pause or step through the night; stop home support whenever needed. Actual compatibility, household backup rules and tariffs require site confirmation." : variant === "gr-prosumer" ? "The V2G plan was enabled or declined before starting. Run one parked session to see charging reach its 80% target, followed by any permitted export; the next-trip minimum remains protected." : demoText("See where energy would move in this simulated service and what remains protected.", "Katso, mihin sähkö siirtyisi tässä simulaatiossa ja mikä varaus säilyy suojattuna.")}</p>${energyPreview()}${variant === "gr-prosumer" && grLeftEarly ? `<p class="study-note" role="status">${grFrame(values.scenario_choice, grPhase, grReserve, grExported).soc < grReserve ? `Charging stopped before your ${grReserve}% next-trip minimum. Resume charging or ask for help before relying on this plan.` : `Charging stopped early at ${grFrame(values.scenario_choice, grPhase, grReserve, grExported).soc}%; the ${grReserve}% minimum is retained. No export is permitted.`}</p>` : ""}${buttonRow()}`;
  } else if (page === "recovery") {
    body += `<h1>${variant === "gr-prosumer" ? "Optional exercise: another day's start delay" : demoText("Handle an interruption", "Toimi häiriötilanteessa")}</h1><p class="lead">${esc(siteCopy.roleRecovery?.[values.participant_group] || siteCopy.recovery)}</p>${variant === "gr-prosumer" ? `<div class="site-demo-card"><strong>A separate parking day, after the example you completed</strong><p>Imagine arriving at 45% again. A warm-weather fault delays the start by 30 minutes; no energy moves during that delay. The selected ${grWindow(values.scenario_choice, grDeparture).label.toLowerCase()} window would then be ready at ${grWindow(values.scenario_choice, grDeparture, 30).ready}, ${grWindow(values.scenario_choice, grDeparture, 30).feasible ? "within" : "past"} the ${grDeparture} departure margin. Any V2G would still require reaching the 80% target, your ${grReserve}% minimum and your permission. This fault did not happen during the first session.</p></div>` : ""}<fieldset class="study-question"><legend>${demoText("Choose one recovery action", "Valitse toimintatapa häiriössä")}</legend>${options("recovery_choice",variant === "gr-prosumer" && values.scenario_choice === "charge_now" ? siteCopy.recoveryOptions.filter(([action]) => action !== "charge_now") : siteCopy.recoveryOptions)}</fieldset>${variant === "gr-prosumer" ? grRecoveryNotice() : ""}${buttonRow(nextLabel())}`;
  } else if (page === "uk_probes") {
    body += `<h1>Oxfordshire task experience</h1><p class="lead">Think about the home parking and V2H example you just used. These are draft workshop questions about accessible positioning, recovery, reserves and control. You may leave an item unanswered.</p>`;
    body += ukTaskItems(ukParking.manualUsed).map(item => scale(item.key, item.label)).join("") + buttonRow(nextLabel());
  } else if (page === "gr_closing") {
    body += `<h1>A few questions about this stop</h1><p class="lead">Think about the parking and energy session you just tried. All questions are optional. You can choose Cannot judge or continue without answering.</p>`;
    // Preference ratings precede diagnostic checks and any next-day fault.
    if (modules.scales) body += grSharedItems(COMMON_QUESTIONS, OUTCOME_QUESTIONS).map(([key, label]) => scale(key, label, true)).join("");
    if (modules.questions) body += GR_CLOSING_ITEMS.map(grQuestion).join("");
    body += buttonRow(nextLabel());
  } else if (page === "gr_fault_followup") {
    body += `<h1>After the separate delay exercise</h1><p class="lead">This optional response is separate from your first-session ratings.</p>${grQuestion(GR_FAULT_FOLLOWUP)}${buttonRow(nextLabel())}`;
  } else if (page === "comprehension") {
    body += `<h1>Understanding check</h1><p class="lead">These questions test whether the prototype explained the scenario clearly.</p>`;
    body += (variant === "uk-v2h" ? UK_COMPREHENSION : COMPREHENSION).map(([question, choices], index) => {
      return `<fieldset class="study-question"><legend>${index + 1}. ${esc(question)}</legend>${options(`comprehension_${index + 1}`,choices)}</fieldset>`;
    }).join("") + buttonRow(nextLabel());
  } else if (page === "sus") {
    body += `<h1>Usability (SUS)</h1><p class="lead">Rate the interface you just used.${variant === "gr-prosumer" ? " This separate ten-item module is optional in the preview; you may continue without completing it." : ""}</p>`;
    body += susItems.en.map((label,index) => scale(`sus_${String(index + 1).padStart(2,"0")}`,`${index + 1}. ${label}`)).join("") + buttonRow(nextLabel());
  } else if (page === "outcomes") {
    body += `<h1>Confidence, trust and intention</h1><p class="lead">Rate the service shown in this scenario. Confidence in the service and trust in its operator are separate items.</p>`;
    body += [...COMMON_QUESTIONS, ...outcomeKeys().map(key => [key,OUTCOME_QUESTIONS[key]])].map(([key,label]) => scale(key,label)).join("");
    if (mode === "research" && config.collection_enabled) body += `<div id="turnstile" aria-label="Human verification"></div>`;
    body += buttonRow(mode === "research" && config.collection_enabled ? "Submit response" : "Finish preview");
  } else {
    body += `<h1>${submitted ? "Thank you — response recorded" : mode === "demo" ? demoText("Demo complete", "Esittely valmis") : "Workshop preview complete"}</h1><p>${submitted ? "Your anonymous response was stored." : demoText("No research response was sent or stored.", "Tutkimusvastauksia ei lähetetty eikä tallennettu." )}</p>${submissionId ? `<p>Submission ID: ${esc(submissionId)}</p>` : ""}`;
    if (variant === "uk-v2h" && !submitted) {
      const ledger = ukEnergyLedger(values.scenario_choice, 7, ukHomeExported, ukMorningMinimum);
      body += `<p class="study-note">${ukParking.obstacleSeen ? "The illustrated obstacle stopped guided parking and was reviewed." : ukParking.guidanceFault ? "Guided parking became unavailable and the route was rechecked." : "The route was checked before parking."} ${ukParking.manualUsed ? "The driver-controlled manoeuvre was completed step by step." : "The guided manoeuvre was completed after the route check."} The simulated V2H session finished at ${ukOvernightFrame(values.scenario_choice, 7, ukHomeSharing, ukHomeExported, ukMorningMinimum).soc}% vehicle charge (chosen morning minimum ${ukMorningMinimum}%). ${ledger.drawnKwh.toFixed(1)} kWh was taken from the car and ${ledger.homeKwh.toFixed(1)} kWh reached the house. Illustrative energy cost difference: £${ledger.differencePounds.toFixed(2)}, before recharge losses, wear and fees.</p>`;
    }
    if (variant === "gr-prosumer" && !submitted) {
      const frame = grFrame(values.scenario_choice, grPhase, grReserve, grExported);
      const window = grWindow(values.scenario_choice, grDeparture);
      const offer = GR_OFFER_TERMS[grOfferChoice];
      body += `<div class="site-demo-card"><h2>Illustrative stop summary</h2><p>${grParking.manualUsed ? "Driver-controlled arrows followed the shared-path check." : "Guided parking resumed after the shared-path check."} The ${esc(window.label.toLowerCase())} plan ended with ${frame.soc}% in the car; chosen next-trip minimum ${grReserve}% and departure ${grDeparture}. ${frame.storedKwh.toFixed(1)} kWh was charged at an example cost of €${(frame.storedKwh * window.rate).toFixed(2)}.</p><p>${offer ? `${esc(offer.label)} was enabled within the stated limits before the session. ${frame.exportedKwh > 0 ? `${frame.exportedKwh.toFixed(1)} kWh was exported under those limits; example gross credit €${(frame.exportedKwh * offer.rate).toFixed(2)}.` : grLeftEarly ? "The car left before V2G; no energy was exported." : "V2G was stopped before energy moved."}` : grOfferChoice === "none" ? "Charging only was chosen; no V2G export occurred." : grLeftEarly ? "Charging stopped early; no V2G export occurred." : "No V2G offer was available for the chosen departure or reserve."}</p>${grFaultExercise ? `<p>The separate next-day start-delay exercise was discussed; your chosen response was ${esc(site.recoveryOptions.find(([id]) => id === values.recovery_choice)?.[1] || "not selected")}. It did not alter the first day's result.</p>` : ""}<p class="study-note">This is an on-screen practice summary, not a WTP/WTA estimate, real contract or stored participant record.</p></div>`;
    }
  }
  screen.innerHTML = body;
  screen.querySelector('[data-action="back"]')?.addEventListener("click", () => {
    collect(); stopUkCycle(); stopUkParkingTimer(); stopGrTimers(); stopGrParkingTimer();
    if (page === "home_intro" && ["moving", "resuming"].includes(ukParking.stage)) ukParking = ukParkingTransition(ukParking, "stop");
    grCheckpointPage = null;
    stage -= 1; render();
  });
  screen.querySelector('[data-action="next"]')?.addEventListener("click", () => next());
  screen.querySelector('[data-action="skip_checkpoint"]')?.addEventListener("click", () => next(true));
  if (page === "scenario" && variant === "gr-prosumer") screen.querySelectorAll('input[name="scenario_choice"]').forEach(input => {
    input.addEventListener("change", () => {
      collect();
      resetGrSession();
      render();
      screen.querySelector(`input[name="scenario_choice"][value="${values.scenario_choice}"]`)?.focus();
    });
  });
  if (page === "recovery" && variant === "gr-prosumer") screen.querySelectorAll('input[name="recovery_choice"]').forEach(input => input.addEventListener("change", () => {
    collect(); render(); screen.querySelector(`input[name="recovery_choice"][value="${values.recovery_choice}"]`)?.focus();
  }));
  screen.querySelector('[data-gr-reserve]')?.addEventListener("change", event => {
    grReserve = Number(event.currentTarget.value);
    resetGrSession();
    render();
    screen.querySelector('[data-gr-reserve]')?.focus();
  });
  screen.querySelector('[data-gr-departure]')?.addEventListener("change", event => {
    grDeparture = event.currentTarget.value;
    if (!grWindow(values.scenario_choice, grDeparture).feasible) values.scenario_choice = "charge_now";
    resetGrSession();
    render();
    screen.querySelector('[data-gr-departure]')?.focus();
  });
  screen.querySelectorAll('[data-gr-parking]').forEach(button => button.addEventListener("click", () => grParkingAction(button.dataset.grParking)));
  screen.querySelectorAll('[data-gr-move]').forEach(button => button.addEventListener("click", () => grParkingAction(`move_${button.dataset.grMove}`)));
  screen.querySelectorAll('[data-gr-session]').forEach(button => button.addEventListener("click", () => {
    const action = button.dataset.grSession;
    if (action === "run") {
      if (grRunning) { clearTimeout(grTimer); grRunning = false; }
      else { grRunning = true; grLeftEarly = false; grTimer = setTimeout(grNextCheckpoint, 1250); }
    } else if (action === "step") grNextCheckpoint();
    else if (action === "leave") { clearTimeout(grTimer); grRunning = false; grLeftEarly = true; }
    else if (action === "pause_export" && grPermission === "active") { clearTimeout(grExportTimer); grPermission = "paused"; }
    else if (action === "resume_export" && grPermission === "paused") { grPermission = "active"; grExportTimer = setTimeout(grNextExport, 1800); }
    else if (action === "step_export" && grPermission === "paused") return grNextExport(true);
    else if (action === "cancel_export" && grPermission === "scheduled") { clearTimeout(grExportTimer); grPermission = "canceled"; }
    else if (action === "stop_export" && ["active", "paused"].includes(grPermission)) { clearTimeout(grExportTimer); grPermission = "stopped"; }
    render();
    screen.querySelector(`[data-gr-session="${({ pause_export: "resume_export", resume_export: "pause_export" })[action] || action}"]`)?.focus();
  }));
  screen.querySelectorAll('input[name="offer_choice"]').forEach(input => input.addEventListener("change", () => {
    grOfferChoice = input.value;
    grV2gEnabled = false;
    render();
    screen.querySelector(`input[name="offer_choice"][value="${grOfferChoice}"]`)?.focus();
  }));
  screen.querySelector('[data-gr-consent]')?.addEventListener("change", event => {
    grV2gEnabled = event.currentTarget.checked;
    render();
    screen.querySelector('[data-gr-consent]')?.focus();
  });
  screen.querySelectorAll("[data-align]").forEach(button => button.addEventListener("click", () => {
    fleetState.alignment_stage = button.dataset.align === "guided" ? "guided" : "aligned";
    fleetState.alignment_completed = button.dataset.align === "auto";
    render();
  }));
  screen.querySelectorAll("[data-uk-parking]").forEach(button => button.addEventListener("click", () => parkingAction(button.dataset.ukParking)));
  screen.querySelectorAll("[data-uk-move]").forEach(button => button.addEventListener("click", () => parkingAction(`move_${button.dataset.ukMove}`)));
  screen.querySelector('[data-uk-night]')?.addEventListener("click", () => {
    if (ukOvernightPhase === 7) {
      stopUkCycle();
      ukOvernightPhase = 0;
      ukHomeSharing = values.scenario_choice === "support_home";
      ukHomeExported = 0;
      updateUkEnergy();
      screen.querySelector('[data-uk-minimum]')?.focus();
      return;
    } else if (ukCycleRunning) {
      stopUkCycle();
    } else {
      ukCycleRunning = true;
    }
    updateUkEnergy();
    if (ukCycleRunning) ukCycleTimer = setTimeout(advanceUkCycle, 1400);
  });
  screen.querySelector('[data-uk-night-step]')?.addEventListener("click", () => {
    advanceUkCycle();
    if (ukOvernightPhase === 7) screen.querySelector('[data-uk-night]')?.focus();
  });
  screen.querySelector('[data-uk-night-skip]')?.addEventListener("click", () => {
    stopUkCycle();
    if (values.scenario_choice === "support_home" && ukHomeSharing) ukHomeExported = 80 - ukMorningMinimum;
    ukOvernightPhase = 7;
    updateUkEnergy();
    screen.querySelector('[data-action="next"]')?.focus();
  });
  screen.querySelector('[data-uk-sharing]')?.addEventListener("click", () => {
    ukHomeSharing = false;
    updateUkEnergy();
    screen.querySelector('[data-uk-night]')?.focus();
  });
  screen.querySelector('[data-uk-minimum]')?.addEventListener("change", event => {
    if (ukOvernightPhase !== 0 || ukCycleRunning) return;
    ukMorningMinimum = [65, 70, 75, 80].includes(Number(event.currentTarget.value)) ? Number(event.currentTarget.value) : 70;
    updateUkEnergy();
  });
  if (page === "energy" && variant === "uk-v2h") updateUkEnergy();
  if (page === "outcomes" && mode === "research" && config.collection_enabled) renderTurnstile();
  screen.focus({ preventScroll: true });
}

function collect() {
  screen.querySelectorAll('input[type="radio"]:checked').forEach(input => {
    values[input.name] = variant === "gr-prosumer" ? grAnswerValue(input.name, input.value) : /^sus_\d\d$/.test(input.name) || input.name.startsWith("service_confidence_") || input.name.startsWith("uk_") || input.name.startsWith("gr_") || Object.hasOwn(OUTCOME_QUESTIONS,input.name) ? Number(input.value) : input.value;
  });
  for (const name of ["consent_confirmed", "prototype_disclaimer_confirmed", "gr_preview_notice_confirmed"]) {
    const control = screen.querySelector(`input[name="${name}"]`);
    if (control) values[name] = control.checked;
  }
}

function error(message) {
  screen.querySelector(".study-error")?.remove();
  const paragraph = document.createElement("p");
  paragraph.className = "study-error";
  paragraph.setAttribute("role","alert");
  paragraph.textContent = message;
  screen.querySelector(".study-actions")?.before(paragraph);
  paragraph.scrollIntoView({ block: "nearest" });
}

function valid() {
  const page = currentPage();
  if (page === "intro" && (!profile() || !values.prototype_disclaimer_confirmed || (mode === "research" && !values.consent_confirmed))) return demoText("Choose a role and acknowledge the information above.", "Valitse rooli ja vahvista, että kyseessä on simulaatio.");
  if (page === "intro" && variant === "gr-prosumer" && !values.gr_preview_notice_confirmed) return "Read and acknowledge the preview information before continuing.";
  if (page === "alignment" && values.participant_group === "fleet_driver" && !fleetState.alignment_completed) return demoText("Align the vehicle before continuing.", "Kohdista auto ennen jatkamista.");
  if (page === "home_intro" && ukParking.stage !== "parked") return "Complete the surrounding-area check and safely finish the illustrative home parking before continuing.";
  if (page === "gr_arrival" && grParking.stage !== "aligned") return "Complete the shared-path check and align the car before continuing.";
  if (page === "scenario" && !values.scenario_choice) return demoText("Choose a session action.", "Valitse latausjakson toimintatapa.");
  if (page === "scenario" && variant === "gr-prosumer" && !grWindow(values.scenario_choice, grDeparture).feasible) return "That window cannot meet the chosen departure margin. Choose an earlier window.";
  if (page === "scenario" && variant === "gr-prosumer" && grDeparture === "17:30" && grReserve < 80 && !grOfferChoice) return "Choose an illustrative V2G plan or Charging only before confirming this session.";
  if (page === "scenario" && variant === "gr-prosumer" && GR_OFFER_TERMS[grOfferChoice] && !grV2gEnabled) return "Accept the displayed reserve, export cap and departure limits to enable this V2G plan, or choose Charging only.";
  if (page === "energy" && variant === "uk-v2h" && ukOvernightPhase !== 7) return "Run, step through or skip the overnight example to morning before continuing.";
  if (page === "energy" && variant === "gr-prosumer" && grPhase !== 4 && (!grLeftEarly || grFrame(values.scenario_choice, grPhase, grReserve, grExported).soc < grReserve)) return "Reach the next-trip minimum before finishing. Run or step through charging; you may stop early once the minimum is reached.";
  if (page === "energy" && variant === "gr-prosumer" && ["scheduled", "active", "paused"].includes(grPermission)) return "Finish, cancel or stop the V2G example before continuing. Your next-trip minimum stays protected.";
  if (page === "recovery" && !values.recovery_choice) return demoText("Choose a recovery action.", "Valitse toimintatapa häiriössä.");
  if (page === "recovery" && variant === "gr-prosumer" && values.recovery_choice === "retry" && !grWindow(values.scenario_choice, grDeparture, 30).feasible) return "Retry after the 30-minute delay would miss your departure margin. Switch to an earlier start or discuss support.";
  if (page === "recovery" && variant === "gr-prosumer" && values.recovery_choice === "charge_now" && values.scenario_choice === "charge_now") return "Charge now is already selected. Retry the delayed start or discuss support.";
  if (page === "comprehension" && [1,2,3,4].some(index => !values[`comprehension_${index}`])) return "Answer all four questions.";
  if (page === "sus" && variant !== "gr-prosumer" && Array.from({ length:10 },(_,i)=>`sus_${String(i + 1).padStart(2,"0")}`).some(key => !values[key])) return "Rate all ten usability statements.";
  if (page === "outcomes" && [...COMMON_QUESTIONS.map(([key])=>key),...outcomeKeys()].some(key => !values[key])) return "Rate all statements before continuing.";
  return null;
}

function payload(token) {
  if (["uk-v2h", "gr-prosumer"].includes(variant)) throw new Error("This site preview cannot construct a research submission.");
  const body = {
    schema_version: SCHEMA_VERSION, variant, participant_group: values.participant_group,
    workshop_code: workshop, language, consent_confirmed: values.consent_confirmed,
    prototype_disclaimer_confirmed: values.prototype_disclaimer_confirmed,
    scenario_choice: values.scenario_choice, recovery_choice: values.recovery_choice,
    comprehension_answers: [1,2,3,4].map(index => values[`comprehension_${index}`]),
    service_confidence_1: values.service_confidence_1, service_confidence_2: values.service_confidence_2,
    turnstile_token: token
  };
  for (const key of profile().outcomes) body[key] = values[key];
  if (profile().sus) for (let i=1;i<=10;i++) { const key=`sus_${String(i).padStart(2,"0")}`; body[key]=values[key]; }
  return body;
}

async function next(skipCheckpoint = false) {
  collect();
  const problem = valid();
  if (problem) return error(problem);
  const page = currentPage();
  if (variant === "gr-prosumer" && modules.questions && grCheckpointItem(page, grReserve) && !grCompletedCheckpoints.has(page)) {
    if (grCheckpointPage !== page) {
      grCheckpointPage = page;
      render();
      const checkpoint = screen.querySelector(".gr-checkpoint");
      checkpoint.focus({ preventScroll: true });
      checkpoint.scrollIntoView({ block: "nearest" });
      return;
    }
    if (skipCheckpoint) delete values[grCheckpointItem(page, grReserve).key];
    grCompletedCheckpoints.add(page);
    grCheckpointPage = null;
  }
  if (currentPage() === "home_intro" && variant === "uk-v2h") {
    stopUkCycle();
    ukHomeSharing = true;
    ukHomeExported = 0;
    ukOvernightPhase = 0;
  }
  if (currentPage() === "outcomes" && mode === "research" && config.collection_enabled) {
    const token = window.turnstile?.getResponse(tokenWidget);
    if (!token) return error("Complete human verification before submitting.");
    try {
      const response = await fetch("/api/v13/submit", { method:"POST", headers:{"content-type":"application/json"}, body:JSON.stringify(payload(token)) });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || "Submission failed.");
      submitted = true; submissionId = data.submission_id;
    } catch (failure) { window.turnstile?.reset(tokenWidget); return error(failure.message); }
  }
  stopUkCycle();
  stopGrTimers();
  stopUkParkingTimer();
  stopGrParkingTimer();
  stage += 1; render();
}

function renderTurnstile() {
  if (!config.turnstile_site_key || !document.querySelector("#turnstile")) return;
  const mount = () => {
    if (document.querySelector("#turnstile") && window.turnstile) tokenWidget = window.turnstile.render("#turnstile", { sitekey: config.turnstile_site_key, action: "pulse-workshop-submit" });
  };
  if (window.turnstile) return mount();
  const script = document.createElement("script");
  script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
  script.onload = mount;
  script.onerror = () => error("Human verification could not load.");
  document.head.append(script);
}

fetch("/api/v13/config", { cache: "no-store" }).then(response => response.json()).then(result => {
  config = result;
  mode = resolveSiteMode(result, view, variant);
  render();
}).catch(() => { mode = demo ? "demo" : "instrument-preview"; render(); });
render();
