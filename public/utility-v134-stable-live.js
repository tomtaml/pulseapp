// v1.3.4 stable utility live updater.
// The legacy utility renderer is still used for the initial render and explicit
// language/manual refresh actions. Its 2 s full-dashboard refresh interval is
// suppressed here; live polling below updates only the DOM values that changed.
const nativeSetInterval134 = window.setInterval.bind(window);
const nativeClearInterval134 = window.clearInterval.bind(window);
let suppressedLegacyTimer134 = null;

window.setInterval = (fn, delay, ...args) => {
  const ms = Number(delay);
  if (ms === 2000 && typeof fn === 'function' && fn.name === 'refresh') {
    suppressedLegacyTimer134 = nativeSetInterval134(() => {}, 60 * 60 * 1000);
    return suppressedLegacyTimer134;
  }
  return nativeSetInterval134(fn, delay, ...args);
};

const q134u = new URLSearchParams(location.search);
const workshop134u = (q134u.get('workshop') || 'TAMPERE-S4').replace(/[^A-Za-z0-9_-]/g, '').slice(0, 32) || 'TAMPERE-S4';
let pollBusy134u = false;
let lastEventKey134u = '';
let lastSessionKey134u = '';

const fi134u = () => document.documentElement.lang === 'fi';
const tr134u = (a, b) => fi134u() ? a : b;
const esc134u = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const fmt134u = (n, d = 1) => Number(n || 0).toFixed(d);
const setText134u = (el, value) => {
  if (!el) return;
  const next = String(value ?? '');
  if (el.textContent !== next) el.textContent = next;
};

function stateLabel134u(state) {
  const fiMap = {DOCKING:'Saapuminen / telakoituminen',ALIGNING:'Kohdistus',READY:'Valmis',CHARGING:'Lataus',V2G_AVAILABLE:'V2G käytettävissä',V2G_ACTIVE:'V2G aktiivinen',RECHARGING:'Jälkilataus',READY_TO_DEPART:'Lähtövalmis',FAULT:'Häiriö',OVERRIDDEN:'Ohitettu',SESSION_ENDED:'Päättynyt'};
  const enMap = {DOCKING:'Docking',ALIGNING:'Aligning',READY:'Ready',CHARGING:'Charging',V2G_AVAILABLE:'V2G available',V2G_ACTIVE:'V2G active',RECHARGING:'Recharging',READY_TO_DEPART:'Ready to depart',FAULT:'Fault',OVERRIDDEN:'Overridden',SESSION_ENDED:'Ended'};
  return (fi134u() ? fiMap : enMap)[state] || state || '—';
}
function actionClass134u(a) {
  const s = String(a || '');
  if (s.includes('EXPORT') || s.includes('V2G')) return 'v2g';
  if (s.includes('CHARGE') || s.includes('RESTORE')) return 'charge';
  if (s.includes('READY')) return 'ready';
  return '';
}
function sessionRows134u(sessions) {
  if (!sessions.length) return `<tr><td colspan="8">${esc134u(tr134u('odottaa ensimmäistä QR-istuntoa','waiting for the first QR session'))}</td></tr>`;
  return sessions.map(s => {
    const rec = s.utility_recommendation || {};
    const label = fi134u() ? s.archetype_label_fi : s.archetype_label_en;
    return `<tr data-session-ref="${esc134u(s.session_ref)}"><td class="profile"><strong>${esc134u(s.session_ref)}</strong><small>${esc134u(label || '')}</small></td><td>${esc134u(stateLabel134u(s.state))}</td><td>${fmt134u(s.soc_percent,0)}%</td><td><strong>${fmt134u(s.protected_soc_percent,0)}%</strong></td><td>${fmt134u(s.route_km,0)} km</td><td>${fmt134u(s.dwell_minutes,0)} min</td><td>${Number(s.power_kw||0)>0?'+':''}${fmt134u(s.power_kw,0)} kW</td><td><span class="action-chip ${actionClass134u(rec.action)}">${esc134u(rec.action || '—')}</span><span class="session-rec">${esc134u(fi134u()?rec.reason_fi:rec.reason_en)}</span></td></tr>`;
  }).join('');
}
function eventRows134u(events) {
  if (!events.length) return `<p>${esc134u(tr134u('odottaa ensimmäistä QR-istuntoa','waiting for the first QR session'))}</p>`;
  return events.map(e => `<div class="event-row"><time>${new Date(e.at).toLocaleTimeString(fi134u()?'fi-FI':'en-GB',{hour:'2-digit',minute:'2-digit',second:'2-digit'})}</time><p>${esc134u(fi134u()?e.message_fi:e.message_en)}</p></div>`).join('');
}

function updateChart134u(c, series) {
  const current = Math.max(0, Math.min(Math.max(0, series.length - 1), Number(c.step_index || 0)));
  setText134u(document.querySelector('.chart-panel .section-head .badge'), c.simulated_time || '15:30');
  document.querySelectorAll('.timeline-mini > div').forEach((el, i) => el.classList.toggle('active', i === current));

  const svg = document.querySelector('.utility-chart');
  if (!svg || series.length < 2) return;
  const W=820,L=58,R=24,iw=W-L-R;
  const x=i=>L+i*iw/(series.length-1);
  const bandW=iw/(series.length-1);
  const bandX=Math.max(L,x(current)-bandW/2);
  const band=svg.querySelector('rect');
  if (band) { band.setAttribute('x', String(bandX)); band.setAttribute('width', String(bandW)); }
  const cursor=[...svg.querySelectorAll('line')].find(l => l.getAttribute('stroke') === '#1b73c7');
  if (cursor) { cursor.setAttribute('x1', String(x(current))); cursor.setAttribute('x2', String(x(current))); }
}

function updateStable134u(d) {
  const dashboard = document.getElementById('dashboard');
  if (!dashboard || !dashboard.querySelector('.clock-panel')) return false;
  const c=d.utility_clock||{}, a=d.aggregate||{}, sessions=d.sessions||[], series=d.grid_series||[];

  // Clock + current grid signal.
  setText134u(document.querySelector('.clock-face > strong'), c.simulated_time || '15:30');
  const countdown = c.complete ? tr134u('jakso päättynyt','run complete') : c.running ? `${c.seconds_to_next || 0}s ${tr134u('seuraava jakso','next interval')}` : tr134u('odottaa käynnistystä','waiting for start');
  setText134u(document.querySelector('.clock-face > small'), countdown);
  setText134u(document.querySelector('.grid-now > p'), fi134u() ? (c.intent_fi || '—') : (c.intent_en || '—'));
  const signals=document.querySelectorAll('.grid-now .signal strong');
  setText134u(signals[0], `${c.demand_index ?? 0}/100`);
  setText134u(signals[1], `${c.res_percent ?? 0}%`);
  setText134u(signals[2], `${c.price_c_kwh ?? 0} c/kWh`);
  updateChart134u(c,series);

  // Aggregate cards, kept in the same order as the base renderer.
  const metrics=document.querySelectorAll('#dashboard > .metric-grid .metric strong');
  const metricValues=[
    String(a.active_sessions||0),
    `${fmt134u(a.import_power_kw,0)} kW`,
    `${fmt134u(a.export_power_kw,0)} kW`,
    `${Number(a.net_power_kw||0)>=0?'+':''}${fmt134u(a.net_power_kw,0)} kW`,
    `${fmt134u(a.peak_shaving_kw,0)} kW`,
    `${fmt134u(a.flexibility_available_kw,0)} kW`,
    `${fmt134u(a.energy_to_vehicle_kwh)} kWh`,
    `${fmt134u(a.energy_to_grid_kwh)} kWh`
  ];
  metrics.forEach((el,i)=>setText134u(el,metricValues[i]));

  // Current power flow.
  const powerNodes=document.querySelectorAll('.power-flow .power-node strong');
  setText134u(powerNodes[0],`${fmt134u(a.import_power_kw,0)} kW ↓`);
  setText134u(powerNodes[1],`${fmt134u(a.export_power_kw,0)} kW ↑`);
  const flowPanel=document.querySelector('.power-flow')?.closest('.panel');
  setText134u(flowPanel?.querySelector('.section-head p'),new Date(d.observed_at).toLocaleTimeString(fi134u()?'fi-FI':'en-GB'));

  // Sessions: replace tbody only, and only if displayed contents changed.
  const sessionBody=document.querySelector('.sessions-table tbody');
  const sessionKey=JSON.stringify(sessions.map(s=>[s.session_ref,s.state,Math.round(Number(s.soc_percent||0)*10)/10,Math.round(Number(s.protected_soc_percent||0)*10)/10,Math.round(Number(s.power_kw||0)*10)/10,s.utility_recommendation?.action,s.utility_recommendation?.reason_fi,s.utility_recommendation?.reason_en]));
  if(sessionBody&&sessionKey!==lastSessionKey134u){sessionBody.innerHTML=sessionRows134u(sessions);lastSessionKey134u=sessionKey;}
  const sessionPanel=document.querySelector('.sessions-table')?.closest('.panel');
  setText134u(sessionPanel?.querySelector('.section-head > .badge'),`${sessions.length} ${tr134u('aktiivista istuntoa','active sessions')}`);

  // Event log: update only when event content changes.
  const events=d.events||[];
  const eventKey=JSON.stringify(events.map(e=>[e.at,e.type,e.session_ref,e.message_fi,e.message_en]));
  const eventList=document.querySelector('.event-list');
  if(eventList&&eventKey!==lastEventKey134u){eventList.innerHTML=eventRows134u(events);lastEventKey134u=eventKey;}
  return true;
}

async function pollStable134u(){
  if(pollBusy134u)return;
  pollBusy134u=true;
  try{
    const r=await fetch(`/api/charging/utility-summary?workshop=${encodeURIComponent(workshop134u)}`,{cache:'no-store',credentials:'same-origin'});
    if(!r.ok)return;
    const d=await r.json();
    if(updateStable134u(d)) window.dispatchEvent(new CustomEvent('pulse:utility-stable-update',{detail:d}));
  }catch{}finally{pollBusy134u=false;}
}

function startStable134u(){
  pollStable134u();
  nativeSetInterval134(pollStable134u,2000);
  const badge=document.getElementById('viewBadge');
  if(badge)badge.textContent='Utility / aggregator v1.3.4';
}

if(document.readyState==='complete') startStable134u();
else window.addEventListener('load',startStable134u,{once:true});
