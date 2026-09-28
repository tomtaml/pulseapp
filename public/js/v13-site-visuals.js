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

export function ukEnergyCard(choice, sharingActive) {
  const home = choice === "support_home" && sharingActive;
  return `<div class="site-demo-card" aria-label="UK vehicle and home energy flow">
    <div class="scenario-badge">Workshop scenario · simulated flow</div>
    <h2>${home ? "Vehicle supports the home" : "Vehicle charge stays available for the trip"}</h2>
    <div class="demo-flow" role="img" aria-label="${home ? "Vehicle sends energy to home" : "Grid charges vehicle; no home support is active"}"><span>${home ? "🚐" : "⚡"}<small>${home ? "Vehicle" : "Grid"}</small></span><span class="flow-arrow" aria-hidden="true">→</span><span>${home ? "🏠" : "🚐"}<small>${home ? "Home" : "Vehicle"}</small></span></div>
    <p class="study-note">${home ? "Home support stops before the protected next-trip reserve. The driver can stop it at any time." : "Home energy sharing is off. The next-trip reserve remains protected."}</p>
    ${choice === "support_home" ? `<button type="button" class="secondary" data-uk-sharing aria-pressed="${sharingActive}">${sharingActive ? "Stop home support" : "Resume home support"}</button>` : ""}
  </div>`;
}

export function ukRecoveryCard() {
  return `<div class="site-demo-card" aria-label="Wireless interruption and conductive fallback">
    <div class="scenario-badge">Workshop scenario · wet conditions</div>
    <h2>Charging interrupted</h2><p>Wireless positioning cannot be confirmed. The driver can retry, choose the conductive gully fallback, or leave with the available charge.</p>
    <p class="study-note">The gully is an alternative charging method in this scenario. Home energy sharing is not assumed through the fallback.</p>
  </div>`;
}
