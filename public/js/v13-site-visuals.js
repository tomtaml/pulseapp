// Workshop-only illustrations. They show a choice without claiming live tariff,
// grid, vehicle or home energy data.
const chargingWindows = [
  ["charge_now", "Charge now", "Ready for the next trip"],
  ["wait_for_lower_tariff", "Lower tariff later", "Price signal"],
  ["wait_for_res_surplus", "Renewable surplus later", "RES signal"]
];
const ukHomeAssumptions = Object.freeze({ batteryKwh: 60, homeDeliveryRatio: 0.9, importPence: 30, replacementPence: 15 });

export function grTimingCard(choice) {
  return `<div class="site-demo-card" aria-label="Illustrative charging windows">
    <div class="scenario-badge">Workshop scenario · illustrative signals</div>
    <h2>Choose when to charge</h2>
    <div class="charging-windows">${chargingWindows.map(([key, label, signal]) => `<div class="charging-window ${choice === key ? "selected" : ""}"><strong>${label}</strong><span>${signal}</span></div>`).join("")}</div>
    <p class="study-note">The next-trip reserve stays protected. No actual tariff, renewable forecast or charging schedule is connected.</p>
  </div>`;
}

export function grEnergyCard(choice, v2gPermitted) {
  const selected = chargingWindows.find(([key]) => key === choice)?.[1] || "Charge now";
  return `<div class="site-demo-card" aria-label="Trikala energy flow">
    <div class="scenario-badge">Workshop scenario · simulated flow</div>
    <h2>${selected}</h2>
    <div class="demo-flow" role="img" aria-label="${v2gPermitted ? "Vehicle sends energy to grid with separate permission" : "Grid charges vehicle; V2G is not permitted"}">
      <span>${v2gPermitted ? "🚗" : "⚡"}<small>${v2gPermitted ? "Vehicle" : "Grid"}</small></span><span class="flow-arrow" aria-hidden="true">→</span><span>${v2gPermitted ? "⚡" : "🚗"}<small>${v2gPermitted ? "Grid" : "Vehicle"}</small></span>
    </div>
    <p class="study-note">The selected window changes charging time. The protected next-trip reserve takes priority.</p>
    <div class="demo-permission"><strong>Separate V2G permission</strong><p>${v2gPermitted ? "Permission granted for this illustration. The driver can stop sharing; export cannot cross the protected reserve." : "Off by default. Choosing a charging window does not authorise export to the grid."}</p>
      <button type="button" class="secondary" data-gr-v2g aria-pressed="${v2gPermitted}">${v2gPermitted ? "Stop V2G sharing" : "Allow illustrative V2G"}</button>
    </div>
  </div>`;
}

export function ukHomeParkingCard({ stage, obstacleSeen, obstacleCleared }) {
  const moving = stage === "moving" || stage === "resuming";
  const obstructed = obstacleSeen && !obstacleCleared && ["blocked", "stopped", "support"].includes(stage);
  const cleared = obstacleCleared;
  const status = {
    approach: "Vehicle waiting. Check people, objects, the entrance route and both sides of the bay before moving.",
    checked: "Surroundings checked for this illustration. Keep watching the route and use Stop manoeuvre if needed.",
    moving: "Guided manoeuvre in progress. The driver stays responsible for observing the surroundings and can stop it.",
    blocked: "Obstacle in the illustrated path. Parking stopped automatically; charging and V2H have not started.",
    reviewed: "Obstacle reviewed and shown clear of the path. Confirm the bay and access route are clear before resuming.",
    resuming: "Guided manoeuvre resuming after your safety confirmation. Stop remains available.",
    stopped: "You stopped the manoeuvre. No charging or V2H is active. Recheck the surroundings before moving again.",
    support: "Parking remains stopped. Support options are shown in this simulation; no real message has been sent. Recheck the route with help or cancel.",
    parked: "Vehicle parked beside the house after the obstacle check. The entrance route is clear in this example; the V2H session can begin."
  }[stage];
  const controls = stage === "approach" ? `<button type="button" class="primary" data-uk-parking="inspect">Check surroundings</button>`
    : stage === "checked" ? `<button type="button" class="primary" data-uk-parking="start">Start guided parking</button>`
    : moving ? `<button type="button" class="secondary" data-uk-parking="stop">Stop manoeuvre</button>`
    : stage === "blocked" ? `<button type="button" class="primary" data-uk-parking="review">Review obstacle and access route</button><button type="button" class="secondary" data-uk-parking="support">Show support options</button>`
    : stage === "stopped" ? `<button type="button" class="primary" data-uk-parking="review">Recheck surroundings</button><button type="button" class="secondary" data-uk-parking="support">Show support options</button>`
    : stage === "support" ? `<button type="button" class="primary" data-uk-parking="review">Recheck with support</button>`
    : stage === "reviewed" ? `<button type="button" class="primary" data-uk-parking="resume">Confirm route clear and resume</button>`
    : "";
  return `<div class="site-demo-card home-scene" aria-label="Illustrative home parking and obstacle recovery">
    <div class="scenario-badge">Oxfordshire · home V2H journey · simulated manoeuvre</div>
    <h2>Position beside the house</h2>
    <div class="home-layout" role="img" aria-label="${obstructed ? "Vehicle stopped short of the home bay because an obstacle is in its path" : stage === "parked" ? "Vehicle parked beside the house; the entrance route is clear" : moving ? "Vehicle moving slowly toward the home bay while the driver watches its surroundings" : "Vehicle waiting near the house and marked parking bay"}">
      <div class="home-house" aria-hidden="true">🏠<small>House</small></div>
      <div class="home-parking" aria-hidden="true"><span class="home-vehicle ${stage}">🚐</span><span class="home-pad">▭<small>Parking bay</small></span><span class="home-obstacle ${obstructed ? "visible" : cleared ? "cleared" : ""}">▣<small>${cleared ? "Object moved clear" : "Object in path"}</small></span></div>
      <div class="home-access-path" aria-hidden="true">🚶 Entrance and walking/rolling route · keep clear</div>
    </div>
    <p class="demo-state" role="status">${status}</p>
    <div class="home-safety-list"><strong>Before and during the manoeuvre</strong><ul><li>Check people and objects around the vehicle.</li><li>Keep the entrance and walking/rolling route clear.</li><li>Watch the guidance; stop whenever needed.</li></ul></div>
    ${stage === "support" ? `<div class="demo-permission"><strong>Support to confirm with the site</strong><p>Who can clear an obstruction, and how could a user reach them through an accessible phone or assisted channel? The prototype has no provider contact and sends no request.</p></div>` : ""}
    <div class="study-actions">${controls}${stage !== "approach" && stage !== "parked" ? `<button type="button" class="secondary" data-uk-parking="cancel">Cancel manoeuvre</button>` : ""}</div>
    <p class="study-note">This is a staged workshop illustration. It does not claim that a real vehicle detects this obstacle, parks autonomously, or has a verified home energy connection. The driver would check the physical space and seek accessible help if the route could not be cleared.</p>
  </div>`;
}

export function ukOvernightFrame(choice, phase, sharingActive, exported) {
  const step = Math.max(0, Math.min(5, phase));
  const home = choice === "support_home";
  const didExport = home && exported;
  const charging = choice !== "protect_trip";
  const chargedSoc = charging ? 80 : 70;
  const soc = step === 0 ? 70 : step === 1 ? charging ? 75 : 70 : didExport ? 75 : chargedSoc;
  const time = ["22:00", "23:00", "00:00", "01:00", "02:00", "07:00"][step];
  const direction = (step === 1 || step === 2) && charging ? "charge" : (step === 3 || step === 4) && home && sharingActive && didExport ? "home" : "idle";
  const status = step === 0 ? "Parked at home. Vehicle charge is 70%; the protected next-trip reserve is 65%. No energy sharing has started."
    : step === 1 ? charging ? "Grid charging has raised the vehicle to an illustrative 75%. Home sharing has not started." : "The vehicle keeps its existing 70% for the next trip; no charging or sharing is selected."
    : step === 2 ? charging ? "Overnight charging raises the vehicle to an illustrative 80%. Home sharing has not started." : "The vehicle remains at 70% for its next trip."
    : step < 5 ? direction === "home" ? "With separate permission, the vehicle supports the home and remains at 75%, above the protected 65% reserve." : didExport ? "Home support was stopped. The vehicle remains at 75%, above the protected reserve." : "Home support is off. The vehicle keeps its protected charge."
    : `Morning departure: the vehicle is ready at ${soc}%, above the protected 65% reserve. Home sharing is off.`;
  return { time, soc, direction, status };
}

// Workshop arithmetic, not a tariff quote or meter reading. Replacing the
// energy taken from the battery is the comparison cost for the V2H choice.
export function ukEnergyLedger(choice, phase, exported) {
  const step = Math.max(0, Math.min(5, phase));
  const chargedKwh = choice === "protect_trip" || step === 0 ? 0 : ukHomeAssumptions.batteryKwh * (step === 1 ? 5 : 10) / 100;
  const drawnKwh = choice === "support_home" && exported && step >= 3 ? ukHomeAssumptions.batteryKwh * 5 / 100 : 0;
  const homeKwh = Number((drawnKwh * ukHomeAssumptions.homeDeliveryRatio).toFixed(1));
  const avoidedPounds = Number((homeKwh * ukHomeAssumptions.importPence / 100).toFixed(2));
  const replacementPounds = Number((drawnKwh * ukHomeAssumptions.replacementPence / 100).toFixed(2));
  return { chargedKwh, drawnKwh, homeKwh, avoidedPounds, replacementPounds,
    differencePounds: Number((avoidedPounds - replacementPounds).toFixed(2)) };
}

export function ukEnergyCard(choice, phase, sharingActive, exported, running = false) {
  const frame = ukOvernightFrame(choice, phase, sharingActive, exported);
  const ledger = ukEnergyLedger(choice, phase, exported);
  const active = frame.direction !== "idle";
  const flowLabel = frame.direction === "home" ? "Vehicle sends energy to home" : frame.direction === "charge" ? "Grid charges vehicle" : "No energy transfer is active";
  const left = frame.direction === "home" ? ["🚐", "Vehicle"] : ["⚡", "Grid"];
  const right = frame.direction === "home" ? ["🏠", "Home"] : ["🚐", "Vehicle"];
  return `<div class="site-demo-card overnight-card" aria-label="Illustrative overnight household V2H example">
    <div class="scenario-badge">Oxfordshire · home V2H session · simulated energy</div>
    <div class="night-heading"><h2>Parked beside the house · <span data-uk-time>${frame.time}</span></h2><span class="night-live" data-uk-state>${running ? "Running" : phase === 5 ? "Ready for next trip" : "Ready to start"}</span></div>
    <div class="home-reserves"><div><span>Vehicle battery</span><strong data-uk-soc>${frame.soc}%</strong></div><div><span>Protected next-trip reserve</span><strong>65%</strong></div></div>
    <div class="home-battery" data-uk-battery role="img" aria-label="Vehicle battery ${frame.soc} percent; protected trip reserve 65 percent"><span data-uk-fill style="width:${frame.soc}%"></span></div>
    <div class="night-timeline" aria-label="Illustrative overnight checkpoints">${["22:00", "23:00", "00:00", "01:00", "02:00", "07:00"].map((time, index) => `<span data-uk-checkpoint="${index}" class="${index === phase ? "current" : ""}">${time}</span>`).join("")}</div>
    <div class="demo-flow ${active && running ? "" : "idle"}" data-uk-flow role="img" aria-label="${flowLabel}"><span data-uk-from>${left[0]}<small>${left[1]}</small></span><span class="flow-arrow" aria-hidden="true">→</span><span data-uk-to>${right[0]}<small>${right[1]}</small></span></div>
    <p class="night-direction" data-uk-direction>${flowLabel}</p>
    <p class="demo-state" data-uk-status>${frame.status}</p>
    <h3>Energy and value in this example</h3>
    <div class="night-ledger" aria-label="Illustrative overnight energy ledger">
      <div><span>Stored in car while charging</span><strong data-uk-charged>${ledger.chargedKwh.toFixed(1)} kWh</strong></div>
      <div><span>Taken from car for V2H</span><strong data-uk-drawn>${ledger.drawnKwh.toFixed(1)} kWh</strong></div>
      <div><span>Delivered to house</span><strong data-uk-home>${ledger.homeKwh.toFixed(1)} kWh</strong></div>
      <div><span>Illustrative energy cost difference</span><strong data-uk-difference>£${ledger.differencePounds.toFixed(2)}</strong></div>
    </div>
    <p class="night-equation" data-uk-equation>House import avoided: £${ledger.avoidedPounds.toFixed(2)} − battery energy replacement: £${ledger.replacementPounds.toFixed(2)} = £${ledger.differencePounds.toFixed(2)}.</p>
    <p class="study-note">Illustrative assumptions: ${ukHomeAssumptions.batteryKwh} kWh usable car battery; 5 percentage points = ${(ukHomeAssumptions.batteryKwh * 0.05).toFixed(1)} kWh taken from the car; ${ukHomeAssumptions.homeDeliveryRatio * 100}% reaches the house; household electricity ${ukHomeAssumptions.importPence}p/kWh and replacement battery energy ${ukHomeAssumptions.replacementPence}p/kWh. The comparison excludes recharge losses, battery wear and fees. It is not a measured saving or a live tariff. Household essential-load protection still needs a separately agreed rule.</p>
    <div class="study-actions"><button type="button" class="primary" data-uk-night>${phase === 5 ? "Replay overnight example" : running ? "Pause example" : phase === 0 ? "Run overnight example" : "Resume example"}</button>
      <button type="button" class="secondary" data-uk-night-step ${running || phase === 5 ? "hidden" : ""}>Next checkpoint</button>
      <button type="button" class="secondary" data-uk-night-skip ${phase === 5 ? "hidden" : ""}>Skip to morning</button>
      ${choice === "support_home" ? `<button type="button" class="secondary" data-uk-sharing ${!sharingActive || phase === 5 ? "hidden" : ""}>${phase < 3 ? "Cancel home support" : "Stop home support"}</button>` : ""}</div>
  </div>`;
}
