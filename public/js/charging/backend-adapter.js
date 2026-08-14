import { normalizeSnapshot } from "./session-model.js";

export class BackendChargingAdapter {
  constructor({ basePath = "/api/charging" } = {}) {
    if (!basePath.startsWith("/api/")) throw new Error("Charging API must remain same-origin.");
    this.basePath = basePath.replace(/\/$/, "");
  }

  headers(extra = {}) {
    return { "accept": "application/json", ...extra };
  }

  async getCapabilities() {
    const res = await fetch(`${this.basePath}/capabilities`, {
      method: "GET", credentials: "same-origin", cache: "no-store", headers: this.headers()
    });
    if (!res.ok) throw new Error(`Charging capabilities unavailable (${res.status}).`);
    return res.json();
  }

  async getSnapshot(sessionRef) {
    const ref = encodeURIComponent(String(sessionRef || "demo").slice(0, 64));
    const res = await fetch(`${this.basePath}/session/${ref}`, {
      method: "GET", credentials: "same-origin", cache: "no-store", headers: this.headers()
    });
    if (!res.ok) throw new Error(`Charging session unavailable (${res.status}).`);
    return normalizeSnapshot(await res.json());
  }

  async sendCommand(sessionRef, command, payload = {}) {
    const capabilities = await this.getCapabilities();
    if (!capabilities.commands_enabled) throw new Error("Charging commands are disabled for this deployment.");
    const ref = encodeURIComponent(String(sessionRef || "").slice(0, 64));
    const res = await fetch(`${this.basePath}/session/${ref}/command`, {
      method: "POST",
      credentials: "same-origin",
      cache: "no-store",
      headers: this.headers({ "content-type": "application/json", "x-idempotency-key": crypto.randomUUID() }),
      body: JSON.stringify({ command, payload })
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(body.error || `Charging command rejected (${res.status}).`);
    return body;
  }
}
