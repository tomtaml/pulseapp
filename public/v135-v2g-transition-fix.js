const p135 = new URLSearchParams(location.search);
const enabled135 = (p135.get('variant') || 'fi-fleet') === 'fi-fleet' && p135.get('ops') === '1';

if (enabled135) {
  function snapshot() {
    return window.PULSE_CHARGING_LAST_SNAPSHOT || window.PULSE_CHARGING?.adapter?.getSnapshot?.() || null;
  }

  function stopV2GIfNeeded(summary) {
    const adapter = window.PULSE_CHARGING?.adapter;
    const ref = window.PULSE_OPS_SESSION?.session_ref;
    if (!adapter || typeof adapter.publish !== 'function' || !ref || !summary?.sessions) return;

    const session = summary.sessions.find(s => s.session_ref === ref);
    const rec = session?.utility_recommendation || {};
    const current = snapshot();
    if (!current || current.state !== 'V2G_ACTIVE') return;

    const shouldStop = rec.action === 'MOBILITY_PRIORITY' ||
      (rec.target_state === 'V2G_AVAILABLE' && rec.action !== 'EXPORT_V2G');
    if (!shouldStop) return;

    try {
      adapter.publish({
        state: 'V2G_AVAILABLE',
        soc_percent: current.soc_percent,
        protected_soc_percent: session?.protected_soc_percent ?? current.protected_soc_percent,
        power_kw: 0,
        energy_to_vehicle_kwh: current.energy_to_vehicle_kwh,
        energy_to_grid_kwh: current.energy_to_grid_kwh,
        direction: 'idle',
        departure_ready: false
      });
      window.dispatchEvent(new CustomEvent('pulse:v2g-stopped-for-mobility', {
        detail: { session_ref: ref, action: rec.action, simulated_time: summary.utility_clock?.simulated_time }
      }));
    } catch (error) {
      console.warn('PULSE v1.3.5 could not stop V2G cleanly', error);
    }
  }

  window.addEventListener('pulse:utility-clock', event => stopV2GIfNeeded(event.detail));
}
