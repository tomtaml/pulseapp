const qv1 = new URLSearchParams(location.search);

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
    const [config, caps, state] = await Promise.all([
      fetch('/api/config', {cache:'no-store'}).then(r=>r.json()),
      fetch('/api/charging/capabilities', {cache:'no-store'}).then(r=>r.json()),
      fetch('/api/charging/session/demo', {cache:'no-store'}).then(r=>r.json())
    ]);
    panel.innerHTML = `<h2>PULSE v1 technical core</h2>
      <p><strong>Protocol:</strong> ${caps.protocol || '—'} · <strong>backend:</strong> ${caps.backend_mode || '—'} · <strong>commands:</strong> ${caps.commands_enabled ? 'enabled' : 'locked'}</p>
      <p><strong>Research collection:</strong> ${config.collection_enabled ? 'enabled' : 'locked'} · <strong>schema:</strong> ${config.research_schema_version || '—'} · <strong>app:</strong> ${config.app_version || '—'}</p>
      <p><strong>Demo session:</strong> ${state.state || '—'} · SoC ${state.soc_percent ?? '—'}% · protected ${state.protected_soc_percent ?? '—'}% · direction ${state.direction || '—'}</p>`;
  } catch {
    panel.innerHTML = '<h2>PULSE v1 technical core</h2><p>Diagnostics unavailable.</p>';
  }
}

addCoreBadge();
addDevPanel();
