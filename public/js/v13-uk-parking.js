// Deterministic workshop scene. It does not read vehicle sensors or move a car.
export const initialUkParking = () => ({ stage: "approach", obstacleSeen: false, obstacleCleared: false, manualUsed: false, guidanceFault: false });

export function ukParkingTransition(state, action) {
  const { stage, obstacleSeen } = state;
  if (action === "cancel" && stage !== "parked") return initialUkParking();
  if (action === "inspect" && stage === "approach") return { ...state, stage: "checked" };
  if (action === "start" && stage === "checked") return { ...state, stage: "moving" };
  if (action === "guidance_fault" && stage === "checked") return { ...state, stage: "fault", guidanceFault: true };
  if (action === "obstacle" && stage === "moving") return { ...state, stage: "blocked", obstacleSeen: true, obstacleCleared: false };
  if (action === "stop" && ["moving", "resuming", "manual_guidance", "manual_aligned"].includes(stage)) return { ...state, stage: "stopped" };
  if (action === "support" && ["blocked", "stopped", "fault"].includes(stage)) return { ...state, stage: "support" };
  if (action === "review" && stage === "blocked") return { ...state, stage: "reviewed", obstacleCleared: true };
  if (action === "review" && ["stopped", "support", "fault"].includes(stage)) return { ...state, stage: obstacleSeen ? "reviewed" : "checked", obstacleCleared: obstacleSeen };
  if (action === "resume" && stage === "reviewed") return { ...state, stage: "resuming" };
  if (action === "parked" && stage === "resuming") return { ...state, stage: "parked" };
  if (action === "manual" && (stage === "checked" || stage === "reviewed")) return { ...state, stage: "manual_guidance", manualUsed: true };
  if (action === "manual_step" && stage === "manual_guidance") return { ...state, stage: "manual_aligned" };
  if (action === "manual_confirm" && stage === "manual_aligned") return { ...state, stage: "parked" };
  return state;
}
