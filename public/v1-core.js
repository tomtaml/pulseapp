const qv1 = new URLSearchParams(location.search);
let devConfig = null;
let devCaps = null;
let devState = null;

async function addCoreBadge() {
  const top = document.querySelector('.brand-block');
  if (!top || document.getElementById('v1CoreBadge')) return;
  let config = {};
  try { config = await fetch('/api/config', { cache:'no-store', credentials:'same-origin' }).then(r => r.json()); } catch {}
  const badge = document.createElement('span');
  badge.id = 'v1CoreBadge';
  badge.className = 'status-badge';
  badge.textContent = `Core v1.0 · ${config.charging_backend_mode || 'mock'} · ${config.collection_enabled ? 'collection on' : 'collection locked'}`;
  top.append(badge);
}

function renderDevPanel() {
  const panel=document.getElementById('v1DevPanel');
  if(!panel||!devConfig||!devCaps||!devState)return;
  panel.innerHTML = `<h2>PULSE v1 technical core</h2>
    <p><strong>Protocol:</strong> ${devCaps.protocol || '—'} · <strong>backend:</strong> ${devCaps.backend_mode || '—'} · <strong>commands:</strong> ${devCaps.commands_enabled ? 'enabled' : 'locked'}</p>
    <p><strong>Research collection:</strong> ${devConfig.collection_enabled ? 'enabled' : 'locked'} · <strong>schema:</strong> ${devConfig.research_schema_version || '—'} · <strong>app:</strong> ${devConfig.app_version || '—'}</p>
    <p><strong>Demo session:</strong> ${devState.state || '—'} · SoC ${devState.soc_percent ?? '—'}% · protected ${devState.protected_soc_percent ?? '—'}% · direction ${devState.direction || '—'} · to vehicle ${Number(devState.energy_to_vehicle_kwh || 0).toFixed(1)} kWh · to grid ${Number(devState.energy_to_grid_kwh || 0).toFixed(1)} kWh</p>`;
}

async function addDevPanel() {
  if (qv1.get('dev') !== '1' || document.getElementById('v1DevPanel')) return;
  const app = document.querySelector('#app');
  if (!app) return;
  const panel = document.createElement('section');
  panel.id = 'v1DevPanel';
  panel.className = 'card';
  panel.setAttribute('aria-label', 'PULSE v1 technical diagnostics');
  panel.innerHTML = '<h2>PULSE v1 technical core</h2><p>Loading normalized charging state…</p>';
  app.prepend(panel);
  try {
    [devConfig, devCaps, devState] = await Promise.all([
      fetch('/api/config', {cache:'no-store'}).then(r=>r.json()),
      fetch('/api/charging/capabilities', {cache:'no-store'}).then(r=>r.json()),
      fetch('/api/charging/session/demo', {cache:'no-store'}).then(r=>r.json())
    ]);
    if(window.PULSE_CHARGING_LAST_SNAPSHOT)devState=window.PULSE_CHARGING_LAST_SNAPSHOT;
    renderDevPanel();
  } catch {
    panel.innerHTML = '<h2>PULSE v1 technical core</h2><p>Diagnostics unavailable.</p>';
  }
}

window.addEventListener('pulse:charging-snapshot',event=>{
  devState=event.detail;
  renderDevPanel();
});

addCoreBadge();
addDevPanel();
