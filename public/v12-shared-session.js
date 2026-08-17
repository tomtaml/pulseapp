const p12=new URLSearchParams(location.search);
const v12Variant=p12.get("variant")||"fi-fleet";
const v12Workshop=(p12.get("workshop")||"DEMO").replace(/[^A-Za-z0-9_-]/g,"").slice(0,32)||"DEMO";
const v12Enabled=v12Variant==="fi-fleet"&&p12.get("ops")==="1";

if(v12Enabled){
  const storageKey=`pulse-ops-v12:${v12Workshop}`;
  let creds=null, scenario=null, currentState="DOCKING", lastSent="", alignmentReady=false, faultSent=false, ended=false, busy=false;
  try{const saved=JSON.parse(sessionStorage.getItem(storageKey)||"null");if(saved?.session_ref&&saved?.update_token){creds=saved;scenario=saved.scenario||null;currentState=saved.scenario?.state||"DOCKING";alignmentReady=!['DOCKING','ALIGNING'].includes(currentState);faultSent=currentState==='FAULT';ended=currentState==='SESSION_ENDED';}}catch{}

  const cleanSnapshot=s=>({
    state:s?.state||currentState,soc_percent:Number.isFinite(Number(s?.soc_percent))?Number(s.soc_percent):(scenario?.arrival_soc_percent??55),
    power_kw:Number(s?.power_kw||0),energy_to_vehicle_kwh:Number(s?.energy_to_vehicle_kwh||0),energy_to_grid_kwh:Number(s?.energy_to_grid_kwh||0),
    direction:["idle","grid_to_vehicle","vehicle_to_grid"].includes(s?.direction)?s.direction:"idle",departure_ready:s?.departure_ready===true,fault_code:s?.fault_code||null
  });
  function persist(){if(!creds)return;creds.scenario={...scenario,state:currentState};try{sessionStorage.setItem(storageKey,JSON.stringify(creds));}catch{}}
  function publishSession(){persist();window.PULSE_OPS_SESSION={...scenario,session_ref:creds?.session_ref||null,state:currentState};window.dispatchEvent(new CustomEvent("pulse:ops-session",{detail:window.PULSE_OPS_SESSION}));renderDev();}
  function renderDev(){
    if(p12.get("dev")!=="1"||!creds||!scenario)return;
    let el=document.getElementById("v12OpsPanel");const app=document.querySelector("#app");if(!app)return;
    if(!el){el=document.createElement("section");el.id="v12OpsPanel";el.className="card";const core=document.getElementById("v1DevPanel");core?.insertAdjacentElement("afterend",el)||app.prepend(el);}
    const label=document.documentElement.lang==="fi"?scenario.archetype_label_fi:scenario.archetype_label_en;
    el.innerHTML=`<h2>PULSE v1.2 shared mock session</h2><p><strong>${creds.session_ref}</strong> · ${label} · <strong>${currentState}</strong></p><p>arrival SoC ${scenario.arrival_soc_percent}% · route estimate ${scenario.route_need_soc_percent}% · protected ${scenario.protected_soc_percent}% · route ${scenario.route_km} km · dwell ${scenario.dwell_minutes} min</p><p>estimated charge to reserve ${scenario.estimated_charge_to_reserve_minutes} min · V2G window ${scenario.v2g_window_minutes} min · ${scenario.v2g_eligible?"V2G eligible":"mobility priority / no V2G window"}</p>`;
  }
  async function register(){
    const r=await fetch("/api/ops/session/register",{method:"POST",headers:{"content-type":"application/json"},credentials:"same-origin",cache:"no-store",body:JSON.stringify({workshop_code:v12Workshop})});
    const d=await r.json();if(!r.ok||!d.ok)throw new Error(d.error||"Session registration failed");
    scenario=d.session;currentState=d.session.state||"DOCKING";creds={session_ref:d.session.session_ref,update_token:d.update_token,scenario:{...d.session,state:currentState}};persist();publishSession();
  }
  async function send(snapshot){
    if(!creds||busy||ended)return;const s=cleanSnapshot(snapshot);const signature=JSON.stringify(s);if(signature===lastSent)return;busy=true;
    try{const r=await fetch("/api/ops/session/update",{method:"POST",headers:{"content-type":"application/json"},credentials:"same-origin",cache:"no-store",body:JSON.stringify({workshop_code:v12Workshop,session_ref:creds.session_ref,update_token:creds.update_token,snapshot:s})});const d=await r.json();if(r.status===404){sessionStorage.removeItem(storageKey);creds=null;scenario=null;currentState="DOCKING";alignmentReady=false;faultSent=false;ended=false;await register();return;}if(r.ok&&d.ok){lastSent=signature;currentState=d.session.state;scenario={...scenario,...d.session};alignmentReady=!['DOCKING','ALIGNING'].includes(currentState);faultSent=currentState==='FAULT'||faultSent;ended=currentState==='SESSION_ENDED';publishSession();}}
    catch{}finally{busy=false;}
  }
  function stepFromScreen(){const text=document.querySelector("#screen")?.innerText||"";const m=text.match(/([1-6])\s*\/\s*6/);return {n:m?Number(m[1]):0,text};}
  function syncScreen(){
    if(!creds)return;const {n,text}=stepFromScreen();
    if(n===1&&!alignmentReady&&currentState==="DOCKING")send({state:"ALIGNING",soc_percent:scenario?.arrival_soc_percent,direction:"idle"});
    if(n===1&&!alignmentReady&&(/Kohdistus hyväksytty|Alignment accepted|Langaton lataus voidaan aloittaa|Wireless charging can start/i.test(text))){alignmentReady=true;const adapter=window.PULSE_CHARGING?.adapter;if(adapter?.publish){try{adapter.publish({state:"READY",soc_percent:scenario.arrival_soc_percent,protected_soc_percent:scenario.protected_soc_percent,power_kw:0,direction:"idle",energy_to_vehicle_kwh:0,energy_to_grid_kwh:0,departure_ready:false});}catch{}}send({state:"READY",soc_percent:scenario.arrival_soc_percent,direction:"idle"});}
    if(n===5&&!faultSent){faultSent=true;const last=window.PULSE_CHARGING_LAST_SNAPSHOT||{};send({...last,state:"FAULT",power_kw:0,direction:"idle",fault_code:"WINTER_ALIGNMENT_LOSS"});}
    if(/Demo valmis|Demo complete|Kiitos|Thank you/i.test(text)&&!ended){const last=window.PULSE_CHARGING_LAST_SNAPSHOT||{};send({...last,state:"SESSION_ENDED",power_kw:0,direction:"idle"});}
  }
  window.addEventListener("pulse:charging-snapshot",e=>{const s=e.detail;if(!alignmentReady)return;if(["CHARGING","V2G_AVAILABLE","V2G_ACTIVE","RECHARGING","PAUSED","READY_TO_DEPART","OVERRIDDEN"].includes(s?.state))send(s);});
  window.addEventListener("pulse:charging-ready",()=>{syncScreen();renderDev();});
  const screen=document.querySelector("#screen");if(screen){let queued=false;new MutationObserver(()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;syncScreen();});}).observe(screen,{childList:true,subtree:true,characterData:true});}
  (async()=>{try{if(!creds)await register();else{scenario=creds.scenario;publishSession();await send({state:currentState,soc_percent:scenario?.soc_percent??scenario?.arrival_soc_percent,direction:scenario?.direction||"idle",power_kw:scenario?.power_kw||0,energy_to_vehicle_kwh:scenario?.energy_to_vehicle_kwh||0,energy_to_grid_kwh:scenario?.energy_to_grid_kwh||0,departure_ready:scenario?.departure_ready===true,fault_code:scenario?.fault_code||null});}syncScreen();setInterval(()=>send(window.PULSE_CHARGING_LAST_SNAPSHOT&&alignmentReady?window.PULSE_CHARGING_LAST_SNAPSHOT:{state:currentState,soc_percent:scenario?.soc_percent??scenario?.arrival_soc_percent,direction:scenario?.direction||"idle",power_kw:scenario?.power_kw||0,energy_to_vehicle_kwh:scenario?.energy_to_vehicle_kwh||0,energy_to_grid_kwh:scenario?.energy_to_grid_kwh||0}),60000);}catch(e){if(p12.get("dev")==="1")console.warn("PULSE ops registry unavailable",e);}})();
}
