const p136 = new URLSearchParams(location.search);
const enabled136 = (p136.get('variant') || 'fi-fleet') === 'fi-fleet' && p136.get('ops') === '1';

if (enabled136) {
  const fi = () => document.documentElement.lang === 'fi';
  const tr = (a, b) => fi() ? a : b;
  const root = () => document.querySelector('#screen');
  const snapshot = () => window.PULSE_CHARGING_LAST_SNAPSHOT || window.PULSE_CHARGING?.adapter?.getSnapshot?.() || null;
  let lastSummary = null;
  let changing = false;

  function mySession(summary = lastSummary) {
    const ref = window.PULSE_OPS_SESSION?.session_ref;
    return summary?.sessions?.find(s => s.session_ref === ref) || null;
  }

  function publish(patch) {
    const adapter = window.PULSE_CHARGING?.adapter;
    if (!adapter || typeof adapter.publish !== 'function' || changing) return null;
    changing = true;
    try { return adapter.publish(patch); }
    catch (error) { console.warn('PULSE v1.3.6 hold transition failed', error); return null; }
    finally { changing = false; }
  }

  function holdPatch(s, sess) {
    return {
      state: 'PAUSED',
      soc_percent: s.soc_percent,
      protected_soc_percent: sess?.protected_soc_percent ?? s.protected_soc_percent,
      power_kw: 0,
      energy_to_vehicle_kwh: s.energy_to_vehicle_kwh,
      energy_to_grid_kwh: s.energy_to_grid_kwh,
      direction: 'idle',
      departure_ready: false
    };
  }

  function applyClock(summary) {
    lastSummary = summary || lastSummary;
    const c = lastSummary?.utility_clock;
    const sess = mySession();
    const rec = sess?.utility_recommendation || {};
    const s = snapshot();
    if (!c || !s || ['FAULT','OVERRIDDEN','SESSION_ENDED','READY_TO_DEPART'].includes(s.state)) return;

    const protectedSoc = Number(sess?.protected_soc_percent ?? s.protected_soc_percent ?? 0);
    const soc = Number(s.soc_percent ?? 0);
    const restoreTarget = Math.min(85, protectedSoc + 5);

    if ([2,3].includes(Number(c.step_index)) && rec.action === 'MOBILITY_PRIORITY') {
      if (['V2G_ACTIVE','V2G_AVAILABLE','CHARGING'].includes(s.state)) publish(holdPatch(s, sess));
      return;
    }

    if (Number(c.step_index) === 4) {
      if (s.state === 'PAUSED' && soc < restoreTarget - 0.1) {
        publish({
          ...holdPatch(s, sess),
          state: 'RECHARGING',
          power_kw: 0,
          direction: 'idle'
        });
      } else if (s.state === 'RECHARGING' && soc >= restoreTarget - 0.1) {
        publish(holdPatch(s, sess));
      }
      return;
    }

    if (Number(c.step_index) === 5 && s.state === 'PAUSED' && soc >= protectedSoc) {
      publish({
        ...holdPatch(s, sess),
        state: 'READY_TO_DEPART',
        departure_ready: true
      });
    }
  }

  function decorateHold() {
    const s = snapshot();
    if (s?.state !== 'PAUSED') return;
    const card = root()?.querySelector('.v1-adapter-cycle');
    if (!card) return;
    const c = lastSummary?.utility_clock || window.PULSE_UTILITY_CLOCK || {};
    const restore = Number(c.step_index) === 4;

    const phase = card.querySelector('.v07-phase strong');
    const sub = card.querySelector('.v07-phase span');
    const explanation = card.querySelector('.v07-explanation');
    const progress = card.querySelector('.v07-cycle-progress > div');
    const run = card.querySelector('.v1-run-adapter-cycle');

    if (phase) phase.textContent = restore ? tr('Lähtöpuskuri palautettu','Departure buffer restored') : tr('Odottaa – liikkumisvara suojattu','Holding – mobility reserve protected');
    if (sub) sub.textContent = restore ? tr('Ei energiansiirtoa · odottaa lähtövalmiuden vapautusta','No energy transfer · waiting for release') : tr('Ei energiansiirtoa · ajoneuvo pysyy kytkettynä','No energy transfer · vehicle remains connected');
    if (explanation) explanation.textContent = restore ? tr('Tarvittava lähtöpuskuri on palautettu. Ajoneuvo pysyy kytkettynä yhteisen jakson loppuun.','The required departure buffer has been restored. The vehicle remains connected until the shared run ends.') : tr('V2G keskeytettiin ennen suojattua varaustasoa. Ajoneuvo odottaa seuraavaa yhteisen kellon päätöstä.','V2G stopped before the protected reserve. The vehicle waits for the next shared-clock decision.');
    if (progress) progress.style.width = restore ? '92%' : '74%';
    if (run) run.hidden = true;
  }

  function afterStateChange() {
    if (lastSummary) applyClock(lastSummary);
    requestAnimationFrame(decorateHold);
  }

  window.addEventListener('pulse:utility-clock', event => {
    applyClock(event.detail);
    requestAnimationFrame(decorateHold);
  });
  window.addEventListener('pulse:charging-snapshot', afterStateChange);
  window.addEventListener('pulse:charging-ready', afterStateChange);

  const screen = root();
  if (screen) {
    let queued = false;
    new MutationObserver(() => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => { queued = false; decorateHold(); });
    }).observe(screen, {childList:true,subtree:false});
  }
}
