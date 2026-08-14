import baseWorker,{WorkshopSessionRegistry as V13Registry} from "./v13-index.js";

const FINAL_STEP=5;
const SLOT_REAL_MS=20*1000;
const RUN_REAL_MS=6*SLOT_REAL_MS;

export class WorkshopSessionRegistry extends V13Registry {
  async storedClock(){return await this.ctx.storage.get("utility_clock");}

  async ensureClock(startIfNeeded=false){
    let stored=await this.storedClock();
    if(stored?.completed===true){
      return {running:false,complete:true,step_index:FINAL_STEP,simulated_time:"16:45",seconds_to_next:0,slot_real_seconds:20,time:"16:45",demand:"moderate",demand_index:58,res:"moderate",res_percent:64,price_c_kwh:9,intent:"DEPARTURE_READY",intent_fi:"Vapauta lähtövalmiit ajoneuvot",intent_en:"Release departure-ready vehicles"};
    }
    const clock=await super.ensureClock(startIfNeeded);
    stored=await this.storedClock();
    if(!stored?.origin_ms) return clock;
    const elapsed=Math.max(0,Date.now()-Number(stored.origin_ms));
    if(clock.step_index===FINAL_STEP && elapsed<RUN_REAL_MS){
      return {...clock,running:true,complete:false,seconds_to_next:Math.max(0,Math.ceil((RUN_REAL_MS-elapsed)/1000)),final_interval:true};
    }
    if(elapsed>=RUN_REAL_MS){
      const completed={...stored,running:false,last_step:FINAL_STEP,completed:true,completed_at_ms:Date.now()};
      await this.ctx.storage.put("utility_clock",completed);
      return {...clock,running:false,complete:true,step_index:FINAL_STEP,simulated_time:"16:45",seconds_to_next:0};
    }
    return clock;
  }

  async clearPreviousRun(){
    const all=await this.ctx.storage.list({prefix:"session:"});
    const keys=[...all.keys()];
    if(keys.length) await this.ctx.storage.delete(keys);
    await this.ctx.storage.put("events",[]);
    await this.ctx.storage.put("utility_clock",{origin_ms:null,running:false,last_step:-1,completed:false});
  }

  async register(){
    const clock=await this.ensureClock(false);
    if(clock.complete) await this.clearPreviousRun();
    return super.register();
  }
}

export default baseWorker;
