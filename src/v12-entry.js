import sharedWorker,{WorkshopSessionRegistry} from "./v12-index.js";
export {WorkshopSessionRegistry};

const slotTemplate=[
  {time:"15:30",demand:["keskitaso","moderate"],res:["paljon","high"],price:8,charge:42,export:0},
  {time:"15:45",demand:["nouseva","rising"],res:["paljon","high"],price:11,charge:39,export:0},
  {time:"16:00",demand:["korkea","high"],res:["vähemmän","lower"],price:17,charge:18,export:26},
  {time:"16:15",demand:["korkea","high"],res:["vähemmän","lower"],price:14,charge:14,export:36},
  {time:"16:30",demand:["laskeva","easing"],res:["keskitaso","moderate"],price:11,charge:27,export:0},
  {time:"16:45",demand:["keskitaso","moderate"],res:["keskitaso","moderate"],price:9,charge:0,export:0}
];
function out(data,status=200){return new Response(JSON.stringify(data),{status,headers:{"content-type":"application/json; charset=utf-8","cache-control":"no-store, max-age=0","x-content-type-options":"nosniff","referrer-policy":"no-referrer","x-robots-tag":"noindex, nofollow, noarchive"}});}

export default {async fetch(request,env,ctx){
  const url=new URL(request.url);
  if(url.pathname==="/api/charging/utility-summary"&&request.method==="GET"){
    const response=await sharedWorker.fetch(request,env,ctx);if(!response.ok)return response;
    const data=await response.json();data.slots=slotTemplate;data.registry_version="v1.2";return out(data,response.status);
  }
  if(url.pathname==="/api/health"&&request.method==="GET"){
    const response=await sharedWorker.fetch(request,env,ctx);const data=await response.json().catch(()=>({ok:false}));
    return out({...data,operational_registry:"shared-mock",operational_registry_version:"1.2.0"},response.status);
  }
  return sharedWorker.fetch(request,env,ctx);
}};
