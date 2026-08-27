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
let cycleTimers = [];
let step = 0;
let state = {
  app_version:APP_VERSION, variant, workshop_code:workshopCode, language,
  participant_group:"", consent_confirmed:false, prototype_disclaimer_confirmed:false,
  current_soc:55, minimum_soc:65, departure_time:"17:00", dwell_minutes:90, winter_condition:"snow",
  alignment_stage:"approach", alignment_completed:false, alignment_method:"", alignment_clarity:null,
  constraint_owner:"", constraint_clarity:null, v2g_authorisation:"", preuse_v2g_acceptance:null,
  cycle_completed:false, cycle_overridden:false, energy_flow_clarity:null,
  fault_decision:"", fault_owner:"", c1:"", c2:"", c3:"", c4:"", comprehension_items:[],
  sus_values:[], trust_values:[], optional_note:"",
  trust_reliability:null, trust_predictability:null, control_confidence:null, failure_recovery_confidence:null,
  wireless_use_intention:null, v2g_acceptance_under_guarantees:null,
  accessibility_understanding:null, wireless_acceptance:null, bidirectional_participation:null,
  trust_1:null, trust_2:null, trust_3:null
};

const screen = document.querySelector("#screen");
const variantBadge = document.querySelector("#variantBadge");
const collectionBadge = document.querySelector("#collectionBadge");
const languageBtn = document.querySelector("#languageBtn");

languageBtn.addEventListener("click", () => { syncState(); language = language === "fi" ? "en" : "fi"; state.language = language; render(); });
document.querySelector("#textSizeBtn").addEventListener("click", () => document.body.classList.toggle("large-text"));
document.querySelector("#contrastBtn").addEventListener("click", () => document.body.classList.toggle("high-contrast"));

function collectionStatus() {
  if (isDemo) return language === "fi" ? "Demo · ei tallennusta" : "Demo · no storage";
  if (!config.collection_enabled) return language === "fi" ? "Aineistonkeruu pois päältä" : "Collection disabled";
  return language === "fi" ? "Anonyymi aineistonkeruu käytössä" : "Anonymous collection enabled";
}

function ctx() { return { language, variant, state, config, workshopCode, isDemo, collectionStatus }; }

function syncState() {
  const checked = id => !!document.getElementById(id)?.checked;
  if (step === 0) { state.consent_confirmed = checked("consent"); state.prototype_disclaimer_confirmed = checked("disclaimer"); }
  document.querySelectorAll("input[type=radio]:checked").forEach(el => {
    const n = el.name, v = el.value;
    if (n === "participant_group") state.participant_group = v;
    else if (n.startsWith("sus_")) state.sus_values[Number(n.split("_")[1]) - 1] = Number(v);
    else if (["alignment_clarity","constraint_clarity","preuse_v2g_acceptance","energy_flow_clarity","trust_reliability","trust_predictability","control_confidence","failure_recovery_confidence","wireless_use_intention","v2g_acceptance_under_guarantees","accessibility_understanding","wireless_acceptance","bidirectional_participation","trust_1","trust_2","trust_3"].includes(n)) state[n] = Number(v);
    else state[n] = v;
  });
  if (config.free_text_enabled && document.getElementById("optional_note")) state.optional_note = document.getElementById("optional_note").value.slice(0,500); else state.optional_note = "";
  state.comprehension_items = variant === "fi-fleet"
    ? [state.c1 === "yes", state.c2 === "no", state.c3 === "v2g", state.c4 === "redecision"]
    : [state.c1 === "yes", state.c2 === "no", state.c3 === "v2g"];
  if (variant === "fi-fleet") state.trust_values = [state.trust_reliability,state.trust_predictability,state.control_confidence,state.failure_recovery_confidence].filter(v => Number.isInteger(v));
  else state.trust_values = [state.trust_1,state.trust_2,state.trust_3].filter(v => Number.isInteger(v));
}

function validStep() {
  if (step === 0 && (!state.consent_confirmed || !state.prototype_disclaimer_confirmed)) return language === "fi" ? "Valitse molemmat vahvistukset ennen jatkamista." : "Please acknowledge both items before continuing.";
  if (step === 1 && !state.participant_group) return language === "fi" ? "Valitse näkökulma." : "Choose a perspective.";
  if (step === 2 && variant === "fi-fleet" && !state.alignment_completed) return language === "fi" ? "Kohdista auto ensin." : "Align the vehicle first.";
  if (step === 2 && !Number.isInteger(state.alignment_clarity)) return language === "fi" ? "Arvioi kohdistuksen selkeys ennen jatkamista." : "Rate the clarity of alignment before continuing.";
  if (step === 3 && variant === "fi-fleet" && (!state.constraint_owner || !Number.isInteger(state.constraint_clarity))) return language === "fi" ? "Valitse vastuutaho ja arvioi tiedon riittävyys." : "Choose an owner and rate whether the information is sufficient.";
  if (step === 4 && variant === "fi-fleet" && (!state.v2g_authorisation || !Number.isInteger(state.preuse_v2g_acceptance))) return language === "fi" ? "Valitse V2G:n hyväksyntätapa ja arvioi järjestelyn hyväksyttävyys." : "Choose a V2G authorisation method and rate the arrangement.";
  if (step === 4 && variant !== "fi-fleet" && !Number.isInteger(state.preuse_v2g_acceptance)) return language === "fi" ? "Arvioi V2G-luvan ja keskeytyksen selkeys." : "Rate the clarity of V2G permission and override.";
  if (step === 5 && (!state.cycle_completed || !Number.isInteger(state.energy_flow_clarity))) return language === "fi" ? "Suorita virtuaalinen jakso ja arvioi energian suunnan selkeys." : "Run the virtual cycle and rate the clarity of energy flow.";
  if (step === 6 && variant === "fi-fleet" && (!state.fault_decision || !state.fault_owner)) return language === "fi" ? "Valitse toimintatapa ja päätösvastuu." : "Choose an action and decision owner.";
  if (step === 6 && variant !== "fi-fleet" && !state.fault_decision) return language === "fi" ? "Valitse tärkein tieto." : "Choose the most important information.";
  if (step === 7 && variant === "fi-fleet" && (!state.c1 || !state.c2 || !state.c3 || !state.c4)) return language === "fi" ? "Vastaa kaikkiin neljään kohtaan." : "Please answer all four items.";
  if (step === 7 && variant !== "fi-fleet" && (!state.c1 || !state.c2 || !state.c3)) return language === "fi" ? "Vastaa kaikkiin kolmeen kohtaan." : "Please answer all three items.";
  if (step === 8 && state.sus_values.filter(v => Number.isInteger(v)).length !== 10) return language === "fi" ? "Vastaa kaikkiin SUS-kohtiin." : "Please answer all SUS items.";
  if (step === 9 && variant === "fi-fleet") {
    const keys=["trust_reliability","trust_predictability","control_confidence","failure_recovery_confidence","wireless_use_intention","v2g_acceptance_under_guarantees"];
    if (keys.some(k => !Number.isInteger(state[k]))) return language === "fi" ? "Vastaa kaikkiin luottamus- ja hyväksyttävyyskohtiin." : "Please answer all trust and acceptability items.";
  }
  if (step === 9 && variant !== "fi-fleet") {
    const keys=["trust_1","trust_2","trust_3","accessibility_understanding","wireless_acceptance","bidirectional_participation"];
    if (keys.some(k => !Number.isInteger(state[k]))) return language === "fi" ? "Vastaa kaikkiin luottamus- ja hyväksyttävyyskohtiin." : "Please answer all trust and acceptability items.";
  }
  return null;
}

function clearCycleTimers(){ cycleTimers.forEach(clearTimeout); cycleTimers=[]; }

function setCycleDOM({phase,soc,toVehicle,toGrid,net,width,direction,message}) {
  const phaseEl=document.getElementById("cyclePhase"), socEl=document.getElementById("cycleSoc"), fill=document.getElementById("cycleMeterFill"), arrow=document.getElementById("cycleArrow"), msg=document.getElementById("cycleMessage");
  if(phaseEl) phaseEl.textContent=phase;
  if(socEl) socEl.textContent=`${soc}%`;
  if(fill) fill.style.width=`${width}%`;
  if(document.getElementById("energyVehicle")) document.getElementById("energyVehicle").textContent=`${toVehicle} kWh`;
  if(document.getElementById("energyGrid")) document.getElementById("energyGrid").textContent=`${toGrid} kWh`;
  if(document.getElementById("energyNet")) document.getElementById("energyNet").textContent=`${net} kWh`;
  if(arrow) arrow.textContent=direction === "export" ? "←" : "→";
  if(msg) msg.textContent=message;
  document.getElementById("cycleFlow")?.classList.toggle("exporting",direction === "export");
}

function runCycle() {
  if(state.cycle_completed) return;
  clearCycleTimers();
  const fi=language === "fi";
  setCycleDOM({phase:fi?"Lataus":"Charging",soc:55,toVehicle:"0.0",toGrid:"0.0",net:"0.0",width:8,direction:"charge",message:fi?"Energia kulkee verkosta ajoneuvoon.":"Energy is flowing from the grid to the vehicle."});
  cycleTimers.push(setTimeout(()=>setCycleDOM({phase:fi?"Lataus":"Charging",soc:71,toVehicle:"12.4",toGrid:"0.0",net:"+12.4",width:38,direction:"charge",message:fi?"Akun varausta nostetaan ennen V2G-ikkunaa.":"The battery is charged before the V2G window."}),1500));
  cycleTimers.push(setTimeout(()=>setCycleDOM({phase:"V2G",soc:66,toVehicle:"12.4",toGrid:"4.8",net:"+7.6",width:68,direction:"export",message:fi?"V2G aktiivinen: energiaa siirtyy ajoneuvosta verkkoon. Ohitus on käytettävissä.":"V2G active: energy is moving from the vehicle to the grid. Override remains available."}),3300));
  cycleTimers.push(setTimeout(()=>{
    setCycleDOM({phase:fi?"Lähtövalmius":"Ready to leave",soc:70,toVehicle:"16.4",toGrid:"4.8",net:"+11.6",width:100,direction:"charge",message:fi?"Jakso valmis: lähtövaraus on suojattu ja auto on valmis seuraavaan toimitukseen.":"Cycle complete: departure reserve is protected and the vehicle is ready for the next delivery."});
    state.cycle_completed=true; state.cycle_energy_to_vehicle=16.4; state.cycle_energy_to_grid=4.8; state.cycle_net_energy=11.6;
    const btn=document.querySelector('[data-action="run-cycle"]'); if(btn){btn.disabled=true;btn.textContent=fi?"Jakso suoritettu":"Cycle completed";}
    if(!document.querySelector('input[name="energy_flow_clarity"]')) render();
  },5200));
}

function overrideCycle() {
  clearCycleTimers();
  state.cycle_overridden=true; state.cycle_completed=true;
  const fi=language === "fi";
  setCycleDOM({phase:fi?"Keskeytetty — valmis lähtöön":"Stopped — ready to leave",soc:Math.max(state.minimum_soc,66),toVehicle:"12.4",toGrid:"0.0",net:"+12.4",width:100,direction:"charge",message:fi?"Kuljettajan ohitus keskeytti V2G:n. Auto voidaan ottaa ajoon.":"Driver override stopped V2G. The vehicle can return to service."});
  setTimeout(()=>render(),250);
}

function applyAlignment(method) {
  state.alignment_method=method;
  if(method === "guided" && state.alignment_stage === "approach") { state.alignment_stage="guided"; render(); return; }
  state.alignment_stage="aligned"; state.alignment_completed=true; render();
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
  screen.querySelector('[data-action="back"]')?.addEventListener("click", () => { syncState(); clearCycleTimers(); step = Math.max(0,step - 1); render(); });
  screen.querySelector('[data-action="next"]')?.addEventListener("click", async () => {
    syncState(); const err = validStep(); if (err) return showError(err);
    if (step === 9) {
      try { await submit(); } catch (e) { showError(e.message); if (window.turnstile && turnstileWidgetId !== null) window.turnstile.reset(turnstileWidgetId); }
      return;
    }
    clearCycleTimers(); step = Math.min(10,step + 1); render();
  });
  screen.querySelector('[data-align="guided"]')?.addEventListener("click", () => applyAlignment("guided"));
  screen.querySelector('[data-align="auto"]')?.addEventListener("click", () => applyAlignment("auto"));
  screen.querySelector('[data-action="run-cycle"]')?.addEventListener("click", runCycle);
  screen.querySelector('[data-action="override-cycle"]')?.addEventListener("click", overrideCycle);
  renderTurnstile();
}

function render() {
  clearCycleTimers();
  document.documentElement.lang = language;
  languageBtn.textContent = language === "fi" ? "FI / EN" : "EN / FI";
  variantBadge.textContent = variants[variant].badge;
  collectionBadge.textContent = collectionStatus();
  collectionBadge.classList.toggle("live",config.collection_enabled && !isDemo);
  screen.classList.toggle("sus-step",step === 8);
  if (step <= 4) screen.innerHTML = renderCoreScreen(step,ctx());
  else if (step <= 9) screen.innerHTML = renderEvalScreen(step,ctx());
  else screen.innerHTML = `${progress(10)}<div class="finish-icon">✓</div><h1>${state.submitted ? esc(t(language,"done")) : esc(t(language,"demoDone"))}</h1><p>${language === "fi" ? "Tämän mobiilitehtävän havainnot voidaan yhdistää työpajan SRF-jäljitettävyysketjuun. Teknisiä suorituskykymittareita käsitellään erillään." : "Observations from this mobile task can be linked to the workshop SRF traceability chain. Technical performance metrics are handled separately."}</p><p class="status">${state.submission_id ? `Submission ID: ${esc(state.submission_id)}` : ""}</p>`;
  attach(); screen.focus({preventScroll:true});
}

fetch("/api/config",{cache:"no-store"}).then(r => r.json()).then(c => { config = {...config,...c}; state.app_version = config.app_version || APP_VERSION; render(); }).catch(() => render());
render();
