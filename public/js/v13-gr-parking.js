// One staged shared-bay example. It does not represent real sensors or vehicle movement.
export const GR_MANUAL_MOVES = Object.freeze(["forward", "right", "back"]);
export function initialGrParking() { return { stage: "approach", manualStep: 0, pedestrianSeen: false, manualUsed: false, wrongMoves: 0, lastWrong: false }; }
export function grParkingTransition(state, action) {
  const next = { ...state };
  switch (`${state.stage}:${action}`) {
    case "approach:inspect": next.stage = "checked"; break;
    case "checked:start": next.stage = "moving"; break;
    case "checked:fault": next.stage = "fault"; break;
    case "moving:pedestrian": next.stage = "paused"; next.pedestrianSeen = true; break;
    case "moving:stop": case "resuming:stop": case "manual:stop": next.stage = "stopped"; break;
    case "paused:review": case "fault:review": case "stopped:review": next.stage = "reviewed"; break;
    case "reviewed:resume": next.stage = "resuming"; break;
    case "reviewed:manual": next.stage = "manual"; next.manualUsed = true; next.manualStep = 0; next.lastWrong = false; break;
    case "resuming:aligned": next.stage = "aligned"; break;
    case "reviewed:help": next.stage = "support"; break;
    case "support:review": next.stage = "reviewed"; break;
    default:
      if (state.stage === "manual" && action === `move_${GR_MANUAL_MOVES[state.manualStep]}`) {
        next.manualStep += 1;
        next.lastWrong = false;
        if (next.manualStep === GR_MANUAL_MOVES.length) next.stage = "manual_aligned";
      } else if (state.stage === "manual" && action.startsWith("move_")) {
        next.wrongMoves += 1;
        next.lastWrong = true;
      } else if (state.stage === "manual_aligned" && action === "confirm") next.stage = "aligned";
  }
  return next;
}

export function grParkingCard(state) {
  const { stage, manualStep, pedestrianSeen } = state;
  const moving = ["moving", "resuming"].includes(stage);
  const recommendation = GR_MANUAL_MOVES[manualStep];
  const status = {
    approach: "Check the shared bay and the crossing route before asking for guided parking.",
    checked: "The route was checked in the illustration. Keep watching people and objects; Stop is available during guidance.",
    moving: "Guided parking illustration in progress. The driver remains responsible for checking the route.",
    paused: "A pedestrian has entered the bay crossing. The illustrated guidance stops; no charging or export starts.",
    reviewed: "The shared path has been rechecked. Resume guidance or use the manual arrows only if the route is clear.",
    resuming: "Guidance resumes only after the route check. Stop remains available.",
    fault: "Guidance is unavailable in this example. Recheck the route before manual positioning.",
    manual: `Manual step ${manualStep + 1} of 3: ${recommendation}. These arrows advance only the illustration.`,
    manual_aligned: "Manual corrections complete. Confirm that the shared crossing remains clear.",
    stopped: "Manoeuvre stopped by the driver. Recheck the crossing before another attempt.",
    support: "No support call was made. Discuss who can help clear the bay and offer an assisted route.",
    aligned: "Car aligned over the pad in this example. The pedestrian route remains clear; energy has not started."
  }[stage];
  const actions = stage === "approach" ? [["inspect", "Check surroundings"]]
    : stage === "checked" ? [["start", "Try guided parking"], ["fault", "Simulate guidance unavailable"]]
    : moving ? [["stop", "Stop manoeuvre"]]
    : stage === "paused" || stage === "fault" || stage === "stopped" ? [["review", "Wait and recheck shared path"]]
    : stage === "reviewed" ? [["resume", "Resume guided parking"], ["manual", "Use manual arrows"], ["help", "Show assisted route"]]
    : stage === "support" ? [["review", "Recheck with help"]]
    : stage === "manual" ? [["stop", "Stop manoeuvre"]]
    : stage === "manual_aligned" ? [["confirm", "Confirm crossing clear"]] : [];
  return `<div class="site-demo-card gr-parking" aria-label="Illustrative Trikala shared-bay positioning">
    <div class="scenario-badge">Trikala · shared daily parking bay · simulated guidance</div>
    <h2>Position for wireless charging</h2>
    <div class="gr-bay" role="img" aria-label="${stage === "aligned" ? "Car aligned over a wireless pad, shared crossing clear" : stage === "paused" ? "Guided car stopped because a pedestrian is crossing the bay" : "Car approaching a shared wireless bay with a marked pedestrian crossing"}"><span class="gr-car ${stage}" data-gr-manual-step="${manualStep}">🚗</span><span class="gr-pad">▭<small>Wireless pad</small></span><span class="gr-bay-marker">${stage === "aligned" ? "✓ Aligned" : stage === "paused" ? "⏸ Guidance stopped" : moving ? "→ Guided approach" : "↓ Check the bay"}</span><span class="gr-crossing">🚶 ${stage === "paused" ? "Pedestrian crossing" : pedestrianSeen ? "Crossing clear after review" : "Shared crossing · keep clear"}</span></div>
    <p class="demo-state" role="status">${status}</p>
    ${stage === "manual" ? `<div class="home-manual-panel"><strong>Driver-controlled arrow guidance</strong><p>Follow the highlighted arrow. Check the crossing after every movement.</p><div class="home-dpad gr-dpad" role="group" aria-label="Illustrative manual positioning">${["forward", "left", "right", "back"].map(move => `<button type="button" data-gr-move="${move}" class="${recommendation === move ? "recommended" : ""}" aria-label="Move ${move}, simulated">${{forward:"↑",left:"←",right:"→",back:"↓"}[move]}<small>${move}</small></button>`).join("")}<span class="home-dpad-center" aria-hidden="true">🚗</span></div><p class="home-move-feedback" role="status">${state.lastWrong ? "That arrow did not advance the illustration. " : ""}Next correction: ${recommendation}.${state.wrongMoves ? ` Wrong-direction attempts: ${state.wrongMoves}.` : ""}</p></div>` : ""}
    <div class="study-actions">${actions.map(([action,label],i) => `<button type="button" class="${i ? "secondary" : "primary"}" data-gr-parking="${action}">${label}</button>`).join("")}</div>
    <p class="study-note">The pedestrian and automatic stop are staged workshop events, not demonstrated sensing or autonomous parking. The driver checks the physical space and can choose to stop or seek help.</p>
  </div>`;
}
