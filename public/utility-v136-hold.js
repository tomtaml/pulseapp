// v1.3.6 utility semantics for vehicles that are connected but temporarily
// unavailable for V2G because the mobility reserve takes priority.
const fi136u = () => document.documentElement.lang === 'fi';
const tr136u = (a,b) => fi136u() ? a : b;

function applyHoldSemantics136u(data) {
  const sessions = data?.sessions || [];
  for (const session of sessions) {
    if (session?.utility_recommendation?.action !== 'MOBILITY_PRIORITY') continue;
    const row = document.querySelector(`.sessions-table tbody tr[data-session-ref="${CSS.escape(session.session_ref)}"]`);
    const stateCell = row?.children?.[1];
    if (stateCell) stateCell.textContent = tr136u('Odottaa / liikkuminen etusijalla','Holding / mobility priority');
  }

  // The backend registry still exposes the connected technical state. For the
  // workshop utility metric, count only flexibility that is actually dispatchable
  // under the current mobility recommendation.
  const availableFlex = sessions
    .filter(s => ['V2G_AVAILABLE','EXPORT_V2G'].includes(s?.utility_recommendation?.action))
    .reduce((sum,s) => sum + Number(s.flexibility_kw || 0), 0);
  const metrics = document.querySelectorAll('#dashboard > .metric-grid .metric strong');
  if (metrics[5]) metrics[5].textContent = `${availableFlex.toFixed(0)} kW`;

  const badge = document.getElementById('viewBadge');
  if (badge) badge.textContent = 'Utility / aggregator v1.3.6';
  const eyebrow = document.getElementById('eyebrow');
  if (eyebrow) eyebrow.textContent = tr136u('PULSE v1.3.6 · yhteinen energiajärjestelmän kello','PULSE v1.3.6 · shared energy-system clock');
}

window.addEventListener('pulse:utility-stable-update', event => {
  requestAnimationFrame(() => applyHoldSemantics136u(event.detail));
});
