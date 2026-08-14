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

  function holdUntilUtilityStarts(){
    if(!onCycleStep())return;
    const c=window.PULSE_UTILITY_CLOCK,s=snapshot(),adapter=window.PULSE_CHARGING?.adapter,session=window.PULSE_OPS_SESSION;
    if(!c||c.running||c.complete||!s||!adapter||typeof adapter.publish!=='function')return;
    if(['FAULT','OVERRIDDEN','SESSION_ENDED'].includes(s.state))return;
    adapter.publish({
      state:'READY',
      soc_percent:Number(session?.arrival_soc_percent??s.soc_percent??55),
      protected_soc_percent:Number(session?.protected_soc_percent??s.protected_soc_percent??65),
      power_kw:0,
      direction:'idle',
      energy_to_vehicle_kwh:0,
      energy_to_grid_kwh:0,
      departure_ready:false
    });
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
    holdUntilUtilityStarts();
    bridgeResearchCompletion();
    const next=root()?.querySelector("[data-action='next']");
    const answered=!!root()?.querySelector('input[name="energy_flow_clarity"]:checked');
    if(next&&ready())next.disabled=!answered;
    const err=root()?.querySelector('.inline-error');
    if(err&&ready()&&answered)err.remove();
  }

  window.addEventListener('pulse:utility-clock',()=>setTimeout(syncGate,0));
  window.addEventListener('pulse:charging-snapshot',()=>setTimeout(syncGate,0));
  const screen=root();if(screen){let queued=false;new MutationObserver(()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;syncGate();});}).observe(screen,{childList:true,subtree:false});}
  setInterval(syncGate,1000);
  syncGate();
}
