// Workshop-only illustrations. They show a choice without claiming live tariff,
// grid, vehicle or home energy data.
import { UK_MANUAL_MOVES } from "./v13-uk-parking.js";
const ukHomeAssumptions = Object.freeze({ batteryKwh: 60, homeDeliveryRatio: 0.9, importPence: 30, replacementPence: 15 });
export const ukMorningMinimums = Object.freeze([65, 70, 75, 80]);
const ukTimes = Object.freeze(["18:00", "19:30", "21:00", "22:30", "00:00", "03:00", "06:30", "07:00"]);
const minimum = value => ukMorningMinimums.includes(Number(value)) ? Number(value) : 70;
const exportPoints = (value, floor) => Math.max(0, Math.min(80 - floor, Number.isFinite(Number(value)) ? Number(value) : 0));

function ukManualPad(recommended) {
  const moves = [["forward", "↑", "Forward"], ["left", "←", "Left"], ["right", "→", "Right"], ["back", "↓", "Back"]];
  return `<div class="home-dpad" role="group" aria-label="Manual positioning controls">${moves.map(([move, arrow, label]) => `<button type="button" data-uk-move="${move}" class="${recommended.move === move ? "recommended" : ""}" aria-label="Move ${label.toLowerCase()}, simulated">${arrow}<small>${label}</small></button>`).join("")}<span class="home-dpad-center" aria-hidden="true">🚐</span></div>`;
}

export function ukHomeParkingCard({ stage, obstacleSeen, obstacleCleared, manualUsed, guidanceFault, manualStep = 0, wrongMoves = 0, lastMoveWasWrong = false }) {
  const moving = stage === "moving" || stage === "resuming";
  const obstructed = obstacleSeen && !obstacleCleared && ["blocked", "stopped", "support"].includes(stage);
  const cleared = obstacleCleared;
  const manual = stage === "manual_guidance";
  const recommended = UK_MANUAL_MOVES[manualStep];
  const status = {
    approach: "Vehicle waiting. Check people, objects, the entrance route and both sides of the bay before moving.",
    checked: "Surroundings checked for this illustration. Keep watching the route and use Stop manoeuvre if needed.",
    moving: "Guided manoeuvre in progress. The driver stays responsible for observing the surroundings and can stop it.",
    blocked: "Obstacle in the illustrated path. Parking stopped automatically; charging and V2H have not started.",
    reviewed: "Obstacle reviewed and shown clear of the path. Confirm the bay and access route are clear before resuming.",
    resuming: "Guided manoeuvre resuming after your safety confirmation. Stop remains available.",
    fault: "Guided parking is unavailable in this simulated fault. The vehicle has not moved. Recheck the route before choosing a driver-controlled manoeuvre or seeking support.",
    manual_guidance: `Manual guidance ${manualStep + 1} of 3: move ${recommended?.label || "carefully"}. Keep checking the bay and entrance route; stop if anything changes.`,
    manual_aligned: "Three illustrated corrections are complete. Confirm the bay and entrance route remain clear before marking the vehicle parked.",
    stopped: "You stopped the manoeuvre. No charging or V2H is active. Recheck the surroundings before moving again.",
    support: "Parking remains stopped. Support options are shown in this simulation; no real message has been sent. Recheck the route with help or cancel.",
    parked: `Vehicle parked beside the house ${manualUsed ? "using driver-controlled steps" : "after the guided obstacle check"}. The entrance route is clear in this example; the V2H session can begin.`
  }[stage];
  const controls = stage === "approach" ? `<button type="button" class="primary" data-uk-parking="inspect">Check surroundings</button>`
    : stage === "checked" ? `<button type="button" class="primary" data-uk-parking="start">${guidanceFault ? "Retry guided parking" : "Start guided parking"}</button>${guidanceFault ? `<button type="button" class="secondary" data-uk-parking="manual">Use manual guidance</button>` : `<button type="button" class="secondary" data-uk-parking="guidance_fault">Simulate guidance unavailable</button>`}`
    : moving ? `<button type="button" class="secondary" data-uk-parking="stop">Stop manoeuvre</button>`
    : stage === "blocked" ? `<button type="button" class="primary" data-uk-parking="review">Review obstacle and access route</button><button type="button" class="secondary" data-uk-parking="support">Show support options</button>`
    : stage === "stopped" ? `<button type="button" class="primary" data-uk-parking="review">Recheck surroundings</button><button type="button" class="secondary" data-uk-parking="support">Show support options</button>`
    : stage === "support" ? `<button type="button" class="primary" data-uk-parking="review">Recheck with support</button>`
    : stage === "fault" ? `<button type="button" class="primary" data-uk-parking="review">Recheck bay and access route</button><button type="button" class="secondary" data-uk-parking="support">Show support options</button>`
    : stage === "reviewed" ? `<button type="button" class="primary" data-uk-parking="resume">Confirm route clear and resume</button><button type="button" class="secondary" data-uk-parking="manual">Use manual guidance</button>`
    : stage === "manual_guidance" ? `<button type="button" class="secondary" data-uk-parking="stop">Stop manoeuvre</button>`
    : stage === "manual_aligned" ? `<button type="button" class="primary" data-uk-parking="manual_confirm">Confirm bay and access route clear</button><button type="button" class="secondary" data-uk-parking="stop">Stop manoeuvre</button>`
    : "";
  return `<div class="site-demo-card home-scene" aria-label="Illustrative home parking and obstacle recovery">
    <div class="scenario-badge">Oxfordshire · home V2H journey · simulated manoeuvre</div>
    <h2>Position beside the house</h2>
    <div class="home-layout" role="img" aria-label="${obstructed ? "Vehicle stopped short of the home bay because an obstacle is in its path" : stage === "parked" ? "Vehicle parked beside the house; the entrance route is clear" : stage === "manual_aligned" ? "Driver-controlled illustrated step has positioned the vehicle in the bay" : moving ? "Vehicle moving slowly toward the home bay while the driver watches its surroundings" : "Vehicle waiting near the house and marked parking bay"}">
      <div class="home-house" aria-hidden="true">🏠<small>House</small></div>
      <div class="home-parking" aria-hidden="true"><span class="home-vehicle ${stage}" data-uk-manual-step="${manualStep}">🚐</span><span class="home-pad">▭<small>Parking bay</small></span><span class="home-obstacle ${obstructed ? "visible" : cleared ? "cleared" : ""}">▣<small>${cleared ? "Object moved clear" : "Object in path"}</small></span>${manual ? `<span class="home-guidance-arrow uk-${recommended.move}">${recommended.arrow}</span>` : stage === "manual_aligned" ? `<span class="home-ready-mark">✓</span>` : ""}</div>
      <div class="home-access-path" aria-hidden="true">🚶 Entrance and walking/rolling route · keep clear</div>
    </div>
    <p class="demo-state" role="status">${status}</p>
    ${manual ? `<div class="home-manual-panel"><strong>Manual fallback positioning · step ${manualStep + 1} of 3</strong><p>Follow the highlighted arrow and short movement instruction. These buttons advance an illustration; they do not move a vehicle.</p>${ukManualPad(recommended)}<p class="home-move-feedback" role="status">${lastMoveWasWrong ? "That arrow did not advance the illustration. " : ""}Recommended correction: ${recommended.label}.${wrongMoves ? ` Wrong-direction attempts: ${wrongMoves}. Follow the highlighted arrow.` : ""}</p></div>` : stage === "manual_aligned" ? `<p class="home-move-feedback" role="status">Manual positioning complete in three illustrated corrections. Check the route once more before confirming.</p>` : ""}
    ${guidanceFault && stage !== "parked" ? `<p class="study-note">Illustrated fault: automatic guidance unavailable. No vehicle sensor or support service is connected.</p>` : ""}
    <div class="home-safety-list"><strong>Before and during the manoeuvre</strong><ul><li>Check people and objects around the vehicle.</li><li>Keep the entrance and walking/rolling route clear.</li><li>Watch the guidance; stop whenever needed.</li></ul></div>
    ${stage === "support" ? `<div class="demo-permission"><strong>Support to confirm with the site</strong><p>Who can clear an obstruction, and how could a user reach them through an accessible phone or assisted channel? The prototype has no provider contact and sends no request.</p></div>` : ""}
    <div class="study-actions">${controls}${stage !== "approach" && stage !== "parked" ? `<button type="button" class="secondary" data-uk-parking="cancel">Cancel manoeuvre</button>` : ""}</div>
    <p class="study-note">This is a staged workshop illustration. It does not claim that a real vehicle detects this obstacle, parks autonomously, or has a verified home energy connection. The driver would check the physical space and seek accessible help if the route could not be cleared.</p>
  </div>`;
}

export function ukOvernightFrame(choice, phase, sharingActive, exportedPoints, minimumSoc = 70) {
  const step = Math.max(0, Math.min(7, phase));
  const reserve = minimum(minimumSoc);
  const home = choice === "support_home";
  const charging = choice !== "protect_trip";
  const drawn = home && step >= 4 ? exportPoints(exportedPoints, reserve) : 0;
  const soc = !charging ? 50 : step === 0 ? 50 : step === 1 ? 60 : step === 2 ? 70 : step === 3 ? 80 : 80 - drawn;
  const time = ukTimes[step];
  const exportingNow = step === 4 ? drawn > 0 : step === 5 && drawn > Math.min(5, 80 - reserve);
  const direction = step >= 1 && step <= 3 && charging ? "charge" : home && sharingActive && exportingNow ? "home" : "idle";
  const status = step === 0 ? `Parked at home at 50%. Charging will raise the battery to 80% before optional home support; the chosen morning minimum is ${reserve}%.`
    : step <= 3 ? charging ? `Grid charging has stored energy in the vehicle. Battery ${soc}%; V2H has not started.` : "The vehicle remains at 50%; no charging or sharing is selected."
    : step < 7 ? direction === "home" ? `The car is supplying agreed household demand. Battery ${soc}%; the selected ${reserve}% morning minimum is protected.` : drawn > 0 ? `Home support was stopped or completed. The car remains at ${soc}%, at or above the selected ${reserve}% minimum.` : sharingActive && reserve === 80 ? "The 80% morning minimum leaves no energy available for V2H export." : `Home support is off. The car holds ${soc}%; the selected ${reserve}% minimum remains protected.`
    : soc < reserve ? `Morning departure: the vehicle is at ${soc}%, below the selected ${reserve}% minimum. Charging was not selected in this illustrative alternative.` : `Morning departure: the vehicle is ready at ${soc}%; the selected minimum is ${reserve}%. Home sharing is off.`;
  return { time, soc, direction, status };
}

// Workshop arithmetic, not a tariff quote or meter reading. Replacing the
// energy taken from the battery is the comparison cost for the V2H choice.
export function ukEnergyLedger(choice, phase, exportedPoints, minimumSoc = 70) {
  const step = Math.max(0, Math.min(7, phase));
  const chargedPoints = step === 0 ? 0 : step === 1 ? 10 : step === 2 ? 20 : 30;
  const chargedKwh = choice === "protect_trip" ? 0 : ukHomeAssumptions.batteryKwh * chargedPoints / 100;
  const drawnKwh = choice === "support_home" && step >= 4 ? ukHomeAssumptions.batteryKwh * exportPoints(exportedPoints, minimum(minimumSoc)) / 100 : 0;
  const homeKwh = Number((drawnKwh * ukHomeAssumptions.homeDeliveryRatio).toFixed(1));
  const avoidedPounds = Number((homeKwh * ukHomeAssumptions.importPence / 100).toFixed(2));
  const replacementPounds = Number((drawnKwh * ukHomeAssumptions.replacementPence / 100).toFixed(2));
  return { chargedKwh, drawnKwh, homeKwh, avoidedPounds, replacementPounds,
    differencePounds: Number((avoidedPounds - replacementPounds).toFixed(2)) };
}

export function ukEnergyCard(choice, phase, sharingActive, exportedPoints, running = false, minimumSoc = 70) {
  const reserve = minimum(minimumSoc);
  const frame = ukOvernightFrame(choice, phase, sharingActive, exportedPoints, reserve);
  const ledger = ukEnergyLedger(choice, phase, exportedPoints, reserve);
  const potential = ukEnergyLedger("support_home", 7, 80 - reserve, reserve);
  const active = frame.direction !== "idle";
  const flowLabel = frame.direction === "home" ? "Vehicle sends energy to home" : frame.direction === "charge" ? "Grid charges vehicle" : "No energy transfer is active";
  const left = frame.direction === "home" ? ["🚐", "Vehicle"] : ["⚡", "Grid"];
  const right = frame.direction === "home" ? ["🏠", "Home"] : ["🚐", "Vehicle"];
  return `<div class="site-demo-card overnight-card" aria-label="Illustrative overnight household V2H example">
    <div class="scenario-badge">Oxfordshire · home V2H session · simulated energy</div>
    <div class="night-heading"><h2>Parked beside the house · <span data-uk-time>${frame.time}</span></h2><span class="night-live" data-uk-state>${running ? "Running" : phase === 7 ? "Ready for next trip" : "Ready to start"}</span></div>
    <label class="night-minimum" for="uk-morning-minimum"><strong>Minimum battery for the morning trip</strong><select id="uk-morning-minimum" data-uk-minimum ${phase !== 0 || running ? "disabled" : ""}>${ukMorningMinimums.map(value => `<option value="${value}" ${value === reserve ? "selected" : ""}>${value}%</option>`).join("")}</select></label>
    <p class="study-note" data-uk-min-preview>At ${reserve}% minimum, up to ${potential.homeKwh.toFixed(1)} kWh could reach the house after charging to 80%; illustrative energy cost difference £${potential.differencePounds.toFixed(2)} under the assumptions below. ${reserve === 80 ? "No V2H export is available." : "Compare household support with the charge retained for travel."}</p>
    <div class="home-reserves"><div><span>Vehicle battery</span><strong data-uk-soc>${frame.soc}%</strong></div><div><span>Chosen morning minimum</span><strong data-uk-reserve>${reserve}%</strong></div></div>
    <div class="home-battery" data-uk-battery role="img" aria-label="Vehicle battery ${frame.soc} percent; chosen morning minimum ${reserve} percent"><span data-uk-fill style="width:${frame.soc}%"></span><span data-uk-marker style="left:${reserve}%"></span></div>
    <div class="night-timeline" aria-label="Illustrative overnight checkpoints">${ukTimes.map((time, index) => `<span data-uk-checkpoint="${index}" class="${index === phase ? "current" : ""}">${time}</span>`).join("")}</div>
    <div class="demo-flow ${active && running ? "" : "idle"}" data-uk-flow role="img" aria-label="${flowLabel}"><span data-uk-from>${left[0]}<small>${left[1]}</small></span><span class="flow-arrow" aria-hidden="true">→</span><span data-uk-to>${right[0]}<small>${right[1]}</small></span></div>
    <p class="night-direction" data-uk-direction>${flowLabel}</p>
    <p class="demo-state" data-uk-status>${frame.status}</p>
    <h3>How V2H helps this house in the example</h3><p class="study-note">The car can supply part of the household's overnight demand instead of importing that energy. If compatible backup equipment and an agreed essential-load rule existed, preserving selected home needs could be explored separately. This demo does not simulate an outage.</p>
    <h3>Energy and value in this example</h3>
    <div class="night-ledger" aria-label="Illustrative overnight energy ledger">
      <div><span>Stored in car while charging</span><strong data-uk-charged>${ledger.chargedKwh.toFixed(1)} kWh</strong></div>
      <div><span>Taken from car for V2H</span><strong data-uk-drawn>${ledger.drawnKwh.toFixed(1)} kWh</strong></div>
      <div><span>Delivered to house</span><strong data-uk-home>${ledger.homeKwh.toFixed(1)} kWh</strong></div>
      <div><span>Illustrative energy cost difference</span><strong data-uk-difference>£${ledger.differencePounds.toFixed(2)}</strong></div>
    </div>
    <p class="night-equation" data-uk-equation>House import avoided: £${ledger.avoidedPounds.toFixed(2)} − battery energy replacement: £${ledger.replacementPounds.toFixed(2)} = £${ledger.differencePounds.toFixed(2)}.</p>
    <p class="study-note">Illustrative assumptions: ${ukHomeAssumptions.batteryKwh} kWh usable car battery; each 10 battery percentage points stores ${(ukHomeAssumptions.batteryKwh * 0.1).toFixed(1)} kWh; ${ukHomeAssumptions.homeDeliveryRatio * 100}% of energy drawn for V2H reaches the house; household electricity ${ukHomeAssumptions.importPence}p/kWh and replacement battery energy ${ukHomeAssumptions.replacementPence}p/kWh. The comparison excludes recharge losses, battery wear and fees. It is not a measured saving or a live tariff. Household essential-load protection still needs a separately agreed rule.</p>
    <div class="study-actions"><button type="button" class="primary" data-uk-night>${phase === 7 ? sharingActive ? "Replay overnight example" : "Replay with home support" : running ? "Pause example" : phase === 0 ? "Run overnight example" : "Resume example"}</button>
      <button type="button" class="secondary" data-uk-night-step ${running || phase === 7 ? "hidden" : ""}>Next checkpoint</button>
      <button type="button" class="secondary" data-uk-night-skip ${phase === 7 ? "hidden" : ""}>Skip to morning</button>
      ${choice === "support_home" ? `<button type="button" class="secondary" data-uk-sharing ${!sharingActive || phase === 7 ? "hidden" : ""}>${phase < 4 ? "Cancel home support" : "Stop home support"}</button>` : ""}</div>
  </div>`;
}
