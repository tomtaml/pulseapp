const p13=new URLSearchParams(location.search);
const v13Enabled=(p13.get('variant')||'fi-fleet')==='fi-fleet'&&p13.get('ops')==='1';
if(v13Enabled){
 document.body.classList.add('v13-utility-sync');
 const workshop=(p13.get('workshop')||'TAMPERE-S4').replace(/[^A-Za-z0-9_-]/g,'').slice(0,32)||'TAMPERE-S4';
 const fi=()=>document.documentElement.lang==='fi';
 const tr=(a,b)=>fi()?a:b;
 let summary=null,lastTick=Date.now(),busy=false;
 const screen=()=>document.querySelector('#screen');
 const step=()=>{const m=(screen()?.innerText||'').match(/([1-6])\s*\/\s*6/);return m?Number(m[1]):0;};
 function mySession(){const ref=window.PULSE_OPS_SESSION?.session_ref;return summary?.sessions?.find(s=>s.session_ref===ref)||null;}
 function recClass(a){if(String(a).includes('V2G')||String(a).includes('EXPORT'))return'v2g';if(String(a).includes('CHARGE')||String(a).includes('RESTORE'))return'charge';return'';}
 function renderSignal(){
  const n=step();if(![3,4].includes(n)||!summary?.utility_clock)return;
  const root=screen(),next=root?.querySelector("[data-action='next']");if(!root||!next)return;
  let el=root.querySelector('#v13GridSignal');if(!el){el=document.createElement('section');el.id='v13GridSignal';el.className='v13-grid-signal';next.parentElement?.insertAdjacentElement('beforebegin',el);}
  const c=summary.utility_clock,s=mySession(),r=s?.utility_recommendation||{};
  el.innerHTML=`<h3>${tr('Yhteinen hyötysähkösignaali','Shared utility signal')} · ${c.simulated_time}</h3><p>${tr(c.intent_fi,c.intent_en)||'—'}</p><div class="v13-grid-metrics"><div><span>${tr('Kysyntä','Demand')}</span><strong>${c.demand_index}/100</strong></div><div><span>RES</span><strong>${c.res_percent}%</strong></div><div><span>${tr('Hintasignaali','Price signal')}</span><strong>${c.price_c_kwh} c/kWh</strong></div><div><span>${tr('Seuraava jakso','Next interval')}</span><strong>${c.complete?'—':`${c.seconds_to_next}s`}</strong></div></div>${s?`<div class="v13-grid-rec ${recClass(r.action)}">${tr('Tämän ajoneuvon ohje','Vehicle recommendation')}: ${tr(r.reason_fi,r.reason_en)||r.action}</div>`:''}<div class="v13-grid-wait">${tr('Liikkumisvara ohittaa aina verkkopalvelun. Kaikki tämän työpajan QR-istunnot käyttävät samaa simuloitua kelloa.','Mobility reserve always overrides grid service. All workshop QR sessions use the same simulated clock.')}</div>`;
 }
 function syncLegacyClock(){
  const c=summary?.utility_clock;if(!c||step()!==4)return;
  const time=document.querySelector('.v1-adapter-cycle .v07-cycle-top > div:first-child strong');if(time)time.textContent=c.simulated_time;
  const slots=[...document.querySelectorAll('.v1-adapter-cycle .v07-market-slot')];slots.forEach((x,i)=>x.classList.toggle('active',i===c.step_index));
  const root=screen();const intro=[...root?.querySelectorAll(':scope > p')||[]].find(p=>/20 s|20 sek|75 minuut|75 min/i.test(p.textContent||''));
  if(intro)intro.textContent=tr('Kaikki työpajan ajoneuvot seuraavat samaa hyötysähkökelloa. Yksi 15 minuutin jakso kestää tässä demossa noin 20 sekuntia. Ajoneuvon SoC ja lähtövaraus ratkaisevat, voiko se ladata, osallistua V2G:hen vai vapautua ajoon.','All workshop vehicles follow the same utility clock. One simulated 15-minute interval lasts about 20 seconds. Vehicle SoC and protected reserve determine whether it charges, joins V2G or is released for mobility.');
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
    if(s.state==='READY_TO_DEPART')p({state:'CHARGING'});else if(s.state==='READY')p({state:'CHARGING'});else if(s.state==='V2G_ACTIVE'||s.state==='V2G_AVAILABLE')p({state:'RECHARGING'});else if(s.state==='RECHARGING'){};
  }else if(target==='V2G_AVAILABLE'){
    if(s.state==='READY')p({state:'CHARGING',power_kw:0,direction:'idle'});
    if(state()?.state==='CHARGING')p({state:'V2G_AVAILABLE',power_kw:0,direction:'idle'});
    else if(state()?.state==='RECHARGING')p({state:'READY_TO_DEPART',power_kw:0,direction:'idle',departure_ready:true});
  }else if(target==='V2G_ACTIVE'){
    if(s.state==='READY')p({state:'CHARGING',power_kw:0,direction:'idle'});
    if(state()?.state==='CHARGING')p({state:'V2G_AVAILABLE',power_kw:0,direction:'idle'});
    if(state()?.state==='V2G_AVAILABLE')p({state:'V2G_ACTIVE'});
  }else if(target==='RECHARGING'){
    if(s.state==='V2G_ACTIVE'||s.state==='V2G_AVAILABLE')p({state:'RECHARGING'});else if(s.state==='READY')p({state:'CHARGING'});
  }else if(target==='READY_TO_DEPART'){
    if(s.state==='READY')p({state:'CHARGING',power_kw:0,direction:'idle'});
    const q=state()?.state;if(['CHARGING','V2G_AVAILABLE','V2G_ACTIVE','RECHARGING'].includes(q))p({state:'READY_TO_DEPART',power_kw:0,direction:'idle',departure_ready:true});
  }
  const q=state();if(q&&q.state===target)publish(adapter,{...base,...patch,state:target});
 }
 function applyRecommendation(){
  if(step()!==4||busy)return;const adapter=window.PULSE_CHARGING?.adapter,sess=mySession(),c=summary?.utility_clock;if(!adapter||typeof adapter.publish!=='function'||!sess||!c)return;
  const rec=sess.utility_recommendation||{},snap=state();if(!snap||['FAULT','OVERRIDDEN','SESSION_ENDED'].includes(snap.state))return;
  const now=Date.now(),realSec=Math.min(4,Math.max(.25,(now-lastTick)/1000));lastTick=now;const simMin=realSec/Number(c.slot_real_seconds||20)*15;const battery=Number(sess.battery_kwh||75);let soc=Number(snap.soc_percent??sess.arrival_soc_percent??55),toV=Number(snap.energy_to_vehicle_kwh||0),toG=Number(snap.energy_to_grid_kwh||0);
  const charge=(kw,target,stateName='CHARGING')=>{const kwh=Math.min(Math.max(0,(target-soc)/100*battery),kw*simMin/60);soc=Math.min(target,soc+kwh/battery*100);toV+=kwh;moveTo(adapter,stateName,{soc_percent:Number(soc.toFixed(1)),power_kw:soc>=target-.15?0:kw,energy_to_vehicle_kwh:Number(toV.toFixed(2)),energy_to_grid_kwh:Number(toG.toFixed(2)),direction:soc>=target-.15?'idle':'grid_to_vehicle',departure_ready:false});};
  const exportV2G=(kw,target)=>{const kwh=Math.min(Math.max(0,(soc-target)/100*battery),kw*simMin/60);soc=Math.max(target,soc-kwh/battery*100);toG+=kwh;moveTo(adapter,'V2G_ACTIVE',{soc_percent:Number(soc.toFixed(1)),power_kw:soc<=target+.15?0:-kw,energy_to_vehicle_kwh:Number(toV.toFixed(2)),energy_to_grid_kwh:Number(toG.toFixed(2)),direction:soc<=target+.15?'idle':'vehicle_to_grid',departure_ready:false});};
  const target=Number(rec.target_soc_percent??sess.protected_soc_percent??65);
  if(['CHARGE_MOBILITY','CHARGE_BUFFER'].includes(rec.action))charge(22,target,'CHARGING');
  else if(rec.action==='EXPORT_V2G')exportV2G(18,target);
  else if(rec.action==='RESTORE_RESERVE')charge(22,target,'RECHARGING');
  else if(rec.action==='V2G_AVAILABLE'||rec.action==='HOLD_READY'||rec.action==='MOBILITY_PRIORITY')moveTo(adapter,'V2G_AVAILABLE',{soc_percent:soc,power_kw:0,direction:'idle',energy_to_vehicle_kwh:toV,energy_to_grid_kwh:toG});
  else if(rec.action==='READY_TO_DEPART')moveTo(adapter,'READY_TO_DEPART',{soc_percent:soc,power_kw:0,direction:'idle',energy_to_vehicle_kwh:toV,energy_to_grid_kwh:toG,departure_ready:true});
  const next=screen()?.querySelector("[data-action='next']");if(next)next.disabled=state()?.state!=='READY_TO_DEPART';
 }
 async function poll(){if(busy)return;busy=true;try{const r=await fetch(`/api/charging/utility-summary?workshop=${encodeURIComponent(workshop)}`,{cache:'no-store',credentials:'same-origin'});if(r.ok){summary=await r.json();window.PULSE_UTILITY_CLOCK=summary.utility_clock;window.dispatchEvent(new CustomEvent('pulse:utility-clock',{detail:summary}));renderSignal();syncLegacyClock();applyRecommendation();}}catch{}finally{busy=false;}}
 window.addEventListener('pulse:ops-session',()=>poll());window.addEventListener('pulse:charging-snapshot',()=>{renderSignal();syncLegacyClock();});
 const root=screen();if(root){let q=false;new MutationObserver(()=>{if(q)return;q=true;requestAnimationFrame(()=>{q=false;renderSignal();syncLegacyClock();if(step()===4){lastTick=Date.now();const next=screen()?.querySelector("[data-action='next']");if(next&&state()?.state!=='READY_TO_DEPART')next.disabled=true;}});}).observe(root,{childList:true,subtree:false});}
 poll();setInterval(poll,2000);
}
