import { ChargingState, normalizeSnapshot, assertTransition } from "./session-model.js";

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const lerp = (a, b, t) => a + (b - a) * t;
const round1 = value => Number(value.toFixed(1));
const round2 = value => Number(value.toFixed(2));

export class MockChargingAdapter extends EventTarget {
  constructor({ sessionRef = "demo", speed = 1 } = {}) {
    super();
    this.speed = Math.max(0.1, Number(speed) || 1);
    this.snapshot = normalizeSnapshot({
      session_ref: sessionRef,
      state: ChargingState.READY,
      soc_percent: 55,
      protected_soc_percent: 65,
      power_kw: 0,
      energy_to_vehicle_kwh: 0,
      energy_to_grid_kwh: 0,
      direction: "idle",
      departure_ready: false
    });
  }

  getSnapshot() { return this.snapshot; }

  subscribe(handler) {
    const listener = event => handler(event.detail);
    this.addEventListener("snapshot", listener);
    handler(this.snapshot);
    return () => this.removeEventListener("snapshot", listener);
  }

  publish(next) {
    const candidate = normalizeSnapshot({ ...this.snapshot, ...next, observed_at: new Date().toISOString() });
    this.snapshot = assertTransition(this.snapshot, candidate);
    this.dispatchEvent(new CustomEvent("snapshot", { detail: this.snapshot }));
    return this.snapshot;
  }

  async animatePhase({
    durationMs,
    state,
    direction,
    powerKw,
    fromSoc,
    toSoc,
    fromVehicle,
    toVehicle,
    fromGrid,
    toGrid
  }) {
    const steps = Math.max(1, Math.round(durationMs / 500));
    const stepMs = durationMs / steps;

    if (this.snapshot.state !== state) {
      this.publish({
        state,
        soc_percent: fromSoc,
        power_kw: powerKw,
        energy_to_vehicle_kwh: fromVehicle,
        energy_to_grid_kwh: fromGrid,
        direction,
        departure_ready: false
      });
    }

    for (let i = 1; i <= steps; i += 1) {
      await sleep(stepMs / this.speed);
      const t = i / steps;
      this.publish({
        state,
        soc_percent: round1(lerp(fromSoc, toSoc, t)),
        power_kw: powerKw,
        energy_to_vehicle_kwh: round2(lerp(fromVehicle, toVehicle, t)),
        energy_to_grid_kwh: round2(lerp(fromGrid, toGrid, t)),
        direction,
        departure_ready: false
      });
    }
  }

  async runReferenceCycle() {
    // 30-second participant reference cycle. Frequent snapshots make SoC and
    // energy movement readable instead of jumping between a few fixed values.
    this.publish({
      state: ChargingState.CHARGING,
      soc_percent: 55,
      power_kw: 22,
      energy_to_vehicle_kwh: 0,
      energy_to_grid_kwh: 0,
      direction: "grid_to_vehicle",
      departure_ready: false
    });

    // 0–8 s: build the protected departure reserve, 55% -> 65%.
    await this.animatePhase({
      durationMs: 8000,
      state: ChargingState.CHARGING,
      direction: "grid_to_vehicle",
      powerKw: 22,
      fromSoc: 55,
      toSoc: 65,
      fromVehicle: 0,
      toVehicle: 6.0,
      fromGrid: 0,
      toGrid: 0
    });

    // 8–13 s: add buffer above the protected reserve, 65% -> 72%.
    await this.animatePhase({
      durationMs: 5000,
      state: ChargingState.CHARGING,
      direction: "grid_to_vehicle",
      powerKw: 22,
      fromSoc: 65,
      toSoc: 72,
      fromVehicle: 6.0,
      toVehicle: 10.2,
      fromGrid: 0,
      toGrid: 0
    });

    // 13–16 s: show that V2G is available before export actually starts.
    this.publish({
      state: ChargingState.V2G_AVAILABLE,
      soc_percent: 72,
      power_kw: 0,
      energy_to_vehicle_kwh: 10.2,
      energy_to_grid_kwh: 0,
      direction: "idle",
      departure_ready: false
    });
    await sleep(3000 / this.speed);

    // 16–23 s: gradual V2G export, 72% -> 66%.
    await this.animatePhase({
      durationMs: 7000,
      state: ChargingState.V2G_ACTIVE,
      direction: "vehicle_to_grid",
      powerKw: -18,
      fromSoc: 72,
      toSoc: 66,
      fromVehicle: 10.2,
      toVehicle: 10.2,
      fromGrid: 0,
      toGrid: 3.6
    });

    // 23–30 s: restore departure buffer, 66% -> 70%.
    await this.animatePhase({
      durationMs: 7000,
      state: ChargingState.RECHARGING,
      direction: "grid_to_vehicle",
      powerKw: 22,
      fromSoc: 66,
      toSoc: 70,
      fromVehicle: 10.2,
      toVehicle: 12.6,
      fromGrid: 3.6,
      toGrid: 3.6
    });

    this.publish({
      state: ChargingState.READY_TO_DEPART,
      soc_percent: 70,
      power_kw: 0,
      energy_to_vehicle_kwh: 12.6,
      energy_to_grid_kwh: 3.6,
      direction: "idle",
      departure_ready: true
    });
    return this.snapshot;
  }

  override() {
    return this.publish({
      state: ChargingState.OVERRIDDEN,
      power_kw: 0,
      direction: "idle",
      departure_ready: Number(this.snapshot.soc_percent) >= Number(this.snapshot.protected_soc_percent)
    });
  }
}
