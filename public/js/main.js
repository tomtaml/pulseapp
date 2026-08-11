import { APP_VERSION, variants } from "./copy.js";
import { renderCoreScreen } from "./screens-core.js";
import { renderEvalScreen } from "./screens-eval.js";
import { esc, progress, t } from "./ui.js";

const qs = new URLSearchParams(location.search);
const variant = Object.hasOwn(variants, qs.get("variant")) ? qs.get("variant") : "fi-fleet";
const workshopCode = (qs.get("workshop") || "DEMO").replace(/[^A-Za-z0-9_-]/g, "").slice(0,32) || "DEMO";
const isDemo = qs.get("demo") === "1";
let language = variant.startsWith("fi-") ? "fi" : "en";
let config = { collection_enabled:false, free_text_enabled:false, turnstile_site_key:null, app_version:APP_VERSION };
let turnstileWidgetId = null;
let turnstileLoading = null;
let step = 0;
let state = {
  app_version:APP_VERSION, variant, workshop_code:workshopCode, language,
  participant_group:variants[variant].groups[0], consent_confirmed:false, prototype_disclaimer_confirmed:false,
  current_soc:55, minimum_soc:variant === "uk-v2h" ? 40 : 50, departure_time:"17:00",
  explicit_confirmation:true, comprehension_items:[], trust_values:[], sus_values:[],
  wireless_acceptance:3, bidirectional_participation:3, accessibility_understanding:3, optional_note:""
};

const screen = document.querySelector("#screen");
const variantBadge = document.querySelector("#variantBadge");
const collectionBadge = document.querySelector("#collectionBadge");

document.querySelector("#languageBtn").addEventListener("click", () => { syncState(); language = language === "fi" ? "en" : "fi"; state.language = language; render(); });
document.querySelector("#textSizeBtn").addEventListener("click", () => document.body.classList.toggle("large-text"));
document.querySelector("#contrastBtn").addEventListener("click", () => document.body.classList.toggle("high-contrast"));

function collectionStatus() {
  if (isDemo) return language === "fi" ? "Demo · ei tallennusta" : "Demo · no storage";
  if (!config.collection_enabled) return language === "fi" ? "Aineistonkeruu pois päältä" : "Collection disabled";
  return language === "fi" ? "Anonyymi aineistonkeruu käytössä" : "Anonymous collection enabled";
}

function ctx() { return { language, variant, state, config, workshopCode, isDemo, collectionStatus }; }

function syncState() {
  const val = id => document.getElementById(id)?.value;
  const checked = id => !!document.getElementById(id)?.checked;
  if (step === 0) { state.consent_confirmed = checked("consent"); state.prototype_disclaimer_confirmed = checked("disclaimer"); }
  document.querySelectorAll("input[type=radio]:checked").forEach(el => {
    const n = el.name, v = el.value;
    if (n === "participant_group") state.participant_group = v;
    else if (n === "explicit_confirmation") state.explicit_confirmation = v === "yes";
    else if (n.startsWith("sus_")) state.sus_values[Number(n.split("_")[1]) - 1] = Number(v);
    else if (n.startsWith("trust_")) state.trust_values[Number(n.split("_")[1]) - 1] = Number(v);
    else if (["wireless_acceptance","bidirectional_participation","alignment_clarity","plan_comprehension","accessibility_understanding"].includes(n)) state[n] = Number(v);
    else state[n] = v;
  });
  if (val("current_soc")) state.current_soc = Number(val("current_soc"));
  if (val("minimum_soc")) state.minimum_soc = Number(val("minimum_soc"));
  if (val("departure_time")) state.departure_time = val("departure_time");
  if (config.free_text_enabled && document.getElementById("optional_note")) state.optional_note = val("optional_note").slice(0,500); else state.optional_note = "";
  state.comprehension_items = [state.c1 === "yes", state.c2 === "no", state.c3 === "yes"];
}

function validStep() {
  if (step === 0 && (!state.consent_confirmed || !state.prototype_disclaimer_confirmed)) return language === "fi" ? "Valitse molemmat vahvistukset ennen jatkamista." : "Please acknowledge both items before continuing.";
  if (step === 1 && !state.participant_group) return language === "fi" ? "Valitse näkökulma." : "Choose a perspective.";
  if (step === 7 && (!state.c1 || !state.c2 || !state.c3)) return language === "fi" ? "Vastaa kaikkiin kolmeen kohtaan." : "Please answer all three items.";
  if (step === 8 && state.sus_values.filter(Boolean).length !== 10) return language === "fi" ? "Vastaa kaikkiin SUS-kohtiin." : "Please answer all SUS items.";
  return null;
}

function loadTurnstile() {
  if (!config.collection_enabled || !config.turnstile_site_key) return Promise.resolve(false);
  if (window.turnstile) return Promise.resolve(true);
  if (turnstileLoading) return turnstileLoading;
  turnstileLoading = new Promise((resolve,reject) => {
    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true; script.defer = true;
    script.onload = () => resolve(true);
    script.onerror = () => reject(new Error(language === "fi" ? "Ihmistarkistusta ei voitu ladata." : "Human verification could not be loaded."));
    document.head.appendChild(script);
  });
  return turnstileLoading;
}

async function renderTurnstile() {
  if (step !== 9 || !config.collection_enabled || !config.turnstile_site_key) return;
  try {
    await loadTurnstile();
    if (!window.turnstile || !document.getElementById("turnstile")) return;
    if (turnstileWidgetId !== null) { try { window.turnstile.remove(turnstileWidgetId); } catch {} turnstileWidgetId = null; }
    turnstileWidgetId = window.turnstile.render("#turnstile", { sitekey:config.turnstile_site_key, action:"pulse-workshop-submit", theme:document.body.classList.contains("high-contrast") ? "dark" : "auto" });
  } catch (e) { showError(e.message); }
}

async function submit() {
  syncState();
  if (isDemo || !config.collection_enabled) return finish(false);
  let token = null;
  if (config.turnstile_site_key) {
    if (!window.turnstile || turnstileWidgetId === null) throw new Error(language === "fi" ? "Suorita ihmistarkistus ennen lähettämistä." : "Complete human verification before submitting.");
    token = window.turnstile.getResponse(turnstileWidgetId);
    if (!token) throw new Error(language === "fi" ? "Suorita ihmistarkistus ennen lähettämistä." : "Complete human verification before submitting.");
  }
  const payload = { ...state, turnstile_token:token };
  const res = await fetch("/api/submit", { method:"POST", headers:{"content-type":"application/json"}, cache:"no-store", body:JSON.stringify(payload) });
  const data = await res.json().catch(() => ({ok:false,error:"Unknown error"}));
  if (!res.ok || !data.ok) throw new Error(data.error || "Submission failed");
  finish(true,data.submission_id);
}

function finish(submitted, submissionId="") { state.submitted = submitted; state.submission_id = submissionId; step = 10; render(); }

function showError(msg) {
  let el = screen.querySelector(".inline-error");
  if (!el) { el = document.createElement("p"); el.className = "inline-error error"; screen.append(el); }
  el.textContent = msg; el.scrollIntoView({behavior:"smooth",block:"center"});
}

function attach() {
  screen.querySelector('[data-action="back"]')?.addEventListener("click", () => { syncState(); step = Math.max(0,step - 1); render(); });
  screen.querySelector('[data-action="next"]')?.addEventListener("click", async () => {
    syncState(); const err = validStep(); if (err) return showError(err);
    if (step === 9) {
      try { await submit(); } catch (e) { showError(e.message); if (window.turnstile && turnstileWidgetId !== null) window.turnstile.reset(turnstileWidgetId); }
      return;
    }
    step = Math.min(10,step + 1); render();
  });
  renderTurnstile();
}

function render() {
  document.documentElement.lang = language;
  variantBadge.textContent = variants[variant].badge;
  collectionBadge.textContent = collectionStatus();
  collectionBadge.classList.toggle("live",config.collection_enabled && !isDemo);
  if (step <= 4) screen.innerHTML = renderCoreScreen(step,ctx());
  else if (step <= 9) screen.innerHTML = renderEvalScreen(step,ctx());
  else screen.innerHTML = `${progress(10)}<h1>${state.submitted ? esc(t(language,"done")) : esc(t(language,"demoDone"))}</h1><p>${language === "fi" ? "Tulokset käsitellään työpajan SRF-jäljitettävyysketjussa erillään teknisistä suorituskykymittareista." : "Results are handled through the workshop SRF traceability chain, separately from technical performance metrics."}</p><p class="status">${state.submission_id ? `Submission ID: ${esc(state.submission_id)}` : ""}</p>`;
  attach(); screen.focus({preventScroll:true});
}

fetch("/api/config",{cache:"no-store"}).then(r => r.json()).then(c => { config = {...config,...c}; state.app_version = config.app_version || APP_VERSION; render(); }).catch(() => render());
render();
