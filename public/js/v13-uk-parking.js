// Deterministic workshop scene. It does not read vehicle sensors or move a car.
export const initialUkParking = () => ({ stage: "approach", obstacleSeen: false, obstacleCleared: false });

export function ukParkingTransition(state, action) {
  const { stage, obstacleSeen } = state;
  if (action === "cancel" && stage !== "parked") return initialUkParking();
  if (action === "inspect" && stage === "approach") return { ...state, stage: "checked" };
  if (action === "start" && stage === "checked") return { ...state, stage: "moving" };
  if (action === "obstacle" && stage === "moving") return { ...state, stage: "blocked", obstacleSeen: true, obstacleCleared: false };
  if (action === "stop" && (stage === "moving" || stage === "resuming")) return { ...state, stage: "stopped" };
  if (action === "support" && (stage === "blocked" || stage === "stopped")) return { ...state, stage: "support" };
  if (action === "review" && stage === "blocked") return { ...state, stage: "reviewed", obstacleCleared: true };
  if (action === "review" && (stage === "stopped" || stage === "support")) return { ...state, stage: obstacleSeen ? "reviewed" : "checked", obstacleCleared: obstacleSeen };
  if (action === "resume" && stage === "reviewed") return { ...state, stage: "resuming" };
  if (action === "parked" && stage === "resuming") return { ...state, stage: "parked" };
  return state;
}
