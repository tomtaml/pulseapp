import baseWorker,{WorkshopSessionRegistry as V13Registry} from "./v13-index.js";

const GRID_SLOTS=Object.freeze([
  {time:"15:30",demand:"moderate",demand_index:52,res:"high",res_percent:78,price_c_kwh:8,intent:"RES_CHARGE",intent_fi:"Lataa uusiutuvan sähkön aikana",intent_en:"Charge during high RES availability"},
  {time:"15:45",demand:"rising",demand_index:66,res:"high",res_percent:72,price_c_kwh:11,intent:"BUILD_BUFFER",intent_fi:"Rakenna lähtö- ja V2G-puskuri",intent_en:"Build mobility and V2G buffer"},
  {time:"16:00",demand:"high",demand_index:86,res:"lower",res_percent:43,price_c_kwh:17,intent:"PEAK_V2G",intent_fi:"Huipputuki: V2G kelpoisista ajoneuvoista",intent_en:"Peak support from eligible V2G vehicles"},
  {time:"16:15",demand:"high",demand_index:92,res:"lower",res_percent:36,price_c_kwh:14,intent:"PEAK_V2G",intent_fi:"Jatka lyhyttä V2G-huipputukea",intent_en:"Continue short V2G peak support"},
  {time:"16:30",demand:"easing",demand_index:70,res:"moderate",res_percent:55,price_c_kwh:11,intent:"RESTORE_RESERVE",intent_fi:"Palauta lähtöpuskuri",intent_en:"Restore departure buffer"},
  {time:"16:45",demand:"moderate",demand_index:58,res:"moderate",res_percent:64,price_c_kwh:9,intent:"DEPARTURE_READY",intent_fi:"Vapauta lähtövalmiit ajoneuvot",intent_en:"Release departure-ready vehicles"}
]);
const FINAL_STEP=GRID_SLOTS.length-1;
const SLOT_REAL_MS=30*1000;
const RUN_REAL_MS=GRID_SLOTS.length*SLOT_REAL_MS;

function out(data,status=200){return new Response(JSON.stringify(data),{status,headers:{"content-type":"application/json; charset=utf-8","cache-control":"no-store, max-age=0","x-content-type-options":"nosniff","referrer-policy":"no-referrer","x-robots-tag":"noindex, nofollow, noarchive"}});}

export class WorkshopSessionRegistry extends V13Registry {
  async storedClock(){return await this.ctx.storage.get("utility_clock");}

  clockView(stored,step,running=false,complete=false,seconds=0){
    const slot=GRID_SLOTS[Math.max(0,Math.min(FINAL_STEP,step))];
    return {running,complete,step_index:Math.max(0,Math.min(FINAL_STEP,step)),simulated_time:slot.time,seconds_to_next:seconds,slot_real_seconds:SLOT_REAL_MS/1000,...slot};
  }

  async ensureClock(){
    let stored=await this.storedClock();
    if(!stored){stored={origin_ms:null,running:false,last_step:0,completed:false};await this.ctx.storage.put("utility_clock",stored);}
    if(stored.completed===true)return this.clockView(stored,FINAL_STEP,false,true,0);
    if(!stored.running||!stored.origin_ms)return this.clockView(stored,Number.isInteger(stored.last_step)?Math.max(0,stored.last_step):0,false,false,0);

    const elapsed=Math.max(0,Date.now()-Number(stored.origin_ms));
    if(elapsed>=RUN_REAL_MS){
      const completed={...stored,running:false,last_step:FINAL_STEP,completed:true,completed_at_ms:Date.now()};
      await this.ctx.storage.put("utility_clock",completed);
      await this.appendEvent("UTILITY_CLOCK","Yhteinen hyötysähköjakso päättyi klo 16:45","Shared utility run completed at 16:45",null,{step_index:FINAL_STEP});
      return this.clockView(completed,FINAL_STEP,false,true,0);
    }

    const step=Math.max(0,Math.min(FINAL_STEP,Math.floor(elapsed/SLOT_REAL_MS)));
    if(step!==stored.last_step){
      stored={...stored,last_step:step};await this.ctx.storage.put("utility_clock",stored);
      const slot=GRID_SLOTS[step];
      await this.appendEvent("UTILITY_SLOT",`Hyötysähköjakso ${slot.time}: ${slot.intent_fi}`,`Utility interval ${slot.time}: ${slot.intent_en}`,null,{step_index:step});
    }
    const nextBoundary=Math.min(RUN_REAL_MS,(step+1)*SLOT_REAL_MS);
    return this.clockView(stored,step,true,false,Math.max(0,Math.ceil((nextBoundary-elapsed)/1000)));
  }

  async clearPreviousRun(){
    const all=await this.ctx.storage.list({prefix:"session:"});
    const keys=[...all.keys()];if(keys.length)await this.ctx.storage.delete(keys);
    await this.ctx.storage.put("events",[]);
    await this.ctx.storage.put("utility_clock",{origin_ms:null,running:false,last_step:0,completed:false});
  }

  async makeFirstSessionReference(data){
    const ref=data?.session?.session_ref;if(!ref)return data;
    const key=`session:${ref}`,current=await this.ctx.storage.get(key);if(!current)return data;
    const protectedSoc=Math.max(52,Math.min(64,Number(current.protected_soc_percent||56)));
    const arrivalSoc=Math.max(35,protectedSoc-5);
    const routeNeed=Math.min(Number(current.route_need_soc_percent||38),protectedSoc-10);
    const patched={...current,reference_v2g_demo:true,arrival_soc_percent:arrivalSoc,soc_percent:arrivalSoc,route_need_soc_percent:routeNeed,protected_soc_percent:protectedSoc,dwell_minutes:75,availability_start:"15:30",availability_end:"16:45",departure_time:"17:00",estimated_charge_to_reserve_minutes:11,v2g_window_minutes:35,v2g_eligible:true,flexibility_kw:Math.max(12,Number(current.flexibility_kw||0))};
    await this.ctx.storage.put(key,patched);
    const {token_hash,...publicPatched}=patched;
    data.session={...data.session,...publicPatched};
    return data;
  }

  async register(){
    const beforeClock=await this.ensureClock();
    if(beforeClock.complete)await this.clearPreviousRun();
    const activeBefore=(await this.activeSessions()).length;
    const response=await super.register();
    let data=await response.json();
    if(activeBefore===0)data=await this.makeFirstSessionReference(data);

    if(!beforeClock.running){
      await this.ctx.storage.put("utility_clock",{origin_ms:null,running:false,last_step:0,completed:false});
      if(activeBefore===0){
        await this.ctx.storage.put("events",[]);
        const s=data?.session;
        if(s)await this.appendEvent("SESSION",`${s.session_ref} liittyi odottamaan yhteisen kellon käynnistystä`,`${s.session_ref} joined and is waiting for the shared clock to start`,s.session_ref,{state:s.state||"DOCKING",reference_v2g_demo:true});
      }
    }
    const clock=await this.ensureClock();
    return out({...data,utility_clock:clock});
  }

  async startClock(){
    await this.prune();
    const active=await this.activeSessions();
    if(!active.length)return out({ok:false,error:"No active QR sessions. Scan at least one participant QR first."},409);
    const current=await this.ensureClock();
    if(current.running)return out({ok:true,already_running:true,utility_clock:current,active_sessions:active.length});
    if(current.complete)return out({ok:false,error:"This run is complete. Start the next run by opening a new QR session first."},409);
    const stored={origin_ms:Date.now(),running:true,last_step:0,completed:false,started_by:"utility"};
    await this.ctx.storage.put("utility_clock",stored);
    await this.appendEvent("UTILITY_CLOCK","Yhteinen hyötysähkökello käynnistettiin utility-näkymästä klo 15:30","Shared utility clock was started from the utility view at 15:30",null,{step_index:0});
    return out({ok:true,utility_clock:await this.ensureClock(),active_sessions:active.length});
  }

  async fetch(request){
    const u=new URL(request.url);
    if(request.method==="POST"&&u.pathname==="/clock/start")return this.startClock();
    return super.fetch(request);
  }
}

export default baseWorker;
