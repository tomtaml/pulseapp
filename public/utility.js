const qs = new URLSearchParams(location.search);
let language = qs.get('lang') === 'en' ? 'en' : 'fi';
const workshop = (qs.get('workshop') || 'TAMPERE-S4').replace(/[^A-Za-z0-9_-]/g,'').slice(0,32) || 'TAMPERE-S4';
let autoRefresh = true;
let timer = null;

const txt = {
  fi: {
    eyebrow:'PULSE v1.1 · energiajärjestelmän näkymä',
    title:'Langattoman latauksen ja V2G:n koontinäkymä',
    intro:'Seuraa useita samanaikaisia latausistuntoja, energian suuntaa, V2G-joustoa, huipputehon leikkausta ja uusiutuvaan sähköön ajoitettua latausta.',
    participant:'Osallistujasovellus', footer:'Työpajaprototyyppi · vain operatiivisia koontitietoja · ei tutkimusvastauksia',
    live:'Simuloitu yhteinen tilannekuva', sessions:'aktiivista istuntoa', importPower:'Latausteho verkosta', exportPower:'V2G-teho verkkoon', netPower:'Kaluston nettoteho', peak:'Huipputehon leikkaus', res:'RES-ajotuksen osuus', energyIn:'Energia ajoneuvoihin', energyOut:'Energia verkkoon', flexibility:'Käytettävissä oleva jousto',
    flow:'Tämän hetken tehotase', grid:'Sähköverkko', fleet:'PULSE-istunnot', sessionTitle:'Samanaikaiset istunnot', sessionLead:'Synteettiset istuntotunnisteet demonstroivat tulevaa yhteistä session registryä.', ref:'Istunto', state:'Tila', soc:'SoC', power:'Teho', direction:'Suunta', imported:'Ajoneuvoon', exported:'Verkkoon',
    charge:'Lataus', v2g:'V2G aktiivinen', available:'V2G käytettävissä', ready:'Lähtövalmis', recharging:'Jälkilataus', idle:'Valmis', toVehicle:'verkko → auto', toGrid:'auto → verkko', none:'—',
    context:'15 min sähköjärjestelmän konteksti', contextLead:'Kuvitteellinen aikajana näyttää, miten latausta voidaan painottaa RES-rikkaisiin jaksoihin ja V2G:tä korkeamman kysynnän jaksoihin.', demand:'kysyntä', resLabel:'RES', price:'hinta',
    peakNote:'Huipputehon leikkaus on tässä V2G-viennin aiheuttama kuormituksen alenema verrattuna samaan lataustilanteeseen ilman V2G:tä.',
    resNote:'RES-ajotus on käyttöliittymän suunnitteluindikaattori, ei todiste yksittäisen elektronin alkuperästä. Kenttäpilotissa tämä tulisi laskea todellisesta aikaleimatusta energiamix-/RES-signaalista.',
    safety:'Tietoturvaraja: tämä näkymä ei lue SUS-, luottamus-, rooli- tai muita tutkimusvastauksia. Tässä versiossa ei myöskään näytetä VIN-, rekisteri-, käyttäjä- tai tarkkoja sijaintitietoja.',
    placeholder:'Jaettu live-rekisteri ei ole vielä kytketty. Näkymä käyttää palvelimen API-sopimusta, jos se tulee saataville; siihen asti arvot ovat synteettinen monen istunnon mock.',
    refresh:'Päivitä nyt', pause:'Pysäytä automaattipäivitys', resume:'Jatka automaattipäivitystä', source:'lähde', commands:'komennot lukittu', research:'aineistonkeruu lukittu'
  },
  en: {
    eyebrow:'PULSE v1.1 · energy-system view', title:'Wireless charging and V2G aggregate view', intro:'Follow multiple concurrent charging sessions, energy direction, V2G flexibility, peak shaving and charging aligned with renewable availability.', participant:'Participant app', footer:'Workshop prototype · operational aggregates only · no research responses', live:'Simulated shared operational view', sessions:'active sessions', importPower:'Charging power from grid', exportPower:'V2G power to grid', netPower:'Fleet net power', peak:'Peak-shaving contribution', res:'RES-aligned charging share', energyIn:'Energy to vehicles', energyOut:'Energy to grid', flexibility:'Available flexibility', flow:'Current power balance', grid:'Electricity grid', fleet:'PULSE sessions', sessionTitle:'Concurrent sessions', sessionLead:'Synthetic session references demonstrate the future shared session registry.', ref:'Session', state:'State', soc:'SoC', power:'Power', direction:'Direction', imported:'To vehicle', exported:'To grid', charge:'Charging', v2g:'V2G active', available:'V2G available', ready:'Ready to depart', recharging:'Recharging', idle:'Ready', toVehicle:'grid → vehicle', toGrid:'vehicle → grid', none:'—', context:'15-minute electricity-system context', contextLead:'The illustrative timeline shows how charging can favour RES-rich periods and V2G can support higher-demand periods.', demand:'demand', resLabel:'RES', price:'price', peakNote:'Peak shaving here is the load reduction created by V2G export compared with the same charging situation without V2G.', resNote:'RES alignment is a scheduling indicator, not proof of electricity provenance. In the field pilot it should be calculated from real timestamped energy-mix/RES signals.', safety:'Security boundary: this view does not read SUS, trust, role or other research responses. It also shows no VIN, registration, user or precise-location data.', placeholder:'The shared live registry is not connected yet. The view will use a server utility-summary API when available; until then it shows a synthetic multi-session mock.', refresh:'Refresh now', pause:'Pause auto refresh', resume:'Resume auto refresh', source:'source', commands:'commands locked', research:'research collection locked'
  }
};

const t = key => txt[language][key];
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const fmt = (n,d=1) => Number(n).toFixed(d);

function mockSessions(phase) {
  const sets = [
    [
      ['S-101','CHARGING',69,18,8.2,0],['S-102','V2G_AVAILABLE',71,0,9.6,0],['S-103','READY_TO_DEPART',70,0,12.6,3.6],['S-104','CHARGING',63,11,5.4,0],['S-105','CHARGING',67,10,7.2,0],['S-106','V2G_AVAILABLE',70,0,8.1,0]
    ],
    [
      ['S-101','CHARGING',71,18,9.4,0],['S-102','V2G_ACTIVE',69,-14,9.6,2.1],['S-103','READY_TO_DEPART',70,0,12.6,3.6],['S-104','V2G_ACTIVE',68,-12,6.1,1.7],['S-105','V2G_AVAILABLE',70,0,8.4,0],['S-106','CHARGING',66,11,8.9,0]
    ],
    [
      ['S-101','V2G_ACTIVE',69,-12,10.2,1.8],['S-102','V2G_ACTIVE',67,-14,9.6,3.2],['S-103','READY_TO_DEPART',70,0,12.6,3.6],['S-104','V2G_ACTIVE',66,-10,6.1,2.3],['S-105','RECHARGING',67,14,9.1,0],['S-106','READY_TO_DEPART',70,0,10.4,2.0]
    ],
    [
      ['S-101','RECHARGING',70,16,12.6,1.8],['S-102','READY_TO_DEPART',70,0,12.4,3.2],['S-103','READY_TO_DEPART',70,0,12.6,3.6],['S-104','RECHARGING',69,11,8.8,2.3],['S-105','READY_TO_DEPART',70,0,11.2,0],['S-106','READY_TO_DEPART',70,0,10.4,2.0]
    ]
  ];
  return sets[phase].map(([session_ref,state,soc_percent,power_kw,energy_to_vehicle_kwh,energy_to_grid_kwh]) => ({
    session_ref,state,soc_percent,protected_soc_percent:65,power_kw,energy_to_vehicle_kwh,energy_to_grid_kwh,
    direction: power_kw > 0 ? 'grid_to_vehicle' : power_kw < 0 ? 'vehicle_to_grid' : 'idle', departure_ready:state==='READY_TO_DEPART'
  }));
}

function aggregate(sessions) {
  const importPower = sessions.reduce((s,x)=>s+Math.max(0,x.power_kw),0);
  const exportPower = sessions.reduce((s,x)=>s+Math.max(0,-x.power_kw),0);
  const energyIn = sessions.reduce((s,x)=>s+x.energy_to_vehicle_kwh,0);
  const energyOut = sessions.reduce((s,x)=>s+x.energy_to_grid_kwh,0);
  const available = sessions.filter(x=>['V2G_AVAILABLE','V2G_ACTIVE'].includes(x.state)).length;
  return { active_sessions:sessions.length, import_power_kw:importPower, export_power_kw:exportPower, net_power_kw:importPower-exportPower,
    energy_to_vehicle_kwh:energyIn, energy_to_grid_kwh:energyOut, peak_shaving_kw:exportPower, res_aligned_share_pct:72,
    flexibility_available_kw: available*12 + exportPower };
}

const slots = [
  {time:'15:30',demand:['keskitaso','moderate'],res:['paljon','high'],price:8,charge:42,export:0},
  {time:'15:45',demand:['nouseva','rising'],res:['paljon','high'],price:11,charge:39,export:0},
  {time:'16:00',demand:['korkea','high'],res:['vähemmän','lower'],price:17,charge:18,export:26},
  {time:'16:15',demand:['korkea','high'],res:['vähemmän','lower'],price:14,charge:14,export:36},
  {time:'16:30',demand:['laskeva','easing'],res:['keskitaso','moderate'],price:11,charge:27,export:0},
  {time:'16:45',demand:['keskitaso','moderate'],res:['keskitaso','moderate'],price:9,charge:0,export:0}
];

function buildMockSummary() {
  const phase = Math.floor(Date.now()/7000)%4;
  const sessions = mockSessions(phase);
  return {protocol_version:'pulse-session-v1',source:'mock-aggregate',registry_connected:false,observed_at:new Date().toISOString(),workshop,
    phase_index:phase,sessions,aggregate:aggregate(sessions),slots};
}

async function getSummary() {
  try {
    const r = await fetch(`/api/charging/utility-summary?workshop=${encodeURIComponent(workshop)}`,{cache:'no-store',credentials:'same-origin'});
    if(r.ok){const data=await r.json(); if(data && Array.isArray(data.sessions) && data.aggregate) return data;}
  } catch {}
  return buildMockSummary();
}

function stateLabel(state){return ({CHARGING:t('charge'),V2G_ACTIVE:t('v2g'),V2G_AVAILABLE:t('available'),READY_TO_DEPART:t('ready'),RECHARGING:t('recharging'),READY:t('idle')})[state]||state;}
function stateClass(state){if(state==='V2G_ACTIVE')return 'v2g';if(['CHARGING','RECHARGING'].includes(state))return 'charge';if(state==='READY_TO_DEPART')return 'ready';return '';}
function directionLabel(direction){return direction==='grid_to_vehicle'?t('toVehicle'):direction==='vehicle_to_grid'?t('toGrid'):t('none');}

function metric(label,value,small='',cls='') {return `<div class="metric ${cls}"><span>${esc(label)}</span><strong>${esc(value)}</strong>${small?`<small>${esc(small)}</small>`:''}</div>`;}

function render(summary, config, caps) {
  const a=summary.aggregate;
  document.documentElement.lang=language;
  document.getElementById('eyebrow').textContent=t('eyebrow');
  document.getElementById('title').textContent=t('title');
  document.getElementById('intro').textContent=t('intro');
  document.getElementById('participantLink').textContent=t('participant');
  document.getElementById('footerText').textContent=t('footer');
  document.getElementById('viewBadge').textContent='Utility / aggregator v1.1 preview';
  document.getElementById('safetyBadge').textContent=`${summary.source==='mock-aggregate'?'Mock':'API'} · read-only`;
  document.getElementById('statusStrip').innerHTML=`<span>${esc(workshop)}</span><span>pulse-session-v1</span><span>${esc(t('source'))}: ${esc(summary.source)}</span><span>${esc(t('commands'))}</span><span>${esc(t('research'))}</span>`;
  const currentSlot = summary.phase_index===0?1:summary.phase_index===1?2:summary.phase_index===2?3:4;
  document.getElementById('dashboard').innerHTML=`
    <section class="metric-grid">
      ${metric(t('sessions'),a.active_sessions,'','flex')}
      ${metric(t('importPower'),`${fmt(a.import_power_kw,0)} kW`)}
      ${metric(t('exportPower'),`${fmt(a.export_power_kw,0)} kW`,'','good')}
      ${metric(t('netPower'),`${a.net_power_kw>=0?'+':''}${fmt(a.net_power_kw,0)} kW`)}
      ${metric(t('peak'),`${fmt(a.peak_shaving_kw,0)} kW`,language==='fi'?'vs. sama tilanne ilman V2G:tä':'vs. same situation without V2G','good')}
      ${metric(t('res'),`${fmt(a.res_aligned_share_pct,0)} %`,language==='fi'?'kuvitteellinen ajotusindikaattori':'illustrative scheduling indicator','good')}
      ${metric(t('energyIn'),`${fmt(a.energy_to_vehicle_kwh)} kWh`)}
      ${metric(t('energyOut'),`${fmt(a.energy_to_grid_kwh)} kWh`,'','good')}
    </section>
    <section class="panel">
      <div class="section-head"><div><h2>${esc(t('flow'))}</h2><p>${esc(t('live'))} · ${new Date(summary.observed_at).toLocaleTimeString(language==='fi'?'fi-FI':'en-GB')}</p></div><span class="badge">${esc(summary.registry_connected?'shared registry':'registry placeholder')}</span></div>
      <div class="power-flow"><div class="power-node"><span>${esc(t('grid'))}</span><strong>${fmt(a.import_power_kw,0)} kW ↓</strong><small>${esc(t('importPower'))}</small></div><div class="power-arrow">⇄</div><div class="power-node"><span>${esc(t('fleet'))}</span><strong>${fmt(a.export_power_kw,0)} kW ↑</strong><small>${esc(t('exportPower'))}</small></div></div>
      <div class="bars">
        <div class="bar-row"><span>${esc(t('peak'))}</span><div class="bar-track"><div class="bar-fill" style="width:${Math.min(100,a.peak_shaving_kw/50*100)}%"></div></div><strong>${fmt(a.peak_shaving_kw,0)} kW</strong></div>
        <div class="bar-row"><span>${esc(t('res'))}</span><div class="bar-track"><div class="bar-fill" style="width:${Math.min(100,a.res_aligned_share_pct)}%"></div></div><strong>${fmt(a.res_aligned_share_pct,0)}%</strong></div>
        <div class="bar-row"><span>${esc(t('flexibility'))}</span><div class="bar-track"><div class="bar-fill" style="width:${Math.min(100,a.flexibility_available_kw/70*100)}%"></div></div><strong>${fmt(a.flexibility_available_kw,0)} kW</strong></div>
      </div>
    </section>
    <section class="panel">
      <div class="section-head"><div><h2>${esc(t('sessionTitle'))}</h2><p>${esc(t('sessionLead'))}</p></div><span class="badge">${summary.sessions.length} ${esc(t('sessions'))}</span></div>
      <table class="session-table"><thead><tr><th>${esc(t('ref'))}</th><th>${esc(t('state'))}</th><th>${esc(t('soc'))}</th><th>${esc(t('power'))}</th><th>${esc(t('direction'))}</th><th>${esc(t('imported'))}</th><th>${esc(t('exported'))}</th></tr></thead><tbody>
      ${summary.sessions.map(s=>`<tr><td><strong>${esc(s.session_ref)}</strong></td><td><span class="state-pill ${stateClass(s.state)}">${esc(stateLabel(s.state))}</span></td><td>${fmt(s.soc_percent,0)}% <small>≥ ${fmt(s.protected_soc_percent,0)}%</small></td><td>${s.power_kw>0?'+':''}${fmt(s.power_kw,0)} kW</td><td class="dir ${s.direction==='vehicle_to_grid'?'export':s.direction==='grid_to_vehicle'?'import':''}">${esc(directionLabel(s.direction))}</td><td>${fmt(s.energy_to_vehicle_kwh)} kWh</td><td>${fmt(s.energy_to_grid_kwh)} kWh</td></tr>`).join('')}
      </tbody></table>
    </section>
    <section class="panel">
      <div class="section-head"><div><h2>${esc(t('context'))}</h2><p>${esc(t('contextLead'))}</p></div><span class="badge">15 min</span></div>
      <div class="timeline">${summary.slots.map((s,i)=>`<div class="slot ${i===currentSlot?'active':''}"><strong>${s.time}</strong><span>${esc(t('demand'))}: ${esc(s.demand[language==='fi'?0:1])}</span><span>${esc(t('resLabel'))}: ${esc(s.res[language==='fi'?0:1])}</span><span>${s.price} c/kWh*</span><span>↓ ${s.charge} kW · ↑ ${s.export} kW</span></div>`).join('')}</div>
      <div class="note">${esc(t('peakNote'))}</div><div class="note warning" style="margin-top:12px">${esc(t('resNote'))}</div>
    </section>
    <section class="panel"><div class="note">${esc(t('safety'))}</div><div class="note warning" style="margin-top:12px">${esc(t('placeholder'))}</div><div class="controls" style="margin-top:16px"><button id="refreshBtn" type="button">${esc(t('refresh'))}</button><button id="autoBtn" type="button">${esc(autoRefresh?t('pause'):t('resume'))}</button></div></section>`;
  document.getElementById('refreshBtn')?.addEventListener('click', refresh);
  document.getElementById('autoBtn')?.addEventListener('click',()=>{autoRefresh=!autoRefresh; schedule(); refresh();});
}

async function refresh(){
  const dashboard=document.getElementById('dashboard');
  try{
    const [summary,config,caps]=await Promise.all([
      getSummary(),
      fetch('/api/config',{cache:'no-store'}).then(r=>r.ok?r.json():{}).catch(()=>({})),
      fetch('/api/charging/capabilities',{cache:'no-store'}).then(r=>r.ok?r.json():{}).catch(()=>({}))
    ]);
    render(summary,config,caps);
  }catch(e){dashboard.innerHTML=`<section class="panel"><p>${esc(e.message||'Dashboard unavailable')}</p></section>`;}
}

function schedule(){if(timer)clearInterval(timer);timer=null;if(autoRefresh)timer=setInterval(refresh,7000);}

document.getElementById('languageBtn').addEventListener('click',()=>{language=language==='fi'?'en':'fi';const url=new URL(location.href);url.searchParams.set('lang',language);history.replaceState({},'',url);refresh();});
document.getElementById('participantLink').href=`/?variant=fi-fleet&workshop=${encodeURIComponent(workshop)}&demo=1&dev=1`;
refresh();schedule();
