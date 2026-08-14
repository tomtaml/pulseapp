const q131=new URLSearchParams(location.search);
const workshop131=(q131.get('workshop')||'TAMPERE-S4').replace(/[^A-Za-z0-9_-]/g,'').slice(0,32)||'TAMPERE-S4';
let startBusy=false;

function fi131(){return document.documentElement.lang==='fi';}
function label131(a,b){return fi131()?a:b;}

function ensureClockControl(data){
  const c=data?.utility_clock,a=data?.aggregate,face=document.querySelector('.clock-face');
  if(!c||!face)return;
  const badge=face.querySelector('.clock-badge');
  if(badge){
    badge.classList.toggle('complete',!!c.complete);
    if(c.complete)badge.textContent=label131('✓ ajojakso päättynyt','✓ run complete');
    else if(c.running)badge.textContent=label131(`● yhteinen kello käynnissä · ${c.seconds_to_next}s`,`● shared clock running · ${c.seconds_to_next}s`);
    else badge.textContent=label131('● QR-istunnot odottavat käynnistystä','● QR sessions waiting for start');
  }
  document.getElementById('viewBadge')?.replaceChildren(document.createTextNode('Utility / aggregator v1.3.2'));
  document.getElementById('safetyBadge')?.replaceChildren(document.createTextNode(label131('Shared mock · kellon käynnistys utility-näkymästä','Shared mock · utility starts clock')));

  let box=face.querySelector('.utility-clock-control');
  if(!box){box=document.createElement('div');box.className='utility-clock-control';face.append(box);}
  const count=Number(a?.active_sessions||0);
  if(c.complete){
    box.innerHTML=`<strong>${label131('Jakso valmis','Run complete')}</strong><span>${label131('Uusi QR-istunto valmistaa seuraavan 15:30-jakson.','A new QR session stages the next 15:30 run.')}</span>`;
    return;
  }
  if(c.running){
    box.innerHTML=`<strong>${label131('Yhteinen aika etenee','Shared time is running')}</strong><span>${label131('16:00 ja 16:15 ovat V2G-huipputuen jaksot.','16:00 and 16:15 are the V2G peak-support intervals.')}</span>`;
    return;
  }
  box.innerHTML=`<button type="button" class="utility-start-clock" ${count<1||startBusy?'disabled':''}>${startBusy?label131('Käynnistetään…','Starting…'):label131('Käynnistä yhteinen energiajärjestelmän jakso','Start shared energy-system run')}</button><span>${count<1?label131('Odota vähintään yhtä QR-istuntoa.','Wait for at least one QR session.'):label131(`${count} QR-istuntoa valmiina. Käynnistä, kun työpajaryhmä on valmis.`,`${count} QR session(s) ready. Start when the workshop group is ready.`)}</span>`;
  box.querySelector('.utility-start-clock')?.addEventListener('click',startClock131);
}

async function startClock131(){
  if(startBusy)return;startBusy=true;
  try{
    const r=await fetch(`/api/charging/utility-clock/start?workshop=${encodeURIComponent(workshop131)}`,{method:'POST',cache:'no-store',credentials:'same-origin'});
    const d=await r.json().catch(()=>({ok:false,error:'Unknown error'}));
    if(!r.ok||!d.ok)throw new Error(d.error||'Clock start failed');
  }catch(e){alert(label131(`Kellon käynnistys epäonnistui: ${e.message}`,`Clock start failed: ${e.message}`));}
  finally{startBusy=false;syncRunBadge();}
}

async function syncRunBadge(){
 try{
  const r=await fetch(`/api/charging/utility-summary?workshop=${encodeURIComponent(workshop131)}`,{cache:'no-store',credentials:'same-origin'});if(!r.ok)return;
  const d=await r.json();ensureClockControl(d);
 }catch{}
}
syncRunBadge();setInterval(syncRunBadge,1000);
