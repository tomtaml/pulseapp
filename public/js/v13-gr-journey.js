// Fixed workshop example: no vehicle telemetry, tariff feed or renewable provenance.
const windows = Object.freeze([
  { id: "charge_now", label: "Charge now", start: "09:00", ready: "11:00", rate: 0.30, signal: "No renewable-availability signal" },
  { id: "wait_for_lower_tariff", label: "Lower price later", start: "11:00", ready: "13:00", rate: 0.20, signal: "No renewable-availability signal" },
  { id: "wait_for_res_surplus", label: "More renewable generation later", start: "12:00", ready: "14:00", rate: 0.26, signal: "Higher renewable availability indicated; not proof of the electricity source" }
]);
const minutes = time => Number(time.slice(0, 2)) * 60 + Number(time.slice(3));
const timeFrom = total => `${String(Math.floor(total / 60) % 24).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
export const GR_RESERVES = Object.freeze([60, 65, 70, 75, 80]);
export const GR_DEPARTURES = Object.freeze(["14:15", "17:30"]);
export const GR_BATTERY_KWH = 60;
export const GR_CHARGE_KWH = 21; // 45% to 80% of the illustrative 60 kWh battery.
export const GR_POWER_CEILING_KW = 22; // Scenario class only; not verified site or vehicle power.
export const GR_EFFECTIVE_CHARGE_KW = 10.5;
export const GR_EXPORT_KW = 3;
export const GR_EXPORT_TIMES = Object.freeze(["15:00", "15:15", "15:30", "15:45", "16:00"]);
export const GR_OFFER_TERMS = Object.freeze({
  offer_a: Object.freeze({ label: "Offer A · confirm each session", rate: 0.18, control: "Ask each time before export; stop at any time without a fee." }),
  offer_b: Object.freeze({ label: "Offer B · standing opt-in", rate: 0.30, control: "Receive notice before export; pause or stop at any time without a fee." })
});
export function grCanExport(offerChoice, enabled, reserve, departure) {
  return Boolean(enabled && GR_OFFER_TERMS[offerChoice] && reserve < 80 && departure === "17:30");
}

export function grWindow(id, departure = "17:30", delayMinutes = 0) {
  const window = windows.find(item => item.id === id) || windows[0];
  return { ...window, start: timeFrom(minutes(window.start) + delayMinutes), ready: timeFrom(minutes(window.ready) + delayMinutes), feasible: minutes(window.ready) + delayMinutes + 15 <= minutes(departure), cost: Number((GR_CHARGE_KWH * window.rate).toFixed(2)) };
}

export function grFrame(choice, phase, reserve = 65, exportedKwh = 0, delayMinutes = 0) {
  const window = grWindow(choice, "17:30", delayMinutes);
  const step = Math.max(0, Math.min(4, phase));
  const chargedSoc = [45, 45, 55, 70, 80][step];
  const actualExport = step === 4 ? Math.max(0, Math.min(Number(exportedKwh) || 0, Math.max(0, (80 - reserve) * GR_BATTERY_KWH / 100), 3)) : 0;
  const battery = chargedSoc - actualExport / GR_BATTERY_KWH * 100;
  return {
    time: ["08:45", window.start, timeFrom(minutes(window.start) + 34), timeFrom(minutes(window.start) + 86), window.ready][step],
    soc: Number(battery.toFixed(1)),
    exportedKwh: actualExport,
    storedKwh: [0, 0, 6, 15, 21][step],
    direction: step === 2 || step === 3 ? "Grid → car" : "No transfer",
    label: step === 3 && chargedSoc < reserve ? "Charging · reserve not reached yet" : ["Parked", "Waiting for the selected window", "Charging · reserve in progress", "Charging · reserve protected", "Ready for the next trip"][step]
  };
}

export function grExportCheckpoint(step, reserve = 65) {
  const index = Math.max(0, Math.min(4, Number(step) || 0));
  const cap = Math.max(0, Math.min(GR_EXPORT_KW, (80 - reserve) * GR_BATTERY_KWH / 100));
  return { time: GR_EXPORT_TIMES[index], exportedKwh: Number((cap * index / 4).toFixed(2)), cap: Number(cap.toFixed(2)), fraction: index / 4 };
}

export function grPlanCard(choice, reserve = 65, departure = "17:30", offerChoice = null, v2gEnabled = false) {
  const exportPossible = departure === "17:30" && reserve < 80;
  const maxExport = Number(Math.max(0, Math.min(3, (80 - reserve) * GR_BATTERY_KWH / 100)).toFixed(1));
  const afterExport = Number((80 - maxExport / GR_BATTERY_KWH * 100).toFixed(1));
  const terms = GR_OFFER_TERMS[offerChoice];
  return `<div class="site-demo-card gr-plan" aria-label="Trikala illustrative charging plan">
    <div class="scenario-badge">One daily parking stop · 08:45 arrival · workshop example only</div>
    <h2>1. Charge the car for your next trip</h2>
    <div class="home-reserves"><div><span>Battery on arrival</span><strong>45%</strong></div><div><span>Charging target before any V2G</span><strong>80%</strong></div></div>
    <div class="gr-settings"><label>Minimum for the next trip <select data-gr-reserve>${GR_RESERVES.map(value => `<option value="${value}" ${value === reserve ? "selected" : ""}>${value}%</option>`).join("")}</select></label><label>Leave by <select data-gr-departure>${GR_DEPARTURES.map(value => `<option value="${value}" ${value === departure ? "selected" : ""}>${value}${value === "14:15" ? " · charging only" : " · possible V2G"}</option>`).join("")}</select></label></div>
    <p class="study-note">First select when to charge to 80%. The car can stay parked afterwards. The selected next-trip minimum is a floor for any later energy export, not the charging target.</p>
    <div class="charging-windows">${windows.map(item => { const window = grWindow(item.id, departure); return `<label class="charging-window ${choice === item.id ? "selected" : ""} ${!window.feasible ? "unavailable" : ""}"><input type="radio" name="scenario_choice" value="${item.id}" ${choice === item.id ? "checked" : ""} ${!window.feasible ? "disabled" : ""}><strong>${item.label}</strong><span>${item.start}–${item.ready} · ready before ${departure}? ${window.feasible ? "Yes" : "No"}</span><span>Example charging cost €${window.cost.toFixed(2)} at €${item.rate.toFixed(2)}/kWh</span><span>${item.signal}</span>${!window.feasible ? `<span>Unavailable: cannot meet the departure margin. Choose an earlier window.</span>` : ""}</label>`; }).join("")}</div>
    <p class="study-note">Price and renewable availability are separate signals. The 14:15 departure leaves before V2G begins.</p>
    <section class="gr-contract" aria-label="Optional V2G plan and limits"><h3>2. Decide whether to share energy with the grid</h3>
      <p>${exportPossible ? `After reaching 80%, up to ${maxExport.toFixed(1)} kWh may move from car → grid during 15:00–16:00. That would leave about ${afterExport}% in the car, not below your ${reserve}% protected minimum, before the ${departure} departure. You can pause or stop sharing.` : departure === "14:15" ? "The car leaves before the 15:00–16:00 export period. This session is charging only." : "An 80% protected minimum leaves no energy available for export. This session is charging only."}</p>
      ${exportPossible ? `<fieldset class="study-question gr-offers"><legend>Which illustrative plan would you use for this stop?</legend><div class="gr-offer-grid">${Object.entries(GR_OFFER_TERMS).map(([id,item]) => `<label class="gr-offer-option"><span class="gr-offer-heading"><input type="radio" name="offer_choice" value="${id}" ${offerChoice === id ? "checked" : ""}><strong>${item.label}</strong></span><span class="gr-offer-term"><b>Gross credit</b>€${item.rate.toFixed(2)}/kWh · up to €${(maxExport * item.rate).toFixed(2)}</span><span class="gr-offer-term"><b>Permission</b>${id === "offer_a" ? "Confirm before each session" : "Standing opt-in; notice before export"}</span><span class="gr-offer-term"><b>Trip and control</b>Same ${reserve}% floor and ${maxExport.toFixed(1)} kWh cap; stop without a fee</span></label>`).join("")}<label class="gr-offer-option"><span class="gr-offer-heading"><input type="radio" name="offer_choice" value="none" ${offerChoice === "none" ? "checked" : ""}><strong>Charging only · no V2G</strong></span><span class="gr-offer-term"><b>Gross credit</b>€0; no export</span><span class="gr-offer-term"><b>Permission</b>No grid sharing</span><span class="gr-offer-term"><b>Trip and control</b>Keep all charged energy for travel</span></label></div></fieldset>${terms ? `<label class="study-option gr-consent"><input type="checkbox" data-gr-consent ${v2gEnabled ? "checked" : ""}><span>Enable this fictional V2G plan for this stop within the ${reserve}% minimum, ${maxExport.toFixed(1)} kWh cap and ${departure} departure. I can stop sharing at any time.</span></label>` : ""}` : `<p class="study-note">No V2G permission is requested for these limits.</p>`}
      <p class="study-note">Practice choice only; no agreement is signed or data submitted. Credits are gross, before later replacement energy, losses, battery wear and fees.</p>
      <p class="gr-plan-confirmation" role="status">${v2gEnabled && terms && exportPossible ? `${terms.label} enabled for this stop within the stated limits.` : exportPossible && terms ? "Select the permission checkbox to enable this V2G plan, or choose Charging only." : "V2G is off. Charging remains available."}</p>
    </section>
    <details class="study-note"><summary>Illustrative equipment and timing assumptions</summary><p>This example assumes a 60 kWh usable battery, 45% on arrival, 10.5 kW effective charging and a 3 kW reverse flow under an unverified 22 kW AC-side equipment class. Twenty-one kWh reaches 80% in about two hours; the car remains parked beyond charging. Equipment, rates and prices are unverified workshop assumptions; allow 15 minutes before departure.</p></details>
  </div>`;
}

export function grEnergyCard({ choice = "charge_now", reserve = 65, departure = "17:30", phase = 0, running = false, permission = "off", offerChoice = null, v2gEnabled = false, facilitatorControls = false, exportStep = 0, exportedKwh = 0, delayMinutes = 0 } = {}) {
  const window = grWindow(choice, departure, delayMinutes);
  const frame = grFrame(choice, phase, reserve, exportedKwh, delayMinutes);
  const maxExport = Number(Math.max(0, Math.min(3, (80 - reserve) * GR_BATTERY_KWH / 100)).toFixed(1));
  const terms = GR_OFFER_TERMS[offerChoice];
  const exportPlanned = grCanExport(offerChoice, v2gEnabled, reserve, departure);
  const exportActive = permission === "active";
  const exportStarted = ["active", "paused", "stopped", "complete"].includes(permission);
  const checkpoint = grExportCheckpoint(exportStep, reserve);
  const displayTime = exportStarted ? checkpoint.time : frame.time;
  const gross = Number((frame.exportedKwh * (terms?.rate || 0)).toFixed(2));
  const replacement = Number((frame.exportedKwh * window.rate).toFixed(2));
  const exportControls = permission === "scheduled" ? `<button type="button" class="secondary" data-gr-session="cancel_export">Cancel planned V2G</button>`
    : permission === "active" ? `<button type="button" class="secondary" data-gr-session="pause_export">Pause V2G</button><button type="button" class="secondary" data-gr-session="stop_export">Stop sharing now</button>`
    : permission === "paused" ? `<button type="button" class="primary" data-gr-session="resume_export">Resume V2G</button>${facilitatorControls ? `<button type="button" class="secondary" data-gr-session="step_export">Next 15-minute checkpoint</button>` : ""}<button type="button" class="secondary" data-gr-session="stop_export">Stop sharing now</button>` : "";
  const exportProgress = exportStarted ? `<div class="gr-export-progress" role="group" aria-label="Illustrative V2G export progress"><strong>15:00–16:00 · ${checkpoint.time} · ${permission === "active" ? "exporting" : permission === "paused" ? "paused" : "ended"}</strong><div class="gr-export-track" role="img" aria-label="${Math.round(checkpoint.fraction * 100)} percent of the one-hour example complete"><span style="width:${checkpoint.fraction * 100}%"></span></div><p>Car → grid: <strong>${frame.exportedKwh.toFixed(2)} of ${maxExport.toFixed(2)} kWh</strong> · gross credit <strong>€${gross.toFixed(2)}</strong> · car now <strong>${frame.soc}%</strong> (minimum ${reserve}%).</p></div>` : "";
  const planStatus = permission === "canceled" ? "Planned V2G was canceled before export; charging remains complete and no energy was sent to the grid." : exportPlanned ? `${terms.label} accepted before this session. Export is capped at ${maxExport.toFixed(1)} kWh during 15:00–16:00, keeps ${reserve}% for the next trip, and can be stopped here.` : "Charging only. No V2G export has been enabled for this session.";
  const exportLedgerNote = frame.exportedKwh > 0 ? `<p>Exported ${frame.exportedKwh.toFixed(1)} kWh · gross €${gross.toFixed(2)} · illustrative replacement energy €${replacement.toFixed(2)}. These are separate from charging cost and exclude battery wear.</p>` : "";
  return `<div class="site-demo-card gr-session" aria-label="Trikala illustrative charge and V2G session">
    <div class="scenario-badge">Trikala · one simulated parked session${delayMinutes ? ` · ${delayMinutes}-minute start delay` : ""}</div>
    <div class="night-heading"><h2>Energy session · <span>${displayTime}</span></h2><span class="night-live">${exportActive ? "V2G active" : permission === "scheduled" ? "Parked · waiting for V2G" : permission === "paused" ? "V2G paused" : permission === "canceled" ? "V2G canceled" : running ? "Charging" : frame.label}</span></div>

    <div class="home-reserves"><div><span>Car battery</span><strong>${frame.soc}%</strong></div><div><span>Protected next-trip minimum</span><strong>${reserve}%</strong></div></div>
    <div class="home-battery" role="img" aria-label="Battery ${frame.soc} percent; next-trip minimum ${reserve} percent"><span style="width:${frame.soc}%"></span><span class="gr-reserve-mark" style="left:${reserve}%"></span></div>

    <div class="gr-timeline ${exportPlanned ? "with-export" : "charge-only"}" aria-label="One parked session, charging then optional export">${(exportPlanned ? ["Parked", "Start", "55%", "70%", "80%", "V2G"] : ["Parked", "Start", "55%", "70%", "80%"]).map((label, index) => `<span class="${index === (exportStarted ? 5 : phase) ? "current" : ""}">${label}</span>`).join("")}</div>
    <div class="demo-flow ${running && (phase === 2 || phase === 3) || exportActive ? "" : "idle"}" role="img" aria-label="${exportActive ? "V2G: car sends energy to grid" : running && frame.direction === "Grid → car" ? "Grid charges car" : "No energy transfer is active"}"><span>${exportStarted ? "🚗" : "⚡"}<small>${exportStarted ? "Car" : "Grid"}</small></span><span class="flow-arrow" aria-hidden="true">→</span><span>${exportStarted ? "⚡" : "🚗"}<small>${exportStarted ? "Grid" : "Car"}</small></span></div>
    <p class="gr-direction">${exportActive ? "V2G now: car → grid" : exportStarted ? "V2G paused or finished: no energy moving" : running && frame.direction === "Grid → car" ? "Charging now: grid → car" : "No energy moving"}</p>
    <div class="study-actions"><button type="button" class="primary" data-gr-session="run" ${phase === 4 ? "hidden" : ""}>${running ? "Pause session" : phase ? "Resume session" : "Start planned session"}</button>${facilitatorControls ? `<button type="button" class="secondary" data-gr-session="step" ${running || phase === 4 ? "hidden" : ""}>Next checkpoint</button>` : ""}<button type="button" class="secondary" data-gr-session="leave" ${phase === 4 ? "hidden" : ""}>Leave early / stop</button></div>
    <div class="study-actions export-actions">${exportControls}</div>
    ${exportProgress}
    <p class="demo-state" role="status">${exportActive ? `V2G export at the illustrative 3 kW rate, ${checkpoint.time} in the accelerated one-hour example. Battery ${frame.soc}% stays above ${reserve}%.` : permission === "scheduled" ? `Charging finished at ${window.ready}. The car remains parked at ${frame.soc}% until the 15:00 V2G window; no energy moves while waiting. Cancel is available.` : permission === "canceled" ? `V2G canceled before 15:00; no energy was exported. The car remains at ${frame.soc}%.` : permission === "paused" ? `V2G paused at ${checkpoint.time}; no energy is moving. Battery remains ${frame.soc}%.` : permission === "stopped" ? `V2G stopped at ${checkpoint.time} at your request. Battery remains ${frame.soc}%.` : permission === "complete" ? `The illustrated V2G period ended at 16:00 after ${frame.exportedKwh.toFixed(2)} kWh. Battery remains ${frame.soc}%.` : phase === 4 ? `Charging finished at ${window.ready}, before ${departure}. This is a charging-only stop.` : `${frame.label}. ${frame.storedKwh.toFixed(1)} kWh charged into the car during this stop; V2G ${exportPlanned ? "is planned after charging" : "is off"}.`}</p>

    <details data-detail="energy-ledger"><summary>Energy totals, costs and V2G limits</summary>
    <p class="study-note">Charging schedule: ${window.label.toLowerCase()} (${window.start}–${window.ready}). ${permission === "canceled" ? "V2G was canceled for this stop." : exportPlanned ? `V2G enabled under ${terms.label}; export may follow charging at 15:00 if the ${reserve}% minimum remains protected.` : "Charging only; V2G is off for this stop."}</p>
    <div class="night-ledger"><div><span>Charged into car this stop</span><strong>${frame.storedKwh.toFixed(1)} kWh</strong></div><div><span>Example charging cost</span><strong>€${(frame.storedKwh * window.rate).toFixed(2)}</strong></div><div><span>Exported to grid</span><strong>${frame.exportedKwh.toFixed(1)} kWh</strong></div><div><span>Example gross export payment</span><strong>€${gross.toFixed(2)}</strong></div></div>

    <div class="demo-permission"><strong>${permission === "canceled" ? "V2G canceled" : exportPlanned ? "V2G approved for this stop" : "Charging only"}</strong><p>${planStatus}</p>
      ${exportLedgerNote}
    </div>
    </details>
    <details class="study-note" data-detail="assumptions"><summary>About this simulation</summary><p>Charging uses an assumed 10.5 kW effective rate and export 3 kW; the illustrated 22 kW AC-side class is an unverified ceiling, not vehicle or reverse power. The renewable signal does not prove where delivered electricity came from. No billing, grid or charger connection is active.</p></details>
  </div>`;
}
