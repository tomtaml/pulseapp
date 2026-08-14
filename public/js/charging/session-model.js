export const SESSION_PROTOCOL_VERSION = "pulse-session-v1";

export const ChargingState = Object.freeze({
  ARRIVED: "ARRIVED",
  ALIGNING: "ALIGNING",
  READY: "READY",
  CHARGING: "CHARGING",
  V2G_AVAILABLE: "V2G_AVAILABLE",
  V2G_ACTIVE: "V2G_ACTIVE",
  RECHARGING: "RECHARGING",
  READY_TO_DEPART: "READY_TO_DEPART",
  PAUSED: "PAUSED",
  FAULT: "FAULT",
  OVERRIDDEN: "OVERRIDDEN",
  SESSION_ENDED: "SESSION_ENDED"
});

const TRANSITIONS = Object.freeze({
  ARRIVED: ["ALIGNING", "FAULT", "SESSION_ENDED"],
  ALIGNING: ["READY", "FAULT", "SESSION_ENDED"],
  READY: ["CHARGING", "PAUSED", "FAULT", "SESSION_ENDED"],
  CHARGING: ["V2G_AVAILABLE", "READY_TO_DEPART", "PAUSED", "FAULT", "OVERRIDDEN"],
  V2G_AVAILABLE: ["V2G_ACTIVE", "RECHARGING", "READY_TO_DEPART", "OVERRIDDEN", "FAULT"],
  V2G_ACTIVE: ["RECHARGING", "READY_TO_DEPART", "OVERRIDDEN", "FAULT"],
  RECHARGING: ["READY_TO_DEPART", "PAUSED", "FAULT", "OVERRIDDEN"],
  READY_TO_DEPART: ["SESSION_ENDED", "CHARGING", "OVERRIDDEN"],
  PAUSED: ["READY", "CHARGING", "RECHARGING", "FAULT", "SESSION_ENDED"],
  FAULT: ["ALIGNING", "READY", "PAUSED", "SESSION_ENDED"],
  OVERRIDDEN: ["READY_TO_DEPART", "SESSION_ENDED"],
  SESSION_ENDED: []
});

export function canTransition(from, to) {
  return !!TRANSITIONS[from]?.includes(to);
}

function finiteOrNull(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function normalizeSnapshot(input = {}) {
  const state = Object.values(ChargingState).includes(input.state) ? input.state : ChargingState.ARRIVED;
  const socRaw = finiteOrNull(input.soc_percent);
  const protectedRaw = finiteOrNull(input.protected_soc_percent);
  const direction = ["grid_to_vehicle", "vehicle_to_grid", "idle"].includes(input.direction) ? input.direction : "idle";
  return Object.freeze({
    protocol_version: SESSION_PROTOCOL_VERSION,
    session_ref: typeof input.session_ref === "string" ? input.session_ref.slice(0, 64) : "demo",
    state,
    observed_at: typeof input.observed_at === "string" ? input.observed_at : new Date().toISOString(),
    soc_percent: socRaw === null ? null : clamp(socRaw, 0, 100),
    protected_soc_percent: protectedRaw === null ? null : clamp(protectedRaw, 0, 100),
    power_kw: finiteOrNull(input.power_kw),
    energy_to_vehicle_kwh: finiteOrNull(input.energy_to_vehicle_kwh),
    energy_to_grid_kwh: finiteOrNull(input.energy_to_grid_kwh),
    direction,
    departure_ready: input.departure_ready === true,
    fault_code: typeof input.fault_code === "string" ? input.fault_code.replace(/[^A-Z0-9_-]/gi, "").slice(0, 40) : null
  });
}

export function assertTransition(previous, next) {
  const a = normalizeSnapshot(previous);
  const b = normalizeSnapshot(next);
  if (a.state !== b.state && !canTransition(a.state, b.state)) {
    throw new Error(`Invalid charging-state transition: ${a.state} -> ${b.state}`);
  }
  return b;
}
