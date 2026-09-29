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
    time: ["08:45", window.start, "Charging", "Charging", window.ready][step],
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

export function grPlanCard(choice, reserve = 65, departure = "17:30") {
  return `<div class="site-demo-card gr-plan" aria-label="Trikala illustrative charging plan">
    <div class="scenario-badge">One daily parking stop · 08:45 arrival · workshop example only</div>
    <h2>Protect the next trip, then choose a charging window</h2>
    <div class="home-reserves"><div><span>Battery on arrival</span><strong>45%</strong></div><div><span>Target charge</span><strong>80%</strong></div></div>
    <div class="gr-settings"><label>Minimum for the next trip <select data-gr-reserve>${GR_RESERVES.map(value => `<option value="${value}" ${value === reserve ? "selected" : ""}>${value}%</option>`).join("")}</select></label><label>Leave by <select data-gr-departure>${GR_DEPARTURES.map(value => `<option value="${value}" ${value === departure ? "selected" : ""}>${value}${value === "14:15" ? " · charging only" : " · possible V2G"}</option>`).join("")}</select></label></div>
    <p class="study-note">Illustrative 22 kW AC-side bidirectional wireless equipment class; vehicle-side charging is capped at an assumed effective 10.5 kW in this example. With a 60 kWh usable battery, 45% to 80% stores 21 kWh in about two hours. The car is parked for hours, not continuously charging. Neither equipment rating nor efficiency is confirmed for Trikala. Prices are fictional; a 15-minute departure margin is required.</p>
    <div class="charging-windows">${windows.map(item => { const window = grWindow(item.id, departure); return `<label class="charging-window ${choice === item.id ? "selected" : ""} ${!window.feasible ? "unavailable" : ""}"><input type="radio" name="scenario_choice" value="${item.id}" ${choice === item.id ? "checked" : ""} ${!window.feasible ? "disabled" : ""}><strong>${item.label}</strong><span>${item.start}–${item.ready} · ready before ${departure}? ${window.feasible ? "Yes" : "No"}</span><span>Example charging cost €${window.cost.toFixed(2)} at €${item.rate.toFixed(2)}/kWh</span><span>${item.signal}</span>${!window.feasible ? `<span>Unavailable: cannot meet the departure margin. Choose an earlier window.</span>` : ""}</label>`; }).join("")}</div>
    <p class="study-note">Price and renewable availability are separate signals. Choosing a window does not permit V2G export. At 17:30 departure, a separate 15:00–16:00 V2G period can follow charging if the reserve is below 80%; at 14:15 departure the car leaves before V2G begins.</p>
  </div>`;
}

export function grEnergyCard({ choice = "charge_now", reserve = 65, departure = "17:30", phase = 0, running = false, permission = "off", offerChoice = null, exportStep = 0, exportedKwh = 0, delayMinutes = 0 } = {}) {
  const window = grWindow(choice, departure, delayMinutes);
  const frame = grFrame(choice, phase, reserve, exportedKwh, delayMinutes);
  const maxExport = Number(Math.max(0, Math.min(3, (80 - reserve) * GR_BATTERY_KWH / 100)).toFixed(1));
  const exportWindow = minutes(departure) >= minutes("16:15");
  const terms = GR_OFFER_TERMS[offerChoice];
  const exportActive = permission === "active";
  const exportStarted = permission !== "off";
  const checkpoint = grExportCheckpoint(exportStep, reserve);
  const displayTime = exportStarted ? checkpoint.time : frame.time;
  const gross = Number((frame.exportedKwh * (terms?.rate || 0)).toFixed(2));
  const replacement = Number((frame.exportedKwh * window.rate).toFixed(2));
  return `<div class="site-demo-card gr-session" aria-label="Trikala illustrative charge and V2G session">
    <div class="scenario-badge">Trikala · daily parking · illustrative 22 kW AC-side equipment class${delayMinutes ? ` · ${delayMinutes}-minute start delay` : ""}</div>
    <div class="night-heading"><h2>${window.label} · <span>${displayTime}</span></h2><span class="night-live">${exportActive ? "V2G active" : permission === "paused" ? "V2G paused" : running ? "Charging" : frame.label}</span></div>
    <div class="home-reserves"><div><span>Car battery</span><strong>${frame.soc}%</strong></div><div><span>Protected next-trip minimum</span><strong>${reserve}%</strong></div></div>
    <div class="home-battery" role="img" aria-label="Battery ${frame.soc} percent; next-trip minimum ${reserve} percent"><span style="width:${frame.soc}%"></span><span class="gr-reserve-mark" style="left:${reserve}%"></span></div>
    <div class="gr-timeline" aria-label="Session checkpoints">${["Parked", "Wait", "Charge", "Reserve", "Charged", "V2G"].map((label, index) => `<span class="${index === (exportStarted ? 5 : phase) ? "current" : ""}">${label}</span>`).join("")}</div>
    <div class="demo-flow ${running && (phase === 2 || phase === 3) || exportActive ? "" : "idle"}" role="img" aria-label="${exportActive ? "V2G: car sends energy to grid" : running && frame.direction === "Grid → car" ? "Grid charges car" : "No energy transfer is active"}"><span>${exportStarted ? "🚗" : "⚡"}<small>${exportStarted ? "Car" : "Grid"}</small></span><span class="flow-arrow" aria-hidden="true">→</span><span>${exportStarted ? "⚡" : "🚗"}<small>${exportStarted ? "Grid" : "Car"}</small></span></div>
    <p class="gr-direction">${exportActive ? "V2G now: car → grid" : exportStarted ? "V2G paused or finished: no energy moving" : running && frame.direction === "Grid → car" ? "Charging now: grid → car" : "No energy moving"}</p>
    <p class="demo-state" role="status">${exportActive ? `V2G export at the illustrative 3 kW rate, ${checkpoint.time} in the accelerated one-hour example. Battery ${frame.soc}% stays above ${reserve}%.` : permission === "paused" ? `V2G paused at ${checkpoint.time}; no energy is moving. Battery remains ${frame.soc}%.` : permission === "stopped" ? `V2G stopped at ${checkpoint.time} at your request. Battery remains ${frame.soc}%.` : permission === "complete" ? `The illustrated V2G period ended at 16:00 after ${frame.exportedKwh.toFixed(2)} kWh. Battery remains ${frame.soc}%.` : phase === 4 ? `Charging finished at ${window.ready}, before ${departure}. The car remains parked; V2G is off by default.` : `${frame.label}. ${frame.storedKwh.toFixed(1)} kWh charged into the car during this stop; export is off.`}</p>
    <div class="night-ledger"><div><span>Charged into car this stop</span><strong>${frame.storedKwh.toFixed(1)} kWh</strong></div><div><span>Example charging cost</span><strong>€${(frame.storedKwh * window.rate).toFixed(2)}</strong></div><div><span>Exported to grid</span><strong>${frame.exportedKwh.toFixed(1)} kWh</strong></div><div><span>Example gross export payment</span><strong>€${gross.toFixed(2)}</strong></div></div>
    <div class="study-actions"><button type="button" class="primary" data-gr-session="run" ${phase === 4 ? "hidden" : ""}>${running ? "Pause charging example" : phase ? "Resume charging example" : "Run charging example"}</button><button type="button" class="secondary" data-gr-session="step" ${running || phase === 4 ? "hidden" : ""}>Next checkpoint</button><button type="button" class="secondary" data-gr-session="leave" ${phase === 4 ? "hidden" : ""}>Leave early / stop</button></div>
    <div class="demo-permission"><strong>V2G · car sends energy back to the grid</strong><p>${phase < 4 ? "Complete charging before viewing the V2G offers. Charging is available without export." : !exportWindow ? `Departure at ${departure} is before the 15:00–16:00 export window; V2G cannot occur in this stop. Choose 17:30 departure on the planning screen to try it.` : maxExport === 0 ? `The selected ${reserve}% minimum leaves no surplus for export. Choose a minimum below 80% on the planning screen to try V2G.` : `The car remains parked after charging. Both hypothetical offers keep the ${reserve}% minimum and ${departure} departure; at most ${maxExport.toFixed(1)} kWh could be exported at an illustrative 3 kW during 15:00–16:00. These offers are a practice choice, not a contract or a research response.`}</p>
      ${phase === 4 && exportWindow && maxExport > 0 ? `<fieldset class="study-question gr-offers"><legend>Which proposed V2G contract would you consider for this stop?</legend><div class="study-options">${Object.entries(GR_OFFER_TERMS).map(([id,item]) => `<label class="study-option"><input type="radio" name="offer_choice" value="${id}" ${offerChoice === id ? "checked" : ""} ${permission !== "off" ? "disabled" : ""}><span><strong>${item.label}</strong><br>Gross €${item.rate.toFixed(2)}/kWh · up to €${(maxExport * item.rate).toFixed(2)} for this one-hour example. ${item.control} Same reserve, energy cap and departure guarantee.</span></label>`).join("")}<label class="study-option"><input type="radio" name="offer_choice" value="none" ${offerChoice === "none" ? "checked" : ""} ${permission !== "off" ? "disabled" : ""}><span><strong>No V2G export</strong><br>Keep the charged energy for travel. No payment or export commitment.</span></label></div></fieldset><p class="study-note">The offers vary both payment and permission arrangement, so one practice choice cannot identify either effect or estimate WTA. The formal DCE must vary attributes across balanced tasks. The terms are fictional; battery wear, losses, fees and support liability still need definition. Choosing an offer does not authorise this session.</p><div class="study-actions">${permission === "off" && terms ? `<button type="button" class="primary" data-gr-session="allow">Allow this session's V2G and show energy flow</button>` : permission === "active" ? `<button type="button" class="secondary" data-gr-session="pause_export">Pause V2G</button><button type="button" class="secondary" data-gr-session="stop_export">Stop sharing now</button>` : permission === "paused" ? `<button type="button" class="primary" data-gr-session="resume_export">Resume V2G</button><button type="button" class="secondary" data-gr-session="step_export">Next 15-minute checkpoint</button><button type="button" class="secondary" data-gr-session="stop_export">Stop sharing now</button>` : permission === "stopped" || permission === "complete" ? `<span>Energy sharing ended; the selected reserve remains protected.</span>` : ""}</div>${exportStarted ? `<div class="gr-export-progress" role="group" aria-label="Illustrative V2G export progress"><strong>15:00–16:00 · ${checkpoint.time} · ${permission === "active" ? "exporting" : permission === "paused" ? "paused" : "ended"}</strong><div class="gr-export-track" role="img" aria-label="${Math.round(checkpoint.fraction * 100)} percent of the one-hour example complete"><span style="width:${checkpoint.fraction * 100}%"></span></div><p>Car → grid: <strong>${frame.exportedKwh.toFixed(2)} of ${maxExport.toFixed(2)} kWh</strong> · gross credit <strong>€${gross.toFixed(2)}</strong> · car now <strong>${frame.soc}%</strong> (minimum ${reserve}%).</p></div>` : ""}` : ""}
      ${frame.exportedKwh > 0 ? `<p>Exported ${frame.exportedKwh.toFixed(1)} kWh · gross €${gross.toFixed(2)} · illustrative replacement energy €${replacement.toFixed(2)}. These are different from the charging cost and exclude battery wear.</p>` : ""}
    </div>
    <p class="study-note">The 22 kW AC-side rating is a scenario ceiling, not vehicle-side or reverse power. Charging is modelled at 10.5 kW effective and export at 3 kW, both unverified site assumptions. The renewable indicator does not establish where delivered electricity came from. No billing, grid or charger connection is active.</p>
  </div>`;
}
