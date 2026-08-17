import sharedWorker,{WorkshopSessionRegistry} from "./v13-index.js";
export {WorkshopSessionRegistry};

function out(data,status=200){return new Response(JSON.stringify(data),{status,headers:{"content-type":"application/json; charset=utf-8","cache-control":"no-store, max-age=0","x-content-type-options":"nosniff","referrer-policy":"no-referrer","x-robots-tag":"noindex, nofollow, noarchive"}});}

export default {async fetch(request,env,ctx){
  const url=new URL(request.url);
  if(url.pathname==="/api/health"&&request.method==="GET"){
    const response=await sharedWorker.fetch(request,env,ctx);const data=await response.json().catch(()=>({ok:false}));
    return out({...data,operational_registry:"shared-utility-clock",operational_registry_version:"1.3.0",utility_clock_mode:"server-authoritative",utility_slot_real_seconds:20},response.status);
  }
  return sharedWorker.fetch(request,env,ctx);
}};
