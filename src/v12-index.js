import { DurableObject } from "cloudflare:workers";
import baseWorker from "./index.js";

const OPS_PROTOCOL = "pulse-session-v1";
const OPS_STATES = new Set(["DOCKING","ALIGNING","READY","CHARGING","V2G_AVAILABLE","V2G_ACTIVE","RECHARGING","READY_TO_DEPART","FAULT","OVERRIDDEN","SESSION_ENDED"]);
const OPS_DIRECTIONS = new Set(["idle","grid_to_vehicle","vehicle_to_grid"]);
const STALE_MS = 30 * 60 * 1000;
const ENDED_STALE_MS = 5 * 60 * 1000;
const enc = new TextEncoder();

function json(data,status=200){
  return new Response(JSON.stringify(data),{status,headers:{
    "content-type":"application/json; charset=utf-8","cache-control":"no-store, max-age=0",
    "x-content-type-options":"nosniff","referrer-policy":"no-referrer","x-robots-tag":"noindex, nofollow, noarchive"
  }});
}
function cleanCode(value,max=32){const v=String(value||"").replace(/[^A-Za-z0-9_-]/g,"").slice(0,max);return v||null;}
function num(value,min,max,fallback=0){const n=Number(value);return Number.isFinite(n)?Math.min(max,Math.max(min,n)):fallback;}
function int(value,min,max,fallback=0){return Math.round(num(value,min,max,fallback));}
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
  return {
    archetype:a.key,archetype_label_fi:a.label_fi,archetype_label_en:a.label_en,
    route_km:rand(a.route[0],a.route[1]),route_need_soc_percent:routeNeed,protected_soc_percent:protectedSoc,
    arrival_soc_percent:arrivalSoc,dwell_minutes:dwell,battery_kwh:battery,max_wireless_power_kw:22,
    estimated_charge_to_reserve_minutes:chargeNeedMin,v2g_window_minutes:v2gWindow,v2g_eligible:v2gWindow>=8,
    availability_start:availabilityStart,availability_end:availabilityEnd,departure_time:addMinutes(availabilityEnd,15),
    flexibility_kw:rand(a.flex[0],a.flex[1]),res_alignment_pct:rand(58,86)
  };
}
function publicSession(s){
  const {token_hash,...pub}=s; return pub;
}
function slots(){return [
  {time:"15:30",demand:"moderate",res:"high",price_c_kwh:8},
  {time:"15:45",demand:"rising",res:"high",price_c_kwh:11},
  {time:"16:00",demand:"high",res:"lower",price_c_kwh:17},
  {time:"16:15",demand:"high",res:"lower",price_c_kwh:14},
  {time:"16:30",demand:"easing",res:"moderate",price_c_kwh:11},
  {time:"16:45",demand:"moderate",res:"moderate",price_c_kwh:9}
];}

export class WorkshopSessionRegistry extends DurableObject {
  constructor(ctx,env){super(ctx,env);this.ctx=ctx;}
  async prune(){
    const now=Date.now(); const all=await this.ctx.storage.list({prefix:"session:"}); const deletes=[];
    for(const [k,s] of all){const age=now-Number(s.last_seen_ms||s.created_at_ms||0);const ttl=s.state==="SESSION_ENDED"?ENDED_STALE_MS:STALE_MS;if(age>ttl)deletes.push(k);}
    if(deletes.length)await this.ctx.storage.delete(deletes);
  }
  async register(){
    await this.prune(); const scenario=newScenario(); const sessionRef=`S-${crypto.randomUUID().slice(0,8).toUpperCase()}`; const token=crypto.randomUUID()+crypto.randomUUID(); const now=Date.now();
    const session={protocol_version:OPS_PROTOCOL,session_ref:sessionRef,source:"qr-mock",state:"DOCKING",observed_at:new Date(now).toISOString(),created_at_ms:now,last_seen_ms:now,
      soc_percent:scenario.arrival_soc_percent,power_kw:0,energy_to_vehicle_kwh:0,energy_to_grid_kwh:0,direction:"idle",departure_ready:false,fault_code:null,
      ...scenario,token_hash:await sha256(token)};
    await this.ctx.storage.put(`session:${sessionRef}`,session);
    return json({ok:true,session:publicSession(session),update_token:token});
  }
  async update(body){
    await this.prune(); const ref=cleanCode(body.session_ref,64); const token=String(body.update_token||""); if(!ref||!token)return json({ok:false,error:"Missing session credentials."},400);
    const key=`session:${ref}`; const current=await this.ctx.storage.get(key); if(!current)return json({ok:false,error:"Session not found or expired."},404);
    if(await sha256(token)!==current.token_hash)return json({ok:false,error:"Session update rejected."},403);
    const snap=body.snapshot&&typeof body.snapshot==="object"?body.snapshot:{}; const state=OPS_STATES.has(snap.state)?snap.state:current.state; const now=Date.now();
    const next={...current,state,observed_at:new Date(now).toISOString(),last_seen_ms:now,
      soc_percent:num(snap.soc_percent,0,100,current.soc_percent),power_kw:num(snap.power_kw,-22,22,current.power_kw),
      energy_to_vehicle_kwh:num(snap.energy_to_vehicle_kwh,0,250,current.energy_to_vehicle_kwh),energy_to_grid_kwh:num(snap.energy_to_grid_kwh,0,250,current.energy_to_grid_kwh),
      direction:OPS_DIRECTIONS.has(snap.direction)?snap.direction:current.direction,departure_ready:snap.departure_ready===true,
      fault_code:state==="FAULT"?String(snap.fault_code||"WORKSHOP_FAULT").replace(/[^A-Za-z0-9_-]/g,"").slice(0,48):null};
    await this.ctx.storage.put(key,next); return json({ok:true,session:publicSession(next)});
  }
  async summary(){
    await this.prune(); const all=await this.ctx.storage.list({prefix:"session:"}); const sessions=[...all.values()].map(publicSession).sort((a,b)=>String(a.session_ref).localeCompare(String(b.session_ref)));
    const active=sessions.filter(s=>s.state!=="SESSION_ENDED"); const importPower=active.reduce((v,s)=>v+Math.max(0,Number(s.power_kw)||0),0); const exportPower=active.reduce((v,s)=>v+Math.max(0,-(Number(s.power_kw)||0)),0);
    const energyIn=active.reduce((v,s)=>v+(Number(s.energy_to_vehicle_kwh)||0),0); const energyOut=active.reduce((v,s)=>v+(Number(s.energy_to_grid_kwh)||0),0);
    const flex=active.filter(s=>["READY","V2G_AVAILABLE","V2G_ACTIVE"].includes(s.state)&&s.v2g_eligible).reduce((v,s)=>v+(Number(s.flexibility_kw)||0),0);
    const weighted=active.filter(s=>["CHARGING","RECHARGING"].includes(s.state)); const res=weighted.length?weighted.reduce((v,s)=>v+(Number(s.res_alignment_pct)||0),0)/weighted.length:0;
    const state_counts={}; for(const s of active)state_counts[s.state]=(state_counts[s.state]||0)+1;
    return json({protocol_version:OPS_PROTOCOL,source:"shared-mock-registry",registry_connected:true,observed_at:new Date().toISOString(),sessions:active,
      aggregate:{active_sessions:active.length,import_power_kw:importPower,export_power_kw:exportPower,net_power_kw:importPower-exportPower,energy_to_vehicle_kwh:energyIn,energy_to_grid_kwh:energyOut,peak_shaving_kw:exportPower,res_aligned_share_pct:res,flexibility_available_kw:flex,state_counts},phase_index:Math.floor(Date.now()/7000)%4,slots:slots()});
  }
  async fetch(request){const u=new URL(request.url);if(request.method==="POST"&&u.pathname==="/register")return this.register();if(request.method==="POST"&&u.pathname==="/update"){let b={};try{b=await request.json();}catch{return json({ok:false,error:"Malformed JSON."},400);}return this.update(b);}if(request.method==="GET"&&u.pathname==="/summary")return this.summary();return json({ok:false,error:"Not found."},404);}
}

async function readSmallJson(request){const raw=await request.text();if(enc.encode(raw).byteLength>12000)throw new Error("too-large");return raw?JSON.parse(raw):{};}
function registryStub(env,workshop){const id=env.OPS_REGISTRY.idFromName(workshop);return env.OPS_REGISTRY.get(id);}

export default {async fetch(request,env,ctx){
  const url=new URL(request.url);
  if(url.pathname==="/api/charging/utility-summary"&&request.method==="GET"){
    if(!registryEnabled(env))return json({ok:false,error:"Operational mock registry is disabled."},503);
    const workshop=cleanCode(url.searchParams.get("workshop"));if(!workshop)return json({ok:false,error:"Invalid workshop code."},400);
    return registryStub(env,workshop).fetch("https://registry/summary");
  }
  if(url.pathname==="/api/ops/session/register"&&request.method==="POST"){
    if(!registryEnabled(env))return json({ok:false,error:"Operational mock registry is disabled."},503);if(!sameOrigin(request))return json({ok:false,error:"Origin rejected."},403);
    let body;try{body=await readSmallJson(request);}catch{return json({ok:false,error:"Invalid request."},400);}const workshop=cleanCode(body.workshop_code);if(!workshop)return json({ok:false,error:"Invalid workshop code."},400);
    return registryStub(env,workshop).fetch("https://registry/register",{method:"POST"});
  }
  if(url.pathname==="/api/ops/session/update"&&request.method==="POST"){
    if(!registryEnabled(env))return json({ok:false,error:"Operational mock registry is disabled."},503);if(!sameOrigin(request))return json({ok:false,error:"Origin rejected."},403);
    let body;try{body=await readSmallJson(request);}catch{return json({ok:false,error:"Invalid request."},400);}const workshop=cleanCode(body.workshop_code);if(!workshop)return json({ok:false,error:"Invalid workshop code."},400);
    return registryStub(env,workshop).fetch("https://registry/update",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(body)});
  }
  return baseWorker.fetch(request,env,ctx);
}};
