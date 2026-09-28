// Workshop-only illustrations. They show a choice without claiming live tariff,
// grid, vehicle or home energy data.
const chargingWindows = [
  ["charge_now", "Charge now", "Ready for the next trip"],
  ["wait_for_lower_tariff", "Lower tariff later", "Price signal"],
  ["wait_for_res_surplus", "Renewable surplus later", "RES signal"]
];

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

export function ukAlignmentCard(stage) {
  const ready = stage === "ready";
  const guided = stage === "guided";
  return `<div class="site-demo-card accessible-bay" aria-label="Accessible wireless charging position">
    <div class="scenario-badge">Workshop scenario · simulated positioning</div>
    <h2>Wireless charging position</h2>
    <div class="bay-track" role="img" aria-label="${ready ? "Vehicle aligned with the wireless pad" : guided ? "Vehicle needs a small positioning correction" : "Vehicle approaching the wireless pad"}"><span class="bay-vehicle ${ready ? "ready" : guided ? "guided" : ""}" aria-hidden="true">🚐</span><span class="bay-pad" aria-hidden="true">⌁⌁⌁</span></div>
    <p class="demo-state" role="status">${ready ? "Position confirmed. Wireless charging is ready in this simulation." : guided ? "Move a little closer to the marked pad; check the position again." : "Position needs confirmation before wireless charging can begin."}</p>
    <div class="alignment-controls"><button type="button" class="secondary" data-uk-align="guided">Show positioning guidance</button><button type="button" class="primary" data-uk-align="ready">Confirm wireless position</button></div>
    <p class="study-note">The conductive gully remains a fallback if wireless charging is interrupted.</p>
  </div>`;
}

export function ukStreetChargeCard(started) {
  return `<div class="site-demo-card" aria-label="On-street wireless charging example">
    <div class="scenario-badge">Scene A · Oxfordshire street WPT</div>
    <h2>${started ? "Wireless charging started" : "Position confirmed · ready to charge"}</h2>
    <div class="demo-flow ${started ? "" : "idle"}" role="img" aria-label="${started ? "Grid sends energy to the vehicle at the street bay" : "Vehicle is positioned; charging has not started"}"><span>⚡<small>Grid</small></span><span class="flow-arrow" aria-hidden="true">→</span><span>🚐<small>Vehicle</small></span></div>
    <p class="demo-state">${started ? "Charging is active in this simulation. The following rain scenario will interrupt it." : "The pad is ready. Start the simulated session when you are ready."}</p>
    <button type="button" class="primary" data-uk-street-charge ${started ? "disabled" : ""}>${started ? "Session started" : "Start wireless charging"}</button>
  </div>`;
}

export function ukHomeParkingCard(parked) {
  return `<div class="site-demo-card home-scene" aria-label="Separate overnight household energy example">
    <div class="scenario-badge">Scene B · illustrative overnight home setting</div>
    <h2>Park close to the house</h2>
    <div class="home-layout" role="img" aria-label="${parked ? "Vehicle parked beside the house in a marked parking space" : "Vehicle approaches the parking space beside the house"}">
      <div class="home-house" aria-hidden="true">🏠<small>House</small></div>
      <div class="home-parking" aria-hidden="true"><span class="home-vehicle ${parked ? "parked" : ""}">🚐</span><span class="home-pad">▭<small>Parking space</small></span></div>
    </div>
    <p class="demo-state">${parked ? "Vehicle parked beside the house. The overnight example can begin." : "This is a new setting, separate from the street bay. Position the vehicle close to the house."}</p>
    <button type="button" class="primary" data-uk-home-park ${parked ? "disabled" : ""}>${parked ? "Parked by the house" : "Park by the house"}</button>
    <p class="study-note">Schematic workshop example; it does not depict a verified Oxfordshire home installation or live HEMS connection.</p>
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

export function ukEnergyCard(choice, phase, sharingActive, exported, running = false) {
  const frame = ukOvernightFrame(choice, phase, sharingActive, exported);
  const active = frame.direction !== "idle";
  const flowLabel = frame.direction === "home" ? "Vehicle sends energy to home" : frame.direction === "charge" ? "Grid charges vehicle" : "No energy transfer is active";
  const left = frame.direction === "home" ? ["🚐", "Vehicle"] : ["⚡", "Grid"];
  const right = frame.direction === "home" ? ["🏠", "Home"] : ["🚐", "Vehicle"];
  return `<div class="site-demo-card overnight-card" aria-label="Separate overnight household V2H example">
    <div class="scenario-badge">Scene B · simulated overnight energy</div>
    <div class="night-heading"><h2>Parked beside the house · <span data-uk-time>${frame.time}</span></h2><span class="night-live" data-uk-state>${running ? "Running" : phase === 5 ? "Ready for next trip" : "Ready to start"}</span></div>
    <div class="home-reserves"><div><span>Vehicle battery</span><strong data-uk-soc>${frame.soc}%</strong></div><div><span>Protected next-trip reserve</span><strong>65%</strong></div></div>
    <div class="home-battery" data-uk-battery role="img" aria-label="Vehicle battery ${frame.soc} percent; protected trip reserve 65 percent"><span data-uk-fill style="width:${frame.soc}%"></span></div>
    <div class="night-timeline" aria-label="Illustrative overnight checkpoints">${["22:00", "23:00", "00:00", "01:00", "02:00", "07:00"].map((time, index) => `<span data-uk-checkpoint="${index}" class="${index === phase ? "current" : ""}">${time}</span>`).join("")}</div>
    <div class="demo-flow ${active && running ? "" : "idle"}" data-uk-flow role="img" aria-label="${flowLabel}"><span data-uk-from>${left[0]}<small>${left[1]}</small></span><span class="flow-arrow" aria-hidden="true">→</span><span data-uk-to>${right[0]}<small>${right[1]}</small></span></div>
    <p class="night-direction" data-uk-direction>${flowLabel}</p>
    <p class="demo-state" data-uk-status>${frame.status}</p>
    <p class="study-note">Household essential loads and backup threshold are a workshop discussion point; no household value or live tariff is connected. All battery values above are illustrative.</p>
    <div class="study-actions"><button type="button" class="primary" data-uk-night>${phase === 5 ? "Replay overnight example" : running ? "Pause example" : phase === 0 ? "Run overnight example" : "Resume example"}</button>
      <button type="button" class="secondary" data-uk-night-step ${running || phase === 5 ? "hidden" : ""}>Next checkpoint</button>
      <button type="button" class="secondary" data-uk-night-skip ${phase === 5 ? "hidden" : ""}>Skip to morning</button>
      ${choice === "support_home" ? `<button type="button" class="secondary" data-uk-sharing ${!sharingActive || phase === 5 ? "hidden" : ""}>${phase < 3 ? "Cancel home support" : "Stop home support"}</button>` : ""}</div>
  </div>`;
}

export function ukRecoveryCard() {
  return `<div class="site-demo-card" aria-label="Wireless interruption and conductive fallback">
    <div class="scenario-badge">Workshop scenario · wet conditions</div>
    <h2>Street charging interrupted</h2><p>Rain disrupts the active wireless session and position can no longer be confirmed. The driver can retry, choose the conductive gully fallback, or leave with the available charge.</p>
    <p class="study-note">The gully is an alternative charging method in this scenario. Home energy sharing is not assumed through the fallback.</p>
  </div>`;
}
