import sharedWorker from "./v13-index.js";
import {WorkshopSessionRegistry} from "./v131-index.js";
export {WorkshopSessionRegistry};

function out(data,status=200){return new Response(JSON.stringify(data),{status,headers:{"content-type":"application/json; charset=utf-8","cache-control":"no-store, max-age=0","x-content-type-options":"nosniff","referrer-policy":"no-referrer","x-robots-tag":"noindex, nofollow, noarchive"}});}
function cleanCode(value,max=32){const v=String(value||"").replace(/[^A-Za-z0-9_-]/g,"").slice(0,max);return v||null;}
function sameOrigin(request){
  let requestOrigin;try{requestOrigin=new URL(request.url).origin;}catch{return false;}
  const origin=request.headers.get("origin");
  if(origin){try{return requestOrigin===new URL(origin).origin;}catch{return false;}}
  return request.headers.get("sec-fetch-site")==="same-origin";
}
function registryEnabled(env){return env.OPERATIONAL_REGISTRY_MODE==="mock"&&env.CHARGING_BACKEND_MODE!=="api"&&!!env.OPS_REGISTRY;}
function registryStub(env,workshop){const id=env.OPS_REGISTRY.idFromName(workshop);return env.OPS_REGISTRY.get(id);}

function recommendation1311(session,clock){
  const state=String(session?.state||"");
  const reserve=Number(session?.protected_soc_percent||0);
  const soc=Number(session?.soc_percent||0);
  const slot=Number(clock?.step_index||0);
  const eligible=session?.v2g_eligible===true;
  if(["DOCKING","ALIGNING"].includes(state))return {action:"DOCK",target_state:state,reason_fi:"Kohdistus ennen energiapalvelua",reason_en:"Dock before energy service",target_soc_percent:reserve};
  if(state==="FAULT")return {action:"FAULT_HOLD",target_state:"FAULT",reason_fi:"Turvallinen keskeytys",reason_en:"Safe fault hold",target_soc_percent:reserve};
  if(["OVERRIDDEN","SESSION_ENDED"].includes(state))return {action:"HOLD",target_state:state,reason_fi:"Istunto ei ole verkkopalvelussa",reason_en:"Session is outside grid service",target_soc_percent:reserve};
  if(soc<reserve)return {action:"CHARGE_MOBILITY",target_state:"CHARGING",reason_fi:"Liikkumisvara ensin",reason_en:"Mobility reserve first",target_soc_percent:reserve};

  if(slot===0){
    const target=Math.min(85,reserve+(eligible?4:3));
    if(soc<target-.05)return {action:"CHARGE_BUFFER",target_state:"CHARGING",reason_fi:"Lataa uusiutuvan sähkön aikana",reason_en:"Charge during high RES availability",target_soc_percent:target};
    return {action:"HOLD_READY",target_state:"PAUSED",reason_fi:"Ensimmäinen liikkumispuskuri valmis",reason_en:"Initial mobility buffer ready",target_soc_percent:target};
  }
  if(slot===1){
    const target=Math.min(85,reserve+(eligible?8:4));
    if(soc<target-.05)return {action:"CHARGE_BUFFER",target_state:"CHARGING",reason_fi:"Rakenna lähtö- ja V2G-puskuria",reason_en:"Build mobility and V2G buffer",target_soc_percent:target};
    return {action:eligible?"V2G_AVAILABLE":"HOLD_READY",target_state:eligible?"V2G_AVAILABLE":"PAUSED",reason_fi:eligible?"Jousto valmiina huippua varten":"Liikkumisvara turvattu",reason_en:eligible?"Flexibility ready for peak":"Mobility reserve protected",target_soc_percent:target};
  }
  if(slot===2){
    const floor=Math.min(85,reserve+3);
    if(eligible&&soc>floor+.05)return {action:"EXPORT_V2G",target_state:"V2G_ACTIVE",reason_fi:"Korkea kysyntä: käytä V2G-puskurin ensimmäinen osa",reason_en:"High demand: use the first part of the V2G buffer",target_soc_percent:floor};
    return {action:"MOBILITY_PRIORITY",target_state:"PAUSED",reason_fi:"Ensimmäisen huippujakson tavoite saavutettu — liikkuminen etusijalla",reason_en:"First peak target reached — mobility first",target_soc_percent:floor};
  }
  if(slot===3){
    const floor=reserve;
    if(eligible&&soc>floor+.05)return {action:"EXPORT_V2G",target_state:"V2G_ACTIVE",reason_fi:"Kysyntä on yhä korkea: käytä jäljellä olevaa turvallista V2G-puskuria",reason_en:"Demand remains high: use the remaining safe V2G buffer",target_soc_percent:floor};
    return {action:"MOBILITY_PRIORITY",target_state:"PAUSED",reason_fi:"Suojattu lähtövaraus saavutettu — V2G päättyy",reason_en:"Protected departure reserve reached — V2G stops",target_soc_percent:floor};
  }
  if(slot===4){
    const target=Math.min(85,reserve+7);
    if(soc<target-.05)return {action:"RESTORE_RESERVE",target_state:"RECHARGING",reason_fi:"Palauta lähtö- ja V2G-puskuri ennen vapautusta",reason_en:"Restore departure and V2G buffer before release",target_soc_percent:target};
    return {action:"HOLD_READY",target_state:"PAUSED",reason_fi:"Lähtöpuskuri palautettu",reason_en:"Departure buffer restored",target_soc_percent:target};
  }
  if(soc>=reserve)return {action:"READY_TO_DEPART",target_state:"READY_TO_DEPART",reason_fi:"Ajoneuvo voidaan vapauttaa",reason_en:"Vehicle can be released",target_soc_percent:reserve};
  return {action:"CHARGE_MOBILITY",target_state:"CHARGING",reason_fi:"Lataa vähintään lähtövaraukseen",reason_en:"Charge to protected departure reserve",target_soc_percent:reserve};
}

function rewriteSummary(data){
  if(!data||!Array.isArray(data.sessions)||!data.utility_clock)return data;
  data.sessions=data.sessions.map(s=>({...s,utility_recommendation:recommendation1311(s,data.utility_clock)}));
  if(data.aggregate){
    data.aggregate.flexibility_available_kw=data.sessions
      .filter(s=>["V2G_AVAILABLE","EXPORT_V2G"].includes(s.utility_recommendation?.action))
      .reduce((sum,s)=>sum+(Number(s.flexibility_kw)||0),0);
  }
  data.operational_registry_version="1.3.11";
  return data;
}

export default {async fetch(request,env,ctx){
  const url=new URL(request.url);
  if(url.pathname==="/api/health"&&request.method==="GET"){
    const response=await sharedWorker.fetch(request,env,ctx);const data=await response.json().catch(()=>({ok:false}));
    return out({...data,operational_registry:"shared-utility-clock",operational_registry_version:"1.3.11",utility_clock_mode:"operator-started-server-authoritative",utility_slot_real_seconds:15,utility_run_real_seconds:90},response.status);
  }
  if(url.pathname==="/api/charging/utility-summary"&&request.method==="GET"){
    const response=await sharedWorker.fetch(request,env,ctx);
    const data=await response.json().catch(()=>null);
    if(!data)return response;
    return out(rewriteSummary(data),response.status);
  }
  if(url.pathname==="/api/charging/utility-clock/start"&&request.method==="POST"){
    if(!registryEnabled(env))return out({ok:false,error:"Operational mock registry is disabled."},503);
    if(!sameOrigin(request))return out({ok:false,error:"Origin rejected."},403);
    const workshop=cleanCode(url.searchParams.get("workshop"));
    if(!workshop)return out({ok:false,error:"Invalid workshop code."},400);
    return registryStub(env,workshop).fetch("https://registry/clock/start",{method:"POST"});
  }
  return sharedWorker.fetch(request,env,ctx);
}};
