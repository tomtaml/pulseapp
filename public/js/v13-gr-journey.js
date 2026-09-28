// Fixed workshop example: no vehicle telemetry, tariff feed or renewable provenance.
const windows = Object.freeze([
  { id: "charge_now", label: "Charge now", start: "18:00", ready: "20:00", rate: 0.30, signal: "No renewable-availability signal" },
  { id: "wait_for_lower_tariff", label: "Lower price later", start: "19:00", ready: "21:00", rate: 0.20, signal: "No renewable-availability signal" },
  { id: "wait_for_res_surplus", label: "More renewable generation later", start: "19:45", ready: "21:45", rate: 0.26, signal: "Higher renewable availability indicated; not proof of the electricity source" }
]);
const minutes = time => Number(time.slice(0, 2)) * 60 + Number(time.slice(3));
const timeFrom = total => `${String(Math.floor(total / 60) % 24).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
export const GR_RESERVES = Object.freeze([55, 60, 65, 70, 75]);
export const GR_DEPARTURES = Object.freeze(["21:15", "22:30"]);
export const GR_BATTERY_KWH = 60;
export const GR_CHARGE_KWH = 18; // 45% to 75% of the illustrative 60 kWh battery.

export function grWindow(id, departure = "22:30", delayMinutes = 0) {
  const window = windows.find(item => item.id === id) || windows[0];
  return { ...window, start: timeFrom(minutes(window.start) + delayMinutes), ready: timeFrom(minutes(window.ready) + delayMinutes), feasible: minutes(window.ready) + delayMinutes + 15 <= minutes(departure), cost: Number((GR_CHARGE_KWH * window.rate).toFixed(2)) };
}

export function grFrame(choice, phase, reserve = 60, exportedKwh = 0, delayMinutes = 0) {
  const window = grWindow(choice, "22:30", delayMinutes);
  const step = Math.max(0, Math.min(4, phase));
  const chargedSoc = [45, 45, 55, 65, 75][step];
  const battery = Math.max(step === 4 ? reserve : 0, chargedSoc - exportedKwh / GR_BATTERY_KWH * 100);
  return {
    time: ["18:00", window.start, "Charging", "Charging", window.ready][step],
    soc: Number(battery.toFixed(1)),
    storedKwh: [0, 0, 6, 12, 18][step],
    direction: step === 2 || step === 3 ? "Grid → car" : "No transfer",
    label: step === 3 && chargedSoc < reserve ? "Charging · reserve not reached yet" : ["Parked", "Waiting for the selected window", "Charging · reserve in progress", "Charging · reserve protected", "Ready for the next trip"][step]
  };
}

export function grArrivalCard(state = "approach") {
  const aligned = state === "aligned";
  const fault = state === "fault";
  return `<div class="site-demo-card gr-arrival" aria-label="Illustrative Trikala wireless bay">
    <div class="scenario-badge">Trikala · one parked-car stop · workshop simulation</div>
    <h2>Position the car for wireless charging</h2>
    <div class="gr-bay" role="img" aria-label="${aligned ? "Passenger car aligned with the marked wireless pad" : fault ? "Charging start unavailable while car is parked at the wireless bay" : "Passenger car approaching a marked wireless charging pad"}"><span class="gr-car ${aligned ? "aligned" : ""}">🚗</span><span class="gr-pad">▭<small>Wireless pad</small></span><span class="gr-bay-marker">${aligned ? "✓ Aligned" : fault ? "! Start delayed" : "↓ Check position"}</span></div>
    <p class="demo-state" role="status">${aligned ? "Position checked. Wireless charging can be planned; no energy is moving yet." : fault ? "Start could not be confirmed in this example. Retry the check or ask for help; no charge or export is active." : "Look around the bay and position the car over the marked pad. This control advances a simulation; it does not park or charge a car."}</p>
    <div class="study-actions">${fault ? `<button type="button" class="primary" data-gr-arrival="retry">Retry the start check</button><button type="button" class="secondary" data-gr-arrival="help">Show help route</button>` : aligned ? `<button type="button" class="secondary" data-gr-arrival="fault">Simulate start unavailable</button>` : `<button type="button" class="primary" data-gr-arrival="align">Check surroundings and align</button>`}</div>
    <p class="study-note">Bay, positioning and fault are illustrative. No vehicle, charger, remote support or sensor is connected.</p>
  </div>`;
}

export function grPlanCard(choice, reserve = 60, departure = "22:30") {
  return `<div class="site-demo-card gr-plan" aria-label="Trikala illustrative charging plan">
    <div class="scenario-badge">One stop · 18:00 arrival · workshop example only</div>
    <h2>Protect the next trip, then choose a charging window</h2>
    <div class="home-reserves"><div><span>Battery on arrival</span><strong>45%</strong></div><div><span>Target charge</span><strong>75%</strong></div></div>
    <div class="gr-settings"><label>Minimum for the next trip <select data-gr-reserve>${GR_RESERVES.map(value => `<option value="${value}" ${value === reserve ? "selected" : ""}>${value}%</option>`).join("")}</select></label><label>Leave by <select data-gr-departure>${GR_DEPARTURES.map(value => `<option value="${value}" ${value === departure ? "selected" : ""}>${value}</option>`).join("")}</select></label></div>
    <p class="study-note">Assume a 60 kWh usable battery and an effective 9 kW charging rate. Raising 45% to 75% stores 18 kWh in about two hours. The listed prices are fictional workshop examples, not Trikala tariffs. A 15-minute departure margin is required.</p>
    <div class="charging-windows">${windows.map(item => { const window = grWindow(item.id, departure); return `<label class="charging-window ${choice === item.id ? "selected" : ""} ${!window.feasible ? "unavailable" : ""}"><input type="radio" name="scenario_choice" value="${item.id}" ${choice === item.id ? "checked" : ""} ${!window.feasible ? "disabled" : ""}><strong>${item.label}</strong><span>${item.start}–${item.ready} · ready before ${departure}? ${window.feasible ? "Yes" : "No"}</span><span>Example charging cost €${window.cost.toFixed(2)} at €${item.rate.toFixed(2)}/kWh</span><span>${item.signal}</span>${!window.feasible ? `<span>Unavailable: cannot meet the departure margin. Choose an earlier window.</span>` : ""}</label>`; }).join("")}</div>
    <p class="study-note">Price and renewable availability are separate signals. Choosing a window does not permit V2G export.</p>
  </div>`;
}

export function grEnergyCard({ choice = "charge_now", reserve = 60, departure = "22:30", phase = 0, running = false, permission = "off", exportedKwh = 0, delayMinutes = 0 } = {}) {
  const window = grWindow(choice, departure, delayMinutes);
  const frame = grFrame(choice, phase, reserve, exportedKwh, delayMinutes);
  const maxExport = Number(Math.max(0, Math.min(3, (75 - reserve) * GR_BATTERY_KWH / 100)).toFixed(1));
  const exportActive = permission === "active";
  const gross = Number((exportedKwh * 0.20).toFixed(2));
  const replacement = Number((exportedKwh * window.rate).toFixed(2));
  return `<div class="site-demo-card gr-session" aria-label="Trikala illustrative charge and V2G session">
    <div class="scenario-badge">Trikala · parked at one wireless bay · simulated values${delayMinutes ? ` · ${delayMinutes}-minute start delay` : ""}</div>
    <div class="night-heading"><h2>${window.label} · <span>${frame.time}</span></h2><span class="night-live">${running ? "Running" : frame.label}</span></div>
    <div class="home-reserves"><div><span>Car battery</span><strong>${frame.soc}%</strong></div><div><span>Protected next-trip minimum</span><strong>${reserve}%</strong></div></div>
    <div class="home-battery" role="img" aria-label="Battery ${frame.soc} percent; next-trip minimum ${reserve} percent"><span style="width:${frame.soc}%"></span><span class="gr-reserve-mark" style="left:${reserve}%"></span></div>
    <div class="gr-timeline" aria-label="Session checkpoints">${["Parked", "Wait", "Charge", "Reserve", "Ready"].map((label, index) => `<span class="${index === phase ? "current" : ""}">${label}</span>`).join("")}</div>
    <div class="demo-flow ${running && (phase === 2 || phase === 3) || exportActive ? "" : "idle"}" role="img" aria-label="${exportActive ? "Car sends energy to grid" : running && frame.direction === "Grid → car" ? "Grid charges car" : "No energy transfer is active"}"><span>${exportActive ? "🚗" : "⚡"}<small>${exportActive ? "Car" : "Grid"}</small></span><span class="flow-arrow" aria-hidden="true">→</span><span>${exportActive ? "⚡" : "🚗"}<small>${exportActive ? "Grid" : "Car"}</small></span></div>
    <p class="demo-state" role="status">${exportActive ? `V2G export is running with separate permission; battery ${frame.soc}% stays above ${reserve}%.` : permission === "stopped" ? `V2G stopped at your request. Battery remains ${frame.soc}%.` : phase === 4 ? `Charging finished at ${window.ready}, before ${departure}. V2G is ${permission === "declined" ? "declined" : "off by default"}.` : `${frame.label}. ${frame.storedKwh.toFixed(1)} kWh stored in the car during this stop; export is off.`}</p>
    <div class="night-ledger"><div><span>Charged into car this stop</span><strong>${frame.storedKwh.toFixed(1)} kWh</strong></div><div><span>Example charging cost</span><strong>€${(frame.storedKwh * window.rate).toFixed(2)}</strong></div><div><span>Exported to grid</span><strong>${exportedKwh.toFixed(1)} kWh</strong></div><div><span>Example gross export payment</span><strong>€${gross.toFixed(2)}</strong></div></div>
    <div class="study-actions"><button type="button" class="primary" data-gr-session="run" ${phase === 4 ? "hidden" : ""}>${running ? "Pause charging example" : phase ? "Resume charging example" : "Run charging example"}</button><button type="button" class="secondary" data-gr-session="step" ${running || phase === 4 ? "hidden" : ""}>Next checkpoint</button><button type="button" class="secondary" data-gr-session="leave" ${phase === 4 ? "hidden" : ""}>Leave early / stop</button></div>
    <div class="demo-permission"><strong>Separate, optional V2G offer</strong><p>${phase < 4 ? "Complete charging before considering an export offer. Charging is allowed without V2G." : maxExport === 0 ? `The selected ${reserve}% minimum leaves no surplus above the reserve for this example.` : `Up to ${maxExport.toFixed(1)} kWh above the ${reserve}% reserve. Example gross payment €${(maxExport * 0.20).toFixed(2)} at a fictional €0.20/kWh; replacing that car energy at the chosen example charge rate would cost €${(maxExport * window.rate).toFixed(2)}. Battery wear, losses and fees are unknown and excluded. This is not a net saving.`}</p>
      ${phase === 4 && maxExport > 0 ? `<div class="study-actions">${permission === "off" ? `<button type="button" class="primary" data-gr-session="allow">Allow export for this example</button><button type="button" class="secondary" data-gr-session="decline">Decline V2G</button>` : permission === "active" ? `<button type="button" class="secondary" data-gr-session="stop_export">Stop sharing</button>` : `<button type="button" class="secondary" data-gr-session="restart_offer">${permission === "declined" ? "Review optional offer" : "Review offer again"}</button>`}</div>` : ""}
      ${exportedKwh > 0 ? `<p>Exported ${exportedKwh.toFixed(1)} kWh · gross €${gross.toFixed(2)} · illustrative replacement energy €${replacement.toFixed(2)}. These are different from the charging cost and exclude battery wear.</p>` : ""}
    </div>
    <p class="study-note">Illustrative battery, times, prices and export payment only. The renewable indicator does not establish where delivered electricity came from. No billing, grid or charger connection is active.</p>
  </div>`;
}
