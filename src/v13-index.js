import { DurableObject } from "cloudflare:workers";
import baseWorker from "./index.js";

const OPS_PROTOCOL = "pulse-session-v1";
const OPS_STATES = new Set(["DOCKING","ALIGNING","READY","CHARGING","V2G_AVAILABLE","V2G_ACTIVE","RECHARGING","READY_TO_DEPART","PAUSED","FAULT","OVERRIDDEN","SESSION_ENDED"]);
const OPS_DIRECTIONS = new Set(["idle","grid_to_vehicle","vehicle_to_grid"]);
const STALE_MS = 30 * 60 * 1000;
const ENDED_STALE_MS = 5 * 60 * 1000;
const SLOT_REAL_MS = 20 * 1000;
const enc = new TextEncoder();

const GRID_SLOTS = Object.freeze([
  {time:"15:30", demand:"moderate", demand_index:52, res:"high", res_percent:78, price_c_kwh:8, intent:"RES_CHARGE", intent_fi:"Lataa uusiutuvan sähkön aikana", intent_en:"Charge during high RES availability"},
  {time:"15:45", demand:"rising", demand_index:66, res:"high", res_percent:72, price_c_kwh:11, intent:"BUILD_BUFFER", intent_fi:"Rakenna lähtö- ja V2G-puskuri", intent_en:"Build mobility and V2G buffer"},
  {time:"16:00", demand:"high", demand_index:86, res:"lower", res_percent:43, price_c_kwh:17, intent:"PEAK_V2G", intent_fi:"Huipputuki: V2G kelpoisista ajoneuvoista", intent_en:"Peak support from eligible V2G vehicles"},
  {time:"16:15", demand:"high", demand_index:92, res:"lower", res_percent:36, price_c_kwh:14, intent:"PEAK_V2G", intent_fi:"Jatka lyhyttä V2G-huipputukea", intent_en:"Continue short V2G peak support"},
  {time:"16:30", demand:"easing", demand_index:70, res:"moderate", res_percent:55, price_c_kwh:11, intent:"RESTORE_RESERVE", intent_fi:"Palauta lähtöpuskuri", intent_en:"Restore departure buffer"},
  {time:"16:45", demand:"moderate", demand_index:58, res:"moderate", res_percent:64, price_c_kwh:9, intent:"DEPARTURE_READY", intent_fi:"Vapauta lähtövalmiit ajoneuvot", intent_en:"Release departure-ready vehicles"}
]);

function json(data,status=200){return new Response(JSON.stringify(data),{status,headers:{"content-type":"application/json; charset=utf-8","cache-control":"no-store, max-age=0","x-content-type-options":"nosniff","referrer-policy":"no-referrer","x-robots-tag":"noindex, nofollow, noarchive"}});}
function cleanCode(value,max=32){const v=String(value||"").replace(/[^A-Za-z0-9_-]/g,"").slice(0,max);return v||null;}
function num(value,min,max,fallback=0){const n=Number(value);return Number.isFinite(n)?Math.min(max,Math.max(min,n)):fallback;}
function rand(min,max){return Math.floor(Math.random()*(max-min+1))+min;}
function addMinutes(hhmm,mins){const [h,m]=hhmm.split(":").map(Number);const t=(h*60+m+mins)%(24*60);return `${String(Math.floor(t/60)).padStart(2,"0")}:${String(t%60).padStart(2,"0")}`;}
async function sha256(value){const b=await crypto.subtle.digest("SHA-256",enc.encode(value));return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,"0")).join("");}
function sameOrigin(request){const o=request.headers.get("origin");if(!o)return false;try{return new URL(request.url).origin===new URL(o).origin;}catch{return false;}}
function registryEnabled(env){return env.OPERATIONAL_REGISTRY_MODE==="mock" && env.CHARGING_BACKEND_MODE!=="api" && !!env.OPS_REGISTRY;}

const archetypes=[
  {key:"urban_turnaround",label_fi:"Kaupunkijakelun kierros",label_en:"Urban delivery round",route:[18,32],arrival:[44,62],need:[30,38],floor:[50,56],dwell:[55,80],flex:[8,12]},
  {key:"depot_wave",label_fi:"Terminaalin jakeluaalto",label_en:"Depot delivery wave",route:[35,55],arrival:[34,52],need:[38,48],floor:[58,64],dwell:[90,140],flex:[10,16]},
  {key:"municipal_callout",label_fi:"Kunnossapidon valmiusajo",label_en:"Municipal service call-out",route:[20,40],arrival:[50,72],need:[35,45],floor:[65,72],dwell:[35,70],flex:[6,10]},
  {key:"long_depot",label_fi:"Pidempi varikkopysähdys",label_en:"Long depot dwell",route:[15,28],arrival:[28,46],need:[25,35],floor:[45,52],dwell:[180,260],flex:[12,18]}
];

function newScenario(){
  const a=archetypes[rand(0,archetypes.length-1)];
  const routeNeed=rand(a.need[0],a.need[1]);
  const protectedSoc=Math.min(78,Math.max(rand(a.floor[0],a.floor[1]),routeNeed+10));
  const arrivalSoc=rand(a.arrival[0],a.arrival[1]);
  const dwell=rand(a.dwell[0],a.dwell[1]);
  const battery=75;
  const chargeNeedKwh=Math.max(0,(protectedSoc-arrivalSoc)/100*battery);
  const chargeNeedMin=Math.ceil(chargeNeedKwh/22*60);
  const v2gWindow=Math.max(0,Math.min(35,dwell-chargeNeedMin-15));
  const availabilityStart="15:30";
  const availabilityEnd=addMinutes(availabilityStart,dwell);
  return {archetype:a.key,archetype_label_fi:a.label_fi,archetype_label_en:a.label_en,route_km:rand(a.route[0],a.route[1]),route_need_soc_percent:routeNeed,protected_soc_percent:protectedSoc,arrival_soc_percent:arrivalSoc,dwell_minutes:dwell,battery_kwh:battery,max_wireless_power_kw:22,estimated_charge_to_reserve_minutes:chargeNeedMin,v2g_window_minutes:v2gWindow,v2g_eligible:v2gWindow>=8,availability_start:availabilityStart,availability_end:availabilityEnd,departure_time:addMinutes(availabilityEnd,15),flexibility_kw:rand(a.flex[0],a.flex[1]),res_alignment_pct:rand(58,86)};
}
function publicSession(s){const {token_hash,...pub}=s;return pub;}
function recommendation(session,clock){
  if(["DOCKING","ALIGNING"].includes(session.state)) return {action:"DOCK",target_state:session.state,reason_fi:"Kohdistus ennen energiapalvelua",reason_en:"Dock before energy service",target_soc_percent:session.protected_soc_percent};
  if(session.state==="FAULT") return {action:"FAULT_HOLD",target_state:"FAULT",reason_fi:"Turvallinen keskeytys",reason_en:"Safe fault hold",target_soc_percent:session.protected_soc_percent};
  if(["OVERRIDDEN","SESSION_ENDED"].includes(session.state)) return {action:"HOLD",target_state:session.state,reason_fi:"Istunto ei ole verkkopalvelussa",reason_en:"Session is outside grid service",target_soc_percent:session.protected_soc_percent};
  const soc=Number(session.soc_percent||0), reserve=Number(session.protected_soc_percent||0), slot=clock.step_index;
  const buffer=Math.min(85,reserve+(session.v2g_eligible?8:4));
  if(soc<reserve) return {action:"CHARGE_MOBILITY",target_state:"CHARGING",reason_fi:"Liikkumisvara ensin",reason_en:"Mobility reserve first",target_soc_percent:reserve};
  if(slot<=1){
    if(soc<buffer) return {action:"CHARGE_BUFFER",target_state:"CHARGING",reason_fi:"RES-painotteinen lataus ja V2G-puskuri",reason_en:"RES-aligned charging and V2G buffer",target_soc_percent:buffer};
    return {action:session.v2g_eligible?"V2G_AVAILABLE":"HOLD",target_state:session.v2g_eligible?"V2G_AVAILABLE":"READY",reason_fi:session.v2g_eligible?"Jousto valmiina huippua varten":"Liikkumisvara turvattu",reason_en:session.v2g_eligible?"Flexibility ready for peak":"Mobility reserve protected",target_soc_percent:buffer};
  }
  if(slot===2){
    const firstPeakFloor=Math.min(85,reserve+4);
    if(session.v2g_eligible&&soc>firstPeakFloor+0.05) return {action:"EXPORT_V2G",target_state:"V2G_ACTIVE",reason_fi:"Korkea kysyntä: käytä V2G-puskurin ylempää osaa",reason_en:"High demand: use the upper part of the V2G buffer",target_soc_percent:firstPeakFloor};
    return {action:"MOBILITY_PRIORITY",target_state:"PAUSED",reason_fi:"Ensimmäisen huippujakson V2G-puskuri käytetty — liikkuminen etusijalla",reason_en:"First peak-slot V2G buffer used — mobility first",target_soc_percent:firstPeakFloor};
  }
  if(slot===3){
    const secondPeakFloor=Math.min(85,reserve+2);
    if(session.v2g_eligible&&soc>secondPeakFloor+0.05) return {action:"EXPORT_V2G",target_state:"V2G_ACTIVE",reason_fi:"Kysyntä on yhä korkea: käytä jäljellä olevaa turvallista V2G-puskuria",reason_en:"Demand remains high: use the remaining safe V2G buffer",target_soc_percent:secondPeakFloor};
    return {action:"MOBILITY_PRIORITY",target_state:"PAUSED",reason_fi:"Turvallinen V2G-puskuri käytetty — liikkuminen etusijalla",reason_en:"Safe V2G buffer used — mobility first",target_soc_percent:secondPeakFloor};
  }
  if(slot===4){
    const restore=Math.min(85,reserve+8);
    if(soc<restore) return {action:"RESTORE_RESERVE",target_state:"RECHARGING",reason_fi:"Palauta lähtö- ja V2G-puskuri ennen vapautusta",reason_en:"Restore departure and V2G buffer before release",target_soc_percent:restore};
    return {action:"HOLD_READY",target_state:"PAUSED",reason_fi:"Lähtö- ja V2G-puskuri palautettu",reason_en:"Departure and V2G buffer restored",target_soc_percent:restore};
  }
  if(soc>=reserve) return {action:"READY_TO_DEPART",target_state:"READY_TO_DEPART",reason_fi:"Ajoneuvo voidaan vapauttaa",reason_en:"Vehicle can be released",target_soc_percent:reserve};
  return {action:"CHARGE_MOBILITY",target_state:"CHARGING",reason_fi:"Lataa vähintään lähtövaraukseen",reason_en:"Charge to protected departure reserve",target_soc_percent:reserve};
}

export class WorkshopSessionRegistry extends DurableObject {
  constructor(ctx,env){super(ctx,env);this.ctx=ctx;}
  async appendEvent(type,message_fi,message_en,session_ref=null,detail={}){
    const events=await this.ctx.storage.get("events")||[];
    events.unshift({at:new Date().toISOString(),type,session_ref,message_fi,message_en,...detail});
    await this.ctx.storage.put("events",events.slice(0,30));
  }
  async activeSessions(){const all=await this.ctx.storage.list({prefix:"session:"});return [...all.values()].filter(s=>s.state!=="SESSION_ENDED");}
  async ensureClock(startIfNeeded=false){
    let c=await this.ctx.storage.get("utility_clock");
    if(!c){c={origin_ms:null,running:false,last_step:-1};await this.ctx.storage.put("utility_clock",c);}
    if(startIfNeeded&&!c.running){c={origin_ms:Date.now(),running:true,last_step:0};await this.ctx.storage.put("utility_clock",c);await this.appendEvent("UTILITY_CLOCK","Yhteinen hyötysähkökello käynnistyi 15:30","Shared utility clock started at 15:30",null,{step_index:0});}
    const now=Date.now();
    const raw=c.running&&c.origin_ms?Math.floor((now-c.origin_ms)/SLOT_REAL_MS):0;
    const step=Math.max(0,Math.min(GRID_SLOTS.length-1,raw));
    if(c.running&&step!==c.last_step){c={...c,last_step:step};await this.ctx.storage.put("utility_clock",c);const slot=GRID_SLOTS[step];await this.appendEvent("UTILITY_SLOT",`Hyötysähköjakso ${slot.time}: ${slot.intent_fi}`,`Utility interval ${slot.time}: ${slot.intent_en}`,null,{step_index:step});}
    const slot=GRID_SLOTS[step];
    const elapsed=c.running&&c.origin_ms?Math.max(0,now-c.origin_ms):0;
    const inSlot=elapsed-step*SLOT_REAL_MS;
    const remaining=step===GRID_SLOTS.length-1?0:Math.max(0,Math.ceil((SLOT_REAL_MS-inSlot)/1000));
    return {running:c.running,step_index:step,simulated_time:slot.time,seconds_to_next:remaining,slot_real_seconds:SLOT_REAL_MS/1000,complete:step===GRID_SLOTS.length-1,...slot};
  }
  async prune(){const now=Date.now();const all=await this.ctx.storage.list({prefix:"session:"});const deletes=[];for(const [k,s] of all){const age=now-Number(s.last_seen_ms||s.created_at_ms||0);const ttl=s.state==="SESSION_ENDED"?ENDED_STALE_MS:STALE_MS;if(age>ttl)deletes.push(k);}if(deletes.length)await this.ctx.storage.delete(deletes);}
  async register(){
    await this.prune();const active=await this.activeSessions();if(active.length===0){await this.ctx.storage.put("utility_clock",{origin_ms:Date.now(),running:true,last_step:0});await this.ctx.storage.put("events",[]);await this.appendEvent("UTILITY_CLOCK","Uusi työpajajakso alkoi klo 15:30","New workshop cycle started at 15:30",null,{step_index:0});}else await this.ensureClock(true);
    const scenario=newScenario();const sessionRef=`S-${crypto.randomUUID().slice(0,8).toUpperCase()}`;const token=crypto.randomUUID()+crypto.randomUUID();const now=Date.now();
    const session={protocol_version:OPS_PROTOCOL,session_ref:sessionRef,source:"qr-mock",state:"DOCKING",observed_at:new Date(now).toISOString(),created_at_ms:now,last_seen_ms:now,soc_percent:scenario.arrival_soc_percent,power_kw:0,energy_to_vehicle_kwh:0,energy_to_grid_kwh:0,direction:"idle",departure_ready:false,fault_code:null,...scenario,token_hash:await sha256(token)};
    await this.ctx.storage.put(`session:${sessionRef}`,session);await this.appendEvent("SESSION",`${sessionRef} saapui: ${scenario.archetype_label_fi}`,`${sessionRef} arrived: ${scenario.archetype_label_en}`,sessionRef,{state:"DOCKING"});
    const clock=await this.ensureClock(true);return json({ok:true,session:{...publicSession(session),utility_recommendation:recommendation(session,clock)},utility_clock:clock,update_token:token});
  }
  async update(body){
    await this.prune();const ref=cleanCode(body.session_ref,64),token=String(body.update_token||"");if(!ref||!token)return json({ok:false,error:"Missing session credentials."},400);const key=`session:${ref}`;const current=await this.ctx.storage.get(key);if(!current)return json({ok:false,error:"Session not found or expired."},404);if(await sha256(token)!==current.token_hash)return json({ok:false,error:"Session update rejected."},403);
    const snap=body.snapshot&&typeof body.snapshot==="object"?body.snapshot:{};const state=OPS_STATES.has(snap.state)?snap.state:current.state;const now=Date.now();
    const next={...current,state,observed_at:new Date(now).toISOString(),last_seen_ms:now,soc_percent:num(snap.soc_percent,0,100,current.soc_percent),power_kw:num(snap.power_kw,-22,22,current.power_kw),energy_to_vehicle_kwh:num(snap.energy_to_vehicle_kwh,0,250,current.energy_to_vehicle_kwh),energy_to_grid_kwh:num(snap.energy_to_grid_kwh,0,250,current.energy_to_grid_kwh),direction:OPS_DIRECTIONS.has(snap.direction)?snap.direction:current.direction,departure_ready:snap.departure_ready===true,fault_code:state==="FAULT"?String(snap.fault_code||"WORKSHOP_FAULT").replace(/[^A-Za-z0-9_-]/g,"").slice(0,48):null};
    await this.ctx.storage.put(key,next);if(state!==current.state)await this.appendEvent("SESSION_STATE",`${ref}: ${current.state} → ${state}`,`${ref}: ${current.state} → ${state}`,ref,{from:current.state,to:state});
    const clock=await this.ensureClock(true);return json({ok:true,session:{...publicSession(next),utility_recommendation:recommendation(next,clock)},utility_clock:clock});
  }
  async summary(){
    await this.prune();const activeRaw=await this.activeSessions();const clock=await this.ensureClock(activeRaw.length>0);const active=activeRaw.map(s=>({...publicSession(s),utility_recommendation:recommendation(s,clock)})).sort((a,b)=>String(a.session_ref).localeCompare(String(b.session_ref)));
    const importPower=active.reduce((v,s)=>v+Math.max(0,Number(s.power_kw)||0),0),exportPower=active.reduce((v,s)=>v+Math.max(0,-(Number(s.power_kw)||0)),0),energyIn=active.reduce((v,s)=>v+(Number(s.energy_to_vehicle_kwh)||0),0),energyOut=active.reduce((v,s)=>v+(Number(s.energy_to_grid_kwh)||0),0);
    const flex=active.filter(s=>["V2G_AVAILABLE","EXPORT_V2G"].includes(s.utility_recommendation?.action)).reduce((v,s)=>v+(Number(s.flexibility_kw)||0),0);const weighted=active.filter(s=>["CHARGING","RECHARGING"].includes(s.state));const res=weighted.length?weighted.reduce((v,s)=>v+(Number(s.res_alignment_pct)||0),0)/weighted.length:0;const state_counts={};for(const s of active)state_counts[s.state]=(state_counts[s.state]||0)+1;
    const events=(await this.ctx.storage.get("events")||[]).slice(0,12);
    return json({protocol_version:OPS_PROTOCOL,source:"shared-utility-clock",registry_connected:true,observed_at:new Date().toISOString(),utility_clock:clock,grid_series:GRID_SLOTS,sessions:active,events,aggregate:{active_sessions:active.length,import_power_kw:importPower,export_power_kw:exportPower,net_power_kw:importPower-exportPower,energy_to_vehicle_kwh:energyIn,energy_to_grid_kwh:energyOut,peak_shaving_kw:exportPower,res_aligned_share_pct:res,flexibility_available_kw:flex,state_counts}});
  }
  async fetch(request){const u=new URL(request.url);if(request.method==="POST"&&u.pathname==="/register")return this.register();if(request.method==="POST"&&u.pathname==="/update"){let b={};try{b=await request.json();}catch{return json({ok:false,error:"Malformed JSON."},400);}return this.update(b);}if(request.method==="GET"&&u.pathname==="/summary")return this.summary();return json({ok:false,error:"Not found."},404);}
}

async function readSmallJson(request){const raw=await request.text();if(enc.encode(raw).byteLength>12000)throw new Error("too-large");return raw?JSON.parse(raw):{};}
function registryStub(env,workshop){const id=env.OPS_REGISTRY.idFromName(workshop);return env.OPS_REGISTRY.get(id);}

export default {async fetch(request,env,ctx){const url=new URL(request.url);
  if(url.pathname==="/api/charging/utility-summary"&&request.method==="GET"){if(!registryEnabled(env))return json({ok:false,error:"Operational mock registry is disabled."},503);const workshop=cleanCode(url.searchParams.get("workshop"));if(!workshop)return json({ok:false,error:"Invalid workshop code."},400);return registryStub(env,workshop).fetch("https://registry/summary");}
  if(url.pathname==="/api/ops/session/register"&&request.method==="POST"){if(!registryEnabled(env))return json({ok:false,error:"Operational mock registry is disabled."},503);if(!sameOrigin(request))return json({ok:false,error:"Origin rejected."},403);let body;try{body=await readSmallJson(request);}catch{return json({ok:false,error:"Invalid request."},400);}const workshop=cleanCode(body.workshop_code);if(!workshop)return json({ok:false,error:"Invalid workshop code."},400);return registryStub(env,workshop).fetch("https://registry/register",{method:"POST"});}
  if(url.pathname==="/api/ops/session/update"&&request.method==="POST"){if(!registryEnabled(env))return json({ok:false,error:"Operational mock registry is disabled."},503);if(!sameOrigin(request))return json({ok:false,error:"Origin rejected."},403);let body;try{body=await readSmallJson(request);}catch{return json({ok:false,error:"Invalid request."},400);}const workshop=cleanCode(body.workshop_code);if(!workshop)return json({ok:false,error:"Invalid workshop code."},400);return registryStub(env,workshop).fetch("https://registry/update",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(body)});}
  return baseWorker.fetch(request,env,ctx);
}};
