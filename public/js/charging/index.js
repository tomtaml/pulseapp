import { MockChargingAdapter } from "./mock-adapter.js";
import { BackendChargingAdapter } from "./backend-adapter.js";

let adapter = null;
let capabilities = null;
let unsubscribe = null;

function publishSnapshot(snapshot) {
  window.PULSE_CHARGING_LAST_SNAPSHOT = snapshot;
  window.dispatchEvent(new CustomEvent("pulse:charging-snapshot", { detail: snapshot }));
}

export async function initChargingAdapter() {
  if (adapter) return { adapter, capabilities };
  const configRes = await fetch("/api/config", { cache: "no-store", credentials: "same-origin" });
  const config = configRes.ok ? await configRes.json() : {};
  const mode = config.charging_backend_mode === "api" ? "api" : "mock";
  adapter = mode === "api" ? new BackendChargingAdapter() : new MockChargingAdapter({ sessionRef: "demo" });
  try {
    capabilities = mode === "api" ? await adapter.getCapabilities() : {
      protocol: "pulse-session-v1",
      backend_mode: "mock",
      commands_enabled: false
    };
  } catch {
    capabilities = { protocol: "pulse-session-v1", backend_mode: mode, commands_enabled: false, available: false };
  }
  window.PULSE_CHARGING = Object.freeze({ adapter, capabilities, mode });
  if (typeof adapter.subscribe === "function") {
    unsubscribe?.();
    unsubscribe = adapter.subscribe(publishSnapshot);
  } else if (typeof adapter.getSnapshot === "function") {
    try { publishSnapshot(await adapter.getSnapshot("demo")); } catch {}
  }
  window.dispatchEvent(new CustomEvent("pulse:charging-ready", { detail: window.PULSE_CHARGING }));
  return window.PULSE_CHARGING;
}

initChargingAdapter().catch(() => {
  window.PULSE_CHARGING = Object.freeze({ adapter: null, capabilities: { available: false }, mode: "unavailable" });
});
