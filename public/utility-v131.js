const q131=new URLSearchParams(location.search);
const workshop131=(q131.get('workshop')||'TAMPERE-S4').replace(/[^A-Za-z0-9_-]/g,'').slice(0,32)||'TAMPERE-S4';
let startBusy=false,syncBusy=false,lastClockData=null;

function fi131(){return document.documentElement.lang==='fi';}
function label131(a,b){return fi131()?a:b;}

function controlMode(c){if(c?.complete)return'complete';if(c?.running)return'running';return'waiting';}

function installClockControlHandler(){
  if(document.documentElement.dataset.utilityClockHandler==='1')return;
  document.documentElement.dataset.utilityClockHandler='1';
  const start=(event)=>{
    const btn=event.target?.closest?.('.utility-start-clock');
    if(!btn||btn.disabled)return;
    if(event.type==='pointerdown')event.preventDefault();
    startClock131();
  };
  document.addEventListener('pointerdown',start,{passive:false});
  document.addEventListener('click',start);
}

function ensureClockControl(data){
  lastClockData=data;
  const c=data?.utility_clock,a=data?.aggregate,face=document.querySelector('.clock-face');
  if(!c||!face)return;
  const badge=face.querySelector('.clock-badge');
  if(badge){
    badge.classList.toggle('complete',!!c.complete);
    const nextText=c.complete?label131('✓ ajojakso päättynyt','✓ run complete'):c.running?label131(`● yhteinen kello käynnissä · ${c.seconds_to_next}s`,`● shared clock running · ${c.seconds_to_next}s`):label131('● QR-istunnot odottavat käynnistystä','● QR sessions waiting for start');
    if(badge.textContent!==nextText)badge.textContent=nextText;
  }
  const view=document.getElementById('viewBadge');if(view&&view.textContent!=='Utility / aggregator v1.3.4')view.textContent='Utility / aggregator v1.3.4';
  const safety=document.getElementById('safetyBadge');const safetyText=label131('Shared mock · kellon käynnistys utility-näkymästä','Shared mock · utility starts clock');if(safety&&safety.textContent!==safetyText)safety.textContent=safetyText;

  let box=face.querySelector('.utility-clock-control');
  if(!box){box=document.createElement('div');box.className='utility-clock-control';face.append(box);}
  const count=Number(a?.active_sessions||0);
  const mode=controlMode(c);
  const stateKey=`${mode}|${count}|${startBusy?'busy':'idle'}`;
  if(box.dataset.stateKey===stateKey)return;
  box.dataset.stateKey=stateKey;

  if(mode==='complete'){
    box.innerHTML=`<strong>${label131('Jakso valmis','Run complete')}</strong><span>${label131('Uusi QR-istunto valmistaa seuraavan 15:30-jakson.','A new QR session stages the next 15:30 run.')}</span>`;
    return;
  }
  if(mode==='running'){
    box.innerHTML=`<strong>${label131('Yhteinen aika etenee','Shared time is running')}</strong><span>${label131('16:00 ja 16:15 ovat V2G-huipputuen jaksot.','16:00 and 16:15 are the V2G peak-support intervals.')}</span>`;
    return;
  }
  box.innerHTML=`<button type="button" class="utility-start-clock" ${count<1||startBusy?'disabled':''}>${startBusy?label131('Käynnistetään…','Starting…'):label131('Käynnistä yhteinen energiajärjestelmän jakso','Start shared energy-system run')}</button><span>${count<1?label131('Odota vähintään yhtä QR-istuntoa.','Wait for at least one QR session.'):label131(`${count} QR-istuntoa valmiina. Käynnistä, kun työpajaryhmä on valmis.`,`${count} QR session(s) ready. Start when the workshop group is ready.`)}</span>`;
}

async function startClock131(){
  if(startBusy)return;
  startBusy=true;
  if(lastClockData)ensureClockControl(lastClockData);
  try{
    const r=await fetch(`/api/charging/utility-clock/start?workshop=${encodeURIComponent(workshop131)}`,{method:'POST',cache:'no-store',credentials:'same-origin',headers:{'accept':'application/json'}});
    const d=await r.json().catch(()=>({ok:false,error:'Unknown error'}));
    if(!r.ok||!d.ok)throw new Error(d.error||'Clock start failed');
    lastClockData={...(lastClockData||{}),utility_clock:d.utility_clock||lastClockData?.utility_clock,aggregate:{...(lastClockData?.aggregate||{}),active_sessions:d.active_sessions??lastClockData?.aggregate?.active_sessions}};
  }catch(e){
    const message=label131(`Kellon käynnistys epäonnistui: ${e.message}`,`Clock start failed: ${e.message}`);
    let face=document.querySelector('.clock-face'),err=face?.querySelector('.utility-clock-error');
    if(face&&!err){err=document.createElement('div');err.className='utility-clock-error';face.append(err);}
    if(err)err.textContent=message;else alert(message);
  }finally{
    startBusy=false;
    await syncRunBadge();
  }
}

async function syncRunBadge(){
  if(syncBusy)return;
  syncBusy=true;
  try{
    const r=await fetch(`/api/charging/utility-summary?workshop=${encodeURIComponent(workshop131)}`,{cache:'no-store',credentials:'same-origin'});
    if(!r.ok)return;
    const d=await r.json();
    ensureClockControl(d);
  }catch{}finally{syncBusy=false;}
}

installClockControlHandler();
syncRunBadge();
setInterval(syncRunBadge,2000);
