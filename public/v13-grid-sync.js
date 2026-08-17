const p13=new URLSearchParams(location.search);
const v13Enabled=(p13.get('variant')||'fi-fleet')==='fi-fleet'&&p13.get('ops')==='1';
if(v13Enabled){
 document.body.classList.add('v13-utility-sync');
 const workshop=(p13.get('workshop')||'TAMPERE-S4').replace(/[^A-Za-z0-9_-]/g,'').slice(0,32)||'TAMPERE-S4';
 const fi=()=>document.documentElement.lang==='fi';
 const tr=(a,b)=>fi()?a:b;
 let summary=null,lastTick=Date.now(),pollBusy=false;
 const screen=()=>document.querySelector('#screen');
 const step=()=>{const m=(screen()?.innerText||'').match(/([1-6])\s*\/\s*6/);return m?Number(m[1]):0;};
 function mySession(){const ref=window.PULSE_OPS_SESSION?.session_ref;return summary?.sessions?.find(s=>s.session_ref===ref)||null;}
 function recClass(a){if(String(a).includes('V2G')||String(a).includes('EXPORT'))return'v2g';if(String(a).includes('CHARGE')||String(a).includes('RESTORE'))return'charge';if(String(a).includes('READY'))return'ready';return'';}
 function renderSignal(){
  const n=step();if(![3,4].includes(n)||!summary?.utility_clock)return;
  const root=screen(),next=root?.querySelector("[data-action='next']");if(!root||!next)return;
  let el=root.querySelector('#v13GridSignal');if(!el){el=document.createElement('section');el.id='v13GridSignal';next.parentElement?.insertAdjacentElement('beforebegin',el);}
  const c=summary.utility_clock,s=mySession(),r=s?.utility_recommendation||{};
  if(n===3){
   el.className='v13-grid-signal v13-decision-signal';
   const buffer=s?Math.round(Number(s.soc_percent)-Number(s.protected_soc_percent)):0;
   el.innerHTML=`<div class="v13-signal-head"><strong>${c.simulated_time} · ${tr('verkon pyyntö','grid signal')}</strong><span>${tr(c.intent_fi,c.intent_en)||'—'}</span></div>${s?`<div class="v13-driver-essentials"><div><span>${tr('Akun varaus','Battery')}</span><strong>${Math.round(s.soc_percent)}%</strong></div><div><span>${tr('Suojattu raja','Protected')}</span><strong>${Math.round(s.protected_soc_percent)}%</strong></div><div><span>${tr('Puskuri','Buffer')}</span><strong>${buffer>0?'+':''}${buffer}%</strong></div></div><div class="v13-grid-rec ${recClass(r.action)}"><span>${tr('Tämä ajoneuvo','This vehicle')}</span><strong>${tr(r.reason_fi,r.reason_en)||r.action}</strong></div>`:''}<small>${tr('Liikkumisvara ohittaa aina verkkopalvelun. Tarkemmat kysyntä-, RES- ja hintatiedot näkyvät energiajärjestelmän näkymässä.','Mobility reserve always overrides grid service. Detailed demand, RES and price information remains in the utility view.')}</small>`;
  }else{
   el.className='v13-grid-signal v13-cycle-signal';
   el.innerHTML=`<div class="v13-cycle-clock"><strong>${c.simulated_time}</strong><span>${tr(c.intent_fi,c.intent_en)||'—'}</span>${s?`<b class="${recClass(r.action)}">${tr(r.reason_fi,r.reason_en)||r.action}</b>`:''}</div>`;
  }
 }
 function syncLegacyClock(){
  const c=summary?.utility_clock;if(!c||step()!==4)return;
  const time=document.querySelector('.v1-adapter-cycle .v07-cycle-top > div:first-child strong');if(time)time.textContent=c.simulated_time;
  const root=screen();const intro=[...root?.querySelectorAll(':scope > p')||[]].find(p=>/20 s|20 sek|75 minuut|75 min|hyötysähkökello|utility clock/i.test(p.textContent||''));
  if(intro)intro.textContent=tr('Seuraa vain ajoneuvon tilaa: akun varausta, energian suuntaa ja lähtövalmiutta. Taustalla yhteinen hyötysähkökello ohjaa latausta ja V2G:tä liikkumisrajojen sisällä.','Follow the vehicle state: battery level, energy direction and departure readiness. In the background, the shared utility clock coordinates charging and V2G within mobility constraints.');
 }
 function publish(adapter,patch){try{return adapter.publish(patch);}catch{return null;}}
 function state(){return window.PULSE_CHARGING_LAST_SNAPSHOT||window.PULSE_CHARGING?.adapter?.getSnapshot?.()||null;}
 function moveTo(adapter,target,patch={}){
  let s=state();if(!s)return;
  const base={protected_soc_percent:mySession()?.protected_soc_percent??s.protected_soc_percent};
  if(s.state==='FAULT'||s.state==='OVERRIDDEN'||s.state==='SESSION_ENDED')return;
  if(s.state===target){publish(adapter,{...base,...patch,state:target});return;}
  const p=x=>{publish(adapter,{...base,...x});s=state();};
  if(target==='CHARGING'){
    if(s.state==='READY_TO_DEPART'||s.state==='READY'||s.state==='PAUSED')p({state:'CHARGING'});else if(s.state==='V2G_ACTIVE'||s.state==='V2G_AVAILABLE')p({state:'RECHARGING'});
  }else if(target==='V2G_AVAILABLE'){
    if(s.state==='PAUSED')p({state:'V2G_AVAILABLE',power_kw:0,direction:'idle'});
    else if(s.state==='READY')p({state:'CHARGING',power_kw:0,direction:'idle'});
    if(state()?.state==='CHARGING')p({state:'V2G_AVAILABLE',power_kw:0,direction:'idle'});
  }else if(target==='V2G_ACTIVE'){
    if(s.state==='PAUSED')p({state:'V2G_AVAILABLE',power_kw:0,direction:'idle'});
    else if(s.state==='READY')p({state:'CHARGING',power_kw:0,direction:'idle'});
    if(state()?.state==='CHARGING')p({state:'V2G_AVAILABLE',power_kw:0,direction:'idle'});
    if(state()?.state==='V2G_AVAILABLE')p({state:'V2G_ACTIVE'});
  }else if(target==='RECHARGING'){
    if(s.state==='PAUSED')p({state:'RECHARGING'});
    else if(s.state==='V2G_ACTIVE'||s.state==='V2G_AVAILABLE')p({state:'RECHARGING'});
    else if(s.state==='READY'||s.state==='READY_TO_DEPART')p({state:'CHARGING'});
  }else if(target==='READY_TO_DEPART'){
    if(s.state==='PAUSED')p({state:'READY_TO_DEPART',power_kw:0,direction:'idle',departure_ready:true});
    else if(s.state==='READY')p({state:'CHARGING',power_kw:0,direction:'idle'});
    const q=state()?.state;if(['CHARGING','V2G_AVAILABLE','V2G_ACTIVE','RECHARGING'].includes(q))p({state:'READY_TO_DEPART',power_kw:0,direction:'idle',departure_ready:true});
  }
  const q=state();if(q&&q.state===target)publish(adapter,{...base,...patch,state:target});
 }
 function ensureResearchGate(){
  if(step()!==4)return;
  const root=screen();if(!root)return;
  let field=root.querySelector('#v13EnergyClarity');
  if(!field){
    field=document.createElement('fieldset');field.id='v13EnergyClarity';field.className='v13-energy-clarity';
    field.innerHTML=`<legend>${tr('Kuinka selkeä energian suunta oli tässä jaksossa?','How clear was the direction of energy flow in this session?')}</legend><div class="likert-anchors"><span>${tr('Täysin eri mieltä','Strongly disagree')}</span><span>${tr('Täysin samaa mieltä','Strongly agree')}</span></div><div class="likert" role="radiogroup" aria-label="energy_flow_clarity">${[1,2,3,4,5].map(v=>`<label class="likert-option"><input type="radio" name="energy_flow_clarity" value="${v}"><span>${v}</span></label>`).join('')}</div>`;
    const signal=root.querySelector('#v13GridSignal'),actions=root.querySelector('.actions');
    (signal||actions)?.insertAdjacentElement('beforebegin',field);
    field.querySelectorAll('input[name="energy_flow_clarity"]').forEach(i=>i.addEventListener('change',()=>updateNextGate()));
  }
  const ready=['READY_TO_DEPART','OVERRIDDEN'].includes(state()?.state);
  field.style.display=ready?'':'none';
  const legacy=root.querySelector('.v07-cycle-card [data-action="run-cycle"]');
  if(legacy&&!legacy.disabled&&!legacy.dataset.v13Bridge){legacy.dataset.v13Bridge='1';legacy.click();}
  updateNextGate();
 }
 function updateNextGate(){
  if(step()!==4)return;
  const root=screen(),next=root?.querySelector("[data-action='next']");if(!next)return;
  const ready=['READY_TO_DEPART','OVERRIDDEN'].includes(state()?.state);
  const answered=!!root.querySelector('input[name="energy_flow_clarity"]:checked');
  next.disabled=!(ready&&answered);
 }
 function applyRecommendation(){
  if(step()!==4)return;const adapter=window.PULSE_CHARGING?.adapter,sess=mySession(),c=summary?.utility_clock;if(!adapter||typeof adapter.publish!=='function'||!sess||!c)return;
  const rec=sess.utility_recommendation||{},snap=state();if(!snap||['FAULT','OVERRIDDEN','SESSION_ENDED'].includes(snap.state))return;
  const now=Date.now(),realSec=Math.min(4,Math.max(.25,(now-lastTick)/1000));lastTick=now;const simMin=realSec/Number(c.slot_real_seconds||15)*15;const battery=Number(sess.battery_kwh||75);let soc=Number(snap.soc_percent??sess.arrival_soc_percent??55),toV=Number(snap.energy_to_vehicle_kwh||0),toG=Number(snap.energy_to_grid_kwh||0);
  const charge=(kw,target,stateName='CHARGING')=>{const kwh=Math.min(Math.max(0,(target-soc)/100*battery),kw*simMin/60);soc=Math.min(target,soc+kwh/battery*100);toV+=kwh;moveTo(adapter,stateName,{soc_percent:Number(soc.toFixed(1)),power_kw:soc>=target-.15?0:kw,energy_to_vehicle_kwh:Number(toV.toFixed(2)),energy_to_grid_kwh:Number(toG.toFixed(2)),direction:soc>=target-.15?'idle':'grid_to_vehicle',departure_ready:false});};
  const exportV2G=(kw,target)=>{const kwh=Math.min(Math.max(0,(soc-target)/100*battery),kw*simMin/60);soc=Math.max(target,soc-kwh/battery*100);toG+=kwh;moveTo(adapter,'V2G_ACTIVE',{soc_percent:Number(soc.toFixed(1)),power_kw:soc<=target+.15?0:-kw,energy_to_vehicle_kwh:Number(toV.toFixed(2)),energy_to_grid_kwh:Number(toG.toFixed(2)),direction:soc<=target+.15?'idle':'vehicle_to_grid',departure_ready:false});};
  const protectedSoc=Number(sess.protected_soc_percent??65);
  let action=rec.action,target=Number(rec.target_soc_percent??protectedSoc);
  if(Number(c.step_index)===4){
    const restore=Math.min(85,protectedSoc+8);target=restore;
    action=soc<restore-.1?'RESTORE_RESERVE':'HOLD_READY';
  }else if(Number(c.step_index)===5&&soc>=protectedSoc){action='READY_TO_DEPART';target=protectedSoc;}
  if(['CHARGE_MOBILITY','CHARGE_BUFFER'].includes(action))charge(22,target,'CHARGING');
  else if(action==='EXPORT_V2G')exportV2G(Number(c.step_index)===3?12:18,target);
  else if(action==='RESTORE_RESERVE')charge(22,target,'RECHARGING');
  else if(action==='V2G_AVAILABLE'||action==='HOLD_READY'||action==='MOBILITY_PRIORITY')moveTo(adapter,'PAUSED',{soc_percent:soc,power_kw:0,direction:'idle',energy_to_vehicle_kwh:toV,energy_to_grid_kwh:toG});
  else if(action==='READY_TO_DEPART')moveTo(adapter,'READY_TO_DEPART',{soc_percent:soc,power_kw:0,direction:'idle',energy_to_vehicle_kwh:toV,energy_to_grid_kwh:toG,departure_ready:true});
  ensureResearchGate();
 }
 async function poll(){if(pollBusy)return;pollBusy=true;try{const r=await fetch(`/api/charging/utility-summary?workshop=${encodeURIComponent(workshop)}`,{cache:'no-store',credentials:'same-origin'});if(r.ok){summary=await r.json();window.PULSE_UTILITY_CLOCK=summary.utility_clock;window.dispatchEvent(new CustomEvent('pulse:utility-clock',{detail:summary}));renderSignal();syncLegacyClock();applyRecommendation();ensureResearchGate();}}catch{}finally{pollBusy=false;}}
 window.addEventListener('pulse:ops-session',()=>poll());window.addEventListener('pulse:charging-snapshot',()=>{renderSignal();syncLegacyClock();ensureResearchGate();});
 const root=screen();if(root){let q=false;new MutationObserver(()=>{if(q)return;q=true;requestAnimationFrame(()=>{q=false;renderSignal();syncLegacyClock();if(step()===4){lastTick=Date.now();ensureResearchGate();}});}).observe(root,{childList:true,subtree:false});}
 poll();setInterval(poll,2000);
}
