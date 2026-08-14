import { ChargingState, normalizeSnapshot, assertTransition } from "./session-model.js";

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

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

  async runReferenceCycle() {
    this.publish({ state: ChargingState.CHARGING, soc_percent: 55, power_kw: 22, energy_to_vehicle_kwh: 0, energy_to_grid_kwh: 0, direction: "grid_to_vehicle", departure_ready: false });
    await sleep(2500 / this.speed);
    this.publish({ state: ChargingState.CHARGING, soc_percent: 63, power_kw: 22, energy_to_vehicle_kwh: 5.1, direction: "grid_to_vehicle" });
    await sleep(2500 / this.speed);
    this.publish({ state: ChargingState.V2G_AVAILABLE, soc_percent: 72, power_kw: 0, energy_to_vehicle_kwh: 10.2, energy_to_grid_kwh: 0, direction: "idle" });
    await sleep(1500 / this.speed);
    this.publish({ state: ChargingState.V2G_ACTIVE, soc_percent: 71, power_kw: -18, energy_to_grid_kwh: 0.8, direction: "vehicle_to_grid" });
    await sleep(2000 / this.speed);
    this.publish({ state: ChargingState.V2G_ACTIVE, soc_percent: 69, power_kw: -18, energy_to_grid_kwh: 2.2, direction: "vehicle_to_grid" });
    await sleep(2000 / this.speed);
    this.publish({ state: ChargingState.V2G_ACTIVE, soc_percent: 66, power_kw: -18, energy_to_grid_kwh: 3.6, direction: "vehicle_to_grid" });
    await sleep(1500 / this.speed);
    this.publish({ state: ChargingState.RECHARGING, soc_percent: 66, power_kw: 22, energy_to_vehicle_kwh: 10.2, energy_to_grid_kwh: 3.6, direction: "grid_to_vehicle" });
    await sleep(2500 / this.speed);
    this.publish({ state: ChargingState.RECHARGING, soc_percent: 68, power_kw: 22, energy_to_vehicle_kwh: 11.4, energy_to_grid_kwh: 3.6, direction: "grid_to_vehicle" });
    await sleep(2500 / this.speed);
    this.publish({ state: ChargingState.READY_TO_DEPART, soc_percent: 70, power_kw: 0, energy_to_vehicle_kwh: 12.6, energy_to_grid_kwh: 3.6, direction: "idle", departure_ready: true });
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
