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

export default {async fetch(request,env,ctx){
  const url=new URL(request.url);
  if(url.pathname==="/api/health"&&request.method==="GET"){
    const response=await sharedWorker.fetch(request,env,ctx);const data=await response.json().catch(()=>({ok:false}));
    return out({...data,operational_registry:"shared-utility-clock",operational_registry_version:"1.3.8",utility_clock_mode:"operator-started-server-authoritative",utility_slot_real_seconds:15,utility_run_real_seconds:90},response.status);
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
