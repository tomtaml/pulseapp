// v1.3.9 utility semantics for connected vehicles that are temporarily
// unavailable for V2G because mobility or restored departure buffer takes priority.
const fi136u = () => document.documentElement.lang === 'fi';
const tr136u = (a,b) => fi136u() ? a : b;

function applyHoldSemantics136u(data) {
  const sessions = data?.sessions || [];
  for (const session of sessions) {
    const row = document.querySelector(`.sessions-table tbody tr[data-session-ref="${CSS.escape(session.session_ref)}"]`);
    const stateCell = row?.children?.[1];
    if (!stateCell) continue;
    const action = session?.utility_recommendation?.action;
    if (action === 'MOBILITY_PRIORITY') stateCell.textContent = tr136u('Odottaa / liikkuminen etusijalla','Holding / mobility priority');
    else if (session?.state === 'PAUSED' && action === 'HOLD_READY') stateCell.textContent = tr136u('Odottaa / puskuri palautettu','Holding / buffer restored');
    else if (session?.state === 'PAUSED') stateCell.textContent = tr136u('Odottaa','Holding');
  }

  const availableFlex = sessions
    .filter(s => ['V2G_AVAILABLE','EXPORT_V2G'].includes(s?.utility_recommendation?.action))
    .reduce((sum,s) => sum + Number(s.flexibility_kw || 0), 0);
  const metrics = document.querySelectorAll('#dashboard > .metric-grid .metric strong');
  if (metrics[5]) metrics[5].textContent = `${availableFlex.toFixed(0)} kW`;

  const badge = document.getElementById('viewBadge');
  if (badge) badge.textContent = 'Utility / aggregator v1.3.9';
  const eyebrow = document.getElementById('eyebrow');
  if (eyebrow) eyebrow.textContent = tr136u('PULSE v1.3.9 · yhteinen energiajärjestelmän kello','PULSE v1.3.9 · shared energy-system clock');
}

window.addEventListener('pulse:utility-stable-update', event => {
  requestAnimationFrame(() => applyHoldSemantics136u(event.detail));
});
