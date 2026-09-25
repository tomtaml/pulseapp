import { V13_PROFILES, SCHEMA_VERSION } from "./research-v13-contract.js";
import { SITES, COMMON_QUESTIONS, OUTCOME_QUESTIONS, COMPREHENSION, resolveWorkshopView, workshopPages, resolveWorkshopMode } from "./v13-questions.js";
import { alignmentVisual, fleetScenarioCard, v2gOffer } from "./screens-core.js";
import { susItems } from "./copy.js";
import { esc } from "./ui.js";

const params = new URLSearchParams(location.search);
const variant = Object.hasOwn(SITES, params.get("variant")) ? params.get("variant") : "fi-fleet";
const site = SITES[variant];
const workshop = /^[A-Za-z0-9_-]{1,32}$/.test(params.get("workshop") || "") ? params.get("workshop") : "PREVIEW";
const view = resolveWorkshopView(params);
const { modules } = view;
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
const values = {};
// The illustrative fleet state and visuals come from the existing RC1 screens.
// No vehicle, charger or participant data is fetched for this workshop route.
const fleetState = {
  alignment_stage: "approach", alignment_completed: false,
  current_soc: 55, minimum_soc: 65, dwell_minutes: 90, departure_time: "17:00"
};
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
function pages() { return workshopPages(variant, values.participant_group, modules, V13_PROFILES); }
function currentPage() { return pages()[stage] || "done"; }
function nextLabel() { return pages()[stage + 1] === "done" ? demoText("Finish preview", "Viimeistele esittely") : demoText("Continue", "Jatka"); }

function energyPreview() {
  if (variant === "fi-fleet") {
    return `<p class="study-note">${demoText("This is a conditional, illustrative V2G offer. Energy would flow from vehicle to grid only with the agreed permission and protected reserve.", "Tämä on kuvitteellinen V2G-tarjous. Sähköä siirtyisi autosta verkkoon vain sovitulla luvalla ja suojatun lähtövarauksen rajoissa.")}</p>${v2gOffer(finnishDemo ? "fi" : "en", fleetState)}`;
  }
  if (variant === "gr-prosumer") {
    return `<div class="v2g-card offer-card"><div class="scenario-badge">Illustrative workshop scenario</div><div class="v2g-flow"><span class="flow-node">⚡<small>grid</small></span><span class="flow-arrow">→</span><span class="flow-node">🚗<small>vehicle</small></span></div><p>A lower tariff or renewable surplus changes when the vehicle charges. Returning energy to the grid would require separate V2G permission and a protected reserve.</p></div>`;
  }
  const supportingHome = values.scenario_choice === "support_home";
  return `<div class="v2g-card offer-card"><div class="scenario-badge">Illustrative workshop scenario</div><div class="v2g-flow"><span class="flow-node">${supportingHome ? "🚗<small>vehicle</small>" : "⚡<small>grid</small>"}</span><span class="flow-arrow">→</span><span class="flow-node">${supportingHome ? "🏠<small>home</small>" : "🚗<small>vehicle</small>"}</span></div><p>${supportingHome ? "Home support is limited by the protected charge for the next trip. The driver may stop sharing." : "The vehicle charges for the next trip. Home energy sharing is not selected."}</p></div>`;
}

function options(name, choices, selected = values[name]) {
  return `<div class="study-options">${choices.map(([value, label]) => `<label class="study-option"><input type="radio" name="${esc(name)}" value="${esc(value)}" ${selected === value ? "checked" : ""}><span>${esc(label)}</span></label>`).join("")}</div>`;
}
function scale(name, label) {
  return `<fieldset class="study-question"><legend>${esc(label)}</legend><p class="study-note">1 = strongly disagree · 5 = strongly agree</p><div class="study-scale">${[1,2,3,4,5].map(number => `<label class="study-option"><input type="radio" name="${esc(name)}" value="${number}" ${values[name] === number ? "checked" : ""}><span>${number}</span></label>`).join("")}</div></fieldset>`;
}
function buttonRow(label = demoText("Continue", "Jatka")) {
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
    body += `<fieldset class="study-question"><legend>${demoText("Your perspective", "Oma näkökulmasi")}</legend>${options("participant_group", Object.entries(siteCopy.roles))}</fieldset>`;
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
  } else if (page === "scenario") {
    body += `<h1>${demoText("Plan the energy session", "Suunnittele latausjakso")}</h1><p class="lead">${esc(siteCopy.roleScenario?.[values.participant_group] || siteCopy.scenario)}</p>`;
    if (variant === "fi-fleet") body += fleetScenarioCard(finnishDemo ? "fi" : "en", fleetState);
    body += `<fieldset class="study-question"><legend>${demoText("Choose one action", "Valitse toimintatapa")}</legend>${options("scenario_choice",siteCopy.scenarioOptions)}</fieldset>${buttonRow()}`;
  } else if (page === "energy") {
    body += `<h1>${demoText("Follow the energy flow", "Seuraa energian suuntaa")}</h1><p class="lead">${demoText("See where energy would move in this simulated service and what remains protected.", "Katso, mihin sähkö siirtyisi tässä simulaatiossa ja mikä varaus säilyy suojattuna.")}</p>${energyPreview()}${buttonRow()}`;
  } else if (page === "recovery") {
    body += `<h1>${demoText("Handle an interruption", "Toimi häiriötilanteessa")}</h1><p class="lead">${esc(siteCopy.roleRecovery?.[values.participant_group] || siteCopy.recovery)}</p><fieldset class="study-question"><legend>${demoText("Choose one recovery action", "Valitse toimintatapa häiriössä")}</legend>${options("recovery_choice",siteCopy.recoveryOptions)}</fieldset>${buttonRow(nextLabel())}`;
  } else if (page === "comprehension") {
    body += `<h1>Understanding check</h1><p class="lead">These questions test whether the prototype explained the scenario clearly.</p>`;
    body += COMPREHENSION.map(([question, choices], index) => {
      const label = index === 2 && variant === "uk-v2h" ? "Where does shared energy go in this home scenario?" : question;
      return `<fieldset class="study-question"><legend>${index + 1}. ${esc(label)}</legend>${options(`comprehension_${index + 1}`,choices)}</fieldset>`;
    }).join("") + buttonRow(nextLabel());
  } else if (page === "sus") {
    body += `<h1>Usability (SUS)</h1><p class="lead">Rate the interface you just used.</p>`;
    body += susItems.en.map((label,index) => scale(`sus_${String(index + 1).padStart(2,"0")}`,`${index + 1}. ${label}`)).join("") + buttonRow(nextLabel());
  } else if (page === "outcomes") {
    body += `<h1>Confidence, trust and intention</h1><p class="lead">Rate the service shown in this scenario. Confidence in the service and trust in its operator are separate items.</p>`;
    body += [...COMMON_QUESTIONS, ...profile().outcomes.map(key => [key,OUTCOME_QUESTIONS[key]])].map(([key,label]) => scale(key,label)).join("");
    if (mode === "research" && config.collection_enabled) body += `<div id="turnstile" aria-label="Human verification"></div>`;
    body += buttonRow(mode === "research" && config.collection_enabled ? "Submit response" : "Finish preview");
  } else {
    body += `<h1>${submitted ? "Thank you — response recorded" : mode === "demo" ? demoText("Demo complete", "Esittely valmis") : "Workshop preview complete"}</h1><p>${submitted ? "Your anonymous response was stored." : demoText("No research response was sent or stored.", "Tutkimusvastauksia ei lähetetty eikä tallennettu." )}</p>${submissionId ? `<p>Submission ID: ${esc(submissionId)}</p>` : ""}`;
  }
  screen.innerHTML = body;
  screen.querySelector('[data-action="back"]')?.addEventListener("click", () => { collect(); stage -= 1; render(); });
  screen.querySelector('[data-action="next"]')?.addEventListener("click", next);
  screen.querySelectorAll("[data-align]").forEach(button => button.addEventListener("click", () => {
    fleetState.alignment_stage = button.dataset.align === "guided" ? "guided" : "aligned";
    fleetState.alignment_completed = button.dataset.align === "auto";
    render();
  }));
  if (page === "outcomes" && mode === "research" && config.collection_enabled) renderTurnstile();
  screen.focus({ preventScroll: true });
}

function collect() {
  screen.querySelectorAll('input[type="radio"]:checked').forEach(input => {
    values[input.name] = /^sus_\d\d$/.test(input.name) || input.name.startsWith("service_confidence_") || Object.hasOwn(OUTCOME_QUESTIONS,input.name) ? Number(input.value) : input.value;
  });
  for (const name of ["consent_confirmed", "prototype_disclaimer_confirmed"]) {
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
  if (page === "alignment" && values.participant_group === "fleet_driver" && !fleetState.alignment_completed) return demoText("Align the vehicle before continuing.", "Kohdista auto ennen jatkamista.");
  if (page === "scenario" && !values.scenario_choice) return demoText("Choose a session action.", "Valitse latausjakson toimintatapa.");
  if (page === "recovery" && !values.recovery_choice) return demoText("Choose a recovery action.", "Valitse toimintatapa häiriössä.");
  if (page === "comprehension" && [1,2,3,4].some(index => !values[`comprehension_${index}`])) return "Answer all four questions.";
  if (page === "sus" && Array.from({ length:10 },(_,i)=>`sus_${String(i + 1).padStart(2,"0")}`).some(key => !values[key])) return "Rate all ten usability statements.";
  if (page === "outcomes" && [...COMMON_QUESTIONS.map(([key])=>key),...profile().outcomes].some(key => !values[key])) return "Rate all statements before continuing.";
  return null;
}

function payload(token) {
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

async function next() {
  collect();
  const problem = valid();
  if (problem) return error(problem);
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
  mode = resolveWorkshopMode(result, view);
  render();
}).catch(() => { mode = demo ? "demo" : "instrument-preview"; render(); });
render();
