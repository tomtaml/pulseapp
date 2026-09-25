import { V13_PROFILES, SCHEMA_VERSION } from "./research-v13-contract.js";
import { SITES, COMMON_QUESTIONS, OUTCOME_QUESTIONS, COMPREHENSION } from "./v13-questions.js";
import { susItems } from "./copy.js";
import { esc } from "./ui.js";

const params = new URLSearchParams(location.search);
const variant = Object.hasOwn(SITES, params.get("variant")) ? params.get("variant") : "fi-fleet";
const site = SITES[variant];
const workshop = /^[A-Za-z0-9_-]{1,32}$/.test(params.get("workshop") || "") ? params.get("workshop") : "PREVIEW";
const demo = params.get("demo") === "1";
const requestedLanguage = params.get("lang") || "en";
// Wording is currently English for instrument review. Language-coded research
// submissions require approved translated wording before field use.
const language = "en";
const screen = document.querySelector("#screen");
const values = {};
let stage = 0;
let mode = "demo";
let config = { collection_enabled: false, turnstile_site_key: null };
let tokenWidget = null;
let submitted = false;
let submissionId = "";

document.querySelector("#siteBadge").textContent = site.badge;
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
function pages() { return mode === "demo" ? ["intro", "scenario", "recovery", "done"] : ["intro", "scenario", "recovery", "comprehension", ...(profile()?.sus ? ["sus"] : []), "outcomes", "done"]; }
function currentPage() { return pages()[stage] || "done"; }

function options(name, choices, selected = values[name]) {
  return `<div class="study-options">${choices.map(([value, label]) => `<label class="study-option"><input type="radio" name="${esc(name)}" value="${esc(value)}" ${selected === value ? "checked" : ""}><span>${esc(label)}</span></label>`).join("")}</div>`;
}
function scale(name, label) {
  return `<fieldset class="study-question"><legend>${esc(label)}</legend><p class="study-note">1 = strongly disagree · 5 = strongly agree</p><div class="study-scale">${[1,2,3,4,5].map(number => `<label class="study-option"><input type="radio" name="${esc(name)}" value="${number}" ${values[name] === number ? "checked" : ""}><span>${number}</span></label>`).join("")}</div></fieldset>`;
}
function buttonRow(label = "Continue") {
  return `<div class="study-actions">${stage ? `<button type="button" class="secondary" data-action="back">Back</button>` : ""}<button type="button" class="primary" data-action="next">${esc(label)}</button></div>`;
}

function render() {
  const page = currentPage();
  const count = pages().length - 1;
  const status = mode === "demo" ? "Demo · no survey or submission" : mode === "research" ? "Research · collection enabled" : "Instrument preview · no submission";
  document.querySelector("#modeBadge").textContent = status;
  let body = `<p class="study-progress">${page === "done" ? "Complete" : `Step ${stage + 1} of ${count}`}</p><p class="study-status">${status}</p>`;
  if (page === "intro") {
    body += `<h1>${esc(site.title)}</h1><p class="lead">${esc(site.intro)}</p>`;
    if (requestedLanguage !== "en") body += `<p class="study-status">The ${requestedLanguage === "fi" ? "Finnish" : "Greek"} instrument wording is awaiting review. This preview uses English.</p>`;
    body += `<fieldset class="study-question"><legend>Your perspective</legend>${options("participant_group", Object.entries(site.roles))}</fieldset>`;
    if (mode !== "demo") body += `<label class="study-option"><input type="checkbox" name="consent_confirmed" ${values.consent_confirmed ? "checked" : ""}><span>I have read the study information provided by the facilitator and agree to continue.</span></label>`;
    body += `<label class="study-option"><input type="checkbox" name="prototype_disclaimer_confirmed" ${values.prototype_disclaimer_confirmed ? "checked" : ""}><span>I understand this is a simulation, not a real charging service.</span></label>${buttonRow()}`;
  } else if (page === "scenario") {
    body += `<h1>Plan the energy session</h1><p class="lead">${esc(site.roleScenario?.[values.participant_group] || site.scenario)}</p><fieldset class="study-question"><legend>Choose one action</legend>${options("scenario_choice",site.scenarioOptions)}</fieldset>${buttonRow()}`;
  } else if (page === "recovery") {
    body += `<h1>Handle an interruption</h1><p class="lead">${esc(site.roleRecovery?.[values.participant_group] || site.recovery)}</p><fieldset class="study-question"><legend>Choose one recovery action</legend>${options("recovery_choice",site.recoveryOptions)}</fieldset>${buttonRow(mode === "demo" ? "Finish demo" : "Continue")}`;
  } else if (page === "comprehension") {
    body += `<h1>Understanding check</h1><p class="lead">These questions test whether the prototype explained the scenario clearly.</p>`;
    body += COMPREHENSION.map(([question, choices], index) => {
      const label = index === 2 && variant === "uk-v2h" ? "Where does shared energy go in this home scenario?" : question;
      return `<fieldset class="study-question"><legend>${index + 1}. ${esc(label)}</legend>${options(`comprehension_${index + 1}`,choices)}</fieldset>`;
    }).join("") + buttonRow();
  } else if (page === "sus") {
    body += `<h1>Usability (SUS)</h1><p class="lead">Rate the interface you just used.</p>`;
    body += susItems.en.map((label,index) => scale(`sus_${String(index + 1).padStart(2,"0")}`,`${index + 1}. ${label}`)).join("") + buttonRow();
  } else if (page === "outcomes") {
    body += `<h1>Confidence and intention</h1><p class="lead">Rate the service shown in this scenario.</p>`;
    body += [...COMMON_QUESTIONS, ...profile().outcomes.map(key => [key,OUTCOME_QUESTIONS[key]])].map(([key,label]) => scale(key,label)).join("");
    if (mode === "research" && config.collection_enabled) body += `<div id="turnstile" aria-label="Human verification"></div>`;
    body += buttonRow(mode === "research" && config.collection_enabled ? "Submit response" : "Finish preview");
  } else {
    body += `<h1>${submitted ? "Thank you — response recorded" : mode === "demo" ? "Demo complete" : "Instrument preview complete"}</h1><p>${submitted ? "Your anonymous response was stored." : "No research response was sent or stored."}</p>${submissionId ? `<p>Submission ID: ${esc(submissionId)}</p>` : ""}`;
  }
  screen.innerHTML = body;
  screen.querySelector('[data-action="back"]')?.addEventListener("click", () => { collect(); stage -= 1; render(); });
  screen.querySelector('[data-action="next"]')?.addEventListener("click", next);
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
  if (page === "intro" && (!profile() || !values.prototype_disclaimer_confirmed || (mode !== "demo" && !values.consent_confirmed))) return "Choose a role and acknowledge the information above.";
  if (page === "scenario" && !values.scenario_choice) return "Choose a session action.";
  if (page === "recovery" && !values.recovery_choice) return "Choose a recovery action.";
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
  mode = demo ? "demo" : result.instrument_mode === "research" && result.collection_enabled === true ? "research" : "instrument-preview";
  render();
}).catch(() => { mode = demo ? "demo" : "instrument-preview"; render(); });
render();
