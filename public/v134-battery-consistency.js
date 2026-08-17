const p134 = new URLSearchParams(location.search);
const enabled134 = (p134.get('variant') || 'fi-fleet') === 'fi-fleet' && p134.get('ops') === '1';

if (enabled134) {
  const root = () => document.querySelector('#screen');
  const fi = () => document.documentElement.lang === 'fi';
  const tr = (a, b) => fi() ? a : b;
  const onCycleStep = () => /4\s*\/\s*6/.test(root()?.innerText || '');
  const snapshot = () => window.PULSE_CHARGING_LAST_SNAPSHOT || window.PULSE_CHARGING?.adapter?.getSnapshot?.() || null;
  const session = () => window.PULSE_OPS_SESSION || null;
  const round1 = n => Math.round(Number(n) * 10) / 10;
  const transferStates = new Set(['CHARGING','V2G_AVAILABLE','V2G_ACTIVE','RECHARGING','READY_TO_DEPART']);

  let baseline = null;
  let baselineSession = null;
  let lastState = null;
  let lastSoc = null;
  let v2gStartSoc = null;
  let rechargeStartSoc = null;

  function resetBaselineIfNeeded() {
    const ref = session()?.session_ref || 'demo';
    if (!onCycleStep()) {
      baseline = null;
      baselineSession = null;
      v2gStartSoc = null;
      rechargeStartSoc = null;
      return;
    }
    if (baselineSession && baselineSession !== ref) {
      baseline = null;
      v2gStartSoc = null;
      rechargeStartSoc = null;
    }
    baselineSession = ref;
  }

  function ensureBaseline(s) {
    resetBaselineIfNeeded();
    if (baseline || !onCycleStep() || !s) return;
    baseline = {
      soc: Number(s.soc_percent ?? session()?.arrival_soc_percent ?? 55),
      toVehicle: Number(s.energy_to_vehicle_kwh || 0),
      toGrid: Number(s.energy_to_grid_kwh || 0)
    };
  }

  function physicalPatch(current, patch) {
    const nextState = patch.state || current?.state;
    if (!onCycleStep() || !transferStates.has(nextState)) return patch;
    ensureBaseline(current);
    if (!baseline) return patch;
    if (!(Object.prototype.hasOwnProperty.call(patch,'energy_to_vehicle_kwh') || Object.prototype.hasOwnProperty.call(patch,'energy_to_grid_kwh'))) return patch;

    const battery = Math.max(20, Number(session()?.battery_kwh || 75));
    const protectedSoc = Number(patch.protected_soc_percent ?? current?.protected_soc_percent ?? session()?.protected_soc_percent ?? 0);
    let toVehicle = Number(patch.energy_to_vehicle_kwh ?? current?.energy_to_vehicle_kwh ?? baseline.toVehicle);
    let toGrid = Number(patch.energy_to_grid_kwh ?? current?.energy_to_grid_kwh ?? baseline.toGrid);
    let soc = baseline.soc + (((toVehicle - baseline.toVehicle) - (toGrid - baseline.toGrid)) / battery) * 100;

    if (nextState === 'V2G_ACTIVE' && soc < protectedSoc) {
      const allowedNetDischarge = Math.max(0, (baseline.soc - protectedSoc) / 100 * battery);
      toGrid = baseline.toGrid + Math.max(0, (toVehicle - baseline.toVehicle) + allowedNetDischarge);
      soc = protectedSoc;
    }

    soc = Math.max(0, Math.min(100, soc));
    return {
      ...patch,
      soc_percent: round1(soc),
      energy_to_vehicle_kwh: Number(toVehicle.toFixed(2)),
      energy_to_grid_kwh: Number(toGrid.toFixed(2))
    };
  }

  function installGuard() {
    const adapter = window.PULSE_CHARGING?.adapter;
    if (!adapter || typeof adapter.publish !== 'function' || adapter.__pulseV134EnergyGuard) return;
    const original = adapter.publish.bind(adapter);
    adapter.__pulseV134EnergyGuard = true;
    adapter.publish = (patch = {}) => {
      const current = snapshot() || adapter.getSnapshot?.();
      const result = original(physicalPatch(current, patch));
      queueMicrotask(() => enhance(result));
      return result;
    };
  }

  function enhance(s = snapshot()) {
    resetBaselineIfNeeded();
    if (!onCycleStep() || !s) return;
    ensureBaseline(s);
    const battery = root()?.querySelector('.v1-adapter-cycle .v07-battery');
    const row = root()?.querySelector('.v1-adapter-cycle .v07-battery-row');
    if (!battery || !row) return;

    const soc = Number(s.soc_percent || 0);
    const protectedSoc = Number(s.protected_soc_percent ?? session()?.protected_soc_percent ?? 0);
    battery.classList.toggle('v134-discharging', s.state === 'V2G_ACTIVE');
    battery.classList.toggle('v134-recharging', s.state === 'RECHARGING');

    let marker = battery.querySelector('.v134-reserve-marker');
    if (!marker) {
      marker = document.createElement('span');
      marker.className = 'v134-reserve-marker';
      marker.setAttribute('aria-hidden','true');
      battery.append(marker);
    }
    marker.style.left = `${Math.max(0, Math.min(100, protectedSoc))}%`;
    marker.title = tr(`Suojattu lähtövaraus ${protectedSoc}%`, `Protected reserve ${protectedSoc}%`);

    if (s.state === 'V2G_ACTIVE' && lastState !== 'V2G_ACTIVE') v2gStartSoc = Number(lastSoc ?? soc);
    if (s.state === 'RECHARGING' && lastState !== 'RECHARGING') rechargeStartSoc = Number(lastSoc ?? soc);
    if (!['V2G_ACTIVE','RECHARGING'].includes(s.state)) rechargeStartSoc = null;

    let motion = root()?.querySelector('.v1-adapter-cycle .v134-soc-motion');
    if (!motion) {
      motion = document.createElement('div');
      motion.className = 'v134-soc-motion';
      row.insertAdjacentElement('afterend', motion);
    }

    if (s.state === 'V2G_ACTIVE') {
      const drop = Math.max(0, Number(v2gStartSoc ?? soc) - soc);
      motion.className = 'v134-soc-motion discharge';
      motion.innerHTML = `<strong>↓ ${drop.toFixed(1)} %-yks.</strong><span>${tr('akun varaus pienenee V2G:n aikana','battery level decreases during V2G')}</span>`;
    } else if (s.state === 'RECHARGING') {
      const rise = Math.max(0, soc - Number(rechargeStartSoc ?? soc));
      motion.className = 'v134-soc-motion recharge';
      motion.innerHTML = `<strong>↑ ${rise.toFixed(1)} %-yks.</strong><span>${tr('lähtöpuskuri palautuu latauksessa','departure buffer is restored by charging')}</span>`;
    } else {
      motion.className = 'v134-soc-motion';
      motion.innerHTML = `<strong>${tr('Suojattu raja','Protected floor')} ${protectedSoc}%</strong><span>${tr('V2G ei saa alittaa tätä varaustasoa','V2G cannot discharge below this level')}</span>`;
    }

    lastState = s.state;
    lastSoc = soc;
  }

  window.addEventListener('pulse:charging-ready', () => { installGuard(); enhance(); });
  window.addEventListener('pulse:charging-snapshot', e => enhance(e.detail));
  window.addEventListener('pulse:ops-session', () => { resetBaselineIfNeeded(); installGuard(); enhance(); });
  const screen = root();
  if (screen) {
    let queued = false;
    new MutationObserver(() => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => { queued = false; installGuard(); enhance(); });
    }).observe(screen, {childList:true,subtree:false});
  }
  installGuard();
  enhance();
}
