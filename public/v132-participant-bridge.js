const p132=new URLSearchParams(location.search);
const v132Enabled=(p132.get('variant')||'fi-fleet')==='fi-fleet'&&p132.get('ops')==='1';
if(v132Enabled){
  const root=()=>document.querySelector('#screen');
  const fi=()=>document.documentElement.lang==='fi';
  const tr=(a,b)=>fi()?a:b;
  let bridging=false;

  function onCycleStep(){return /4\s*\/\s*6/.test(root()?.innerText||'');}
  function snapshot(){return window.PULSE_CHARGING_LAST_SNAPSHOT||window.PULSE_CHARGING?.adapter?.getSnapshot?.()||null;}
  function ready(){return ['READY_TO_DEPART','OVERRIDDEN'].includes(snapshot()?.state);}
  function waitingClock(){const c=window.PULSE_UTILITY_CLOCK;return !!c&&!c.running&&!c.complete;}

  function installPublishGuard(){
    const adapter=window.PULSE_CHARGING?.adapter;if(!adapter||typeof adapter.publish!=='function'||adapter.__pulseV132Guard)return;
    const original=adapter.publish.bind(adapter);adapter.__pulseV132Guard=true;
    adapter.publish=(patch={})=>{
      if(onCycleStep()&&waitingClock()&&['CHARGING','RECHARGING','V2G_AVAILABLE','V2G_ACTIVE'].includes(patch.state)){
        const s=snapshot(),session=window.PULSE_OPS_SESSION;
        return original({...patch,state:'READY',soc_percent:Number(session?.arrival_soc_percent??s?.soc_percent??55),protected_soc_percent:Number(session?.protected_soc_percent??s?.protected_soc_percent??65),power_kw:0,direction:'idle',energy_to_vehicle_kwh:0,energy_to_grid_kwh:0,departure_ready:false});
      }
      return original(patch);
    };
  }

  function holdUntilUtilityStarts(){
    if(!onCycleStep()||!waitingClock())return;
    installPublishGuard();
    const s=snapshot(),adapter=window.PULSE_CHARGING?.adapter,session=window.PULSE_OPS_SESSION;
    if(!s||!adapter||typeof adapter.publish!=='function'||['FAULT','OVERRIDDEN','SESSION_ENDED'].includes(s.state))return;
    const arrival=Number(session?.arrival_soc_percent??s.soc_percent??55),protectedSoc=Number(session?.protected_soc_percent??s.protected_soc_percent??65);
    const needsHold=s.state!=='READY'||Number(s.power_kw||0)!==0||s.direction!=='idle'||Number(s.energy_to_vehicle_kwh||0)!==0||Number(s.energy_to_grid_kwh||0)!==0||Math.abs(Number(s.soc_percent)-arrival)>.05;
    if(needsHold)adapter.publish({state:'READY',soc_percent:arrival,protected_soc_percent:protectedSoc,power_kw:0,direction:'idle',energy_to_vehicle_kwh:0,energy_to_grid_kwh:0,departure_ready:false});
    const signal=root()?.querySelector('#v13GridSignal .v13-cycle-clock');
    if(signal)signal.innerHTML=`<strong>15:30</strong><span>${tr('Odotetaan yhteisen energiajärjestelmän kellon käynnistystä','Waiting for the shared energy-system clock to start')}</span><b>${tr('Energiaa ei vielä siirretä','No energy transfer yet')}</b>`;
  }

  function bridgeResearchCompletion(){
    if(!onCycleStep()||!ready()||bridging)return;
    const coreRun=root()?.querySelector(".cycle-card [data-action='run-cycle']");
    if(!coreRun||coreRun.disabled)return;
    bridging=true;
    const nativeTimeout=window.setTimeout;
    window.setTimeout=(fn,delay,...args)=>{
      if([1500,3300,5200].includes(Number(delay))){fn(...args);return 0;}
      return nativeTimeout(fn,delay,...args);
    };
    try{coreRun.click();}finally{window.setTimeout=nativeTimeout;}
  }

  function syncGate(){
    if(!onCycleStep())return;
    installPublishGuard();
    holdUntilUtilityStarts();
    bridgeResearchCompletion();
    const next=root()?.querySelector("[data-action='next']");
    const answered=!!root()?.querySelector('input[name="energy_flow_clarity"]:checked');
    if(next&&ready())next.disabled=!answered;
    const err=root()?.querySelector('.inline-error');
    if(err&&ready()&&answered)err.remove();
  }

  window.addEventListener('pulse:charging-ready',()=>{installPublishGuard();syncGate();});
  window.addEventListener('pulse:utility-clock',()=>setTimeout(syncGate,0));
  window.addEventListener('pulse:charging-snapshot',()=>setTimeout(syncGate,0));
  const screen=root();if(screen){let queued=false;new MutationObserver(()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;syncGate();});}).observe(screen,{childList:true,subtree:false});}
  setInterval(syncGate,1000);
  installPublishGuard();syncGate();
}
