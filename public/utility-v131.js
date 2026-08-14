const q131=new URLSearchParams(location.search);
const workshop131=(q131.get('workshop')||'TAMPERE-S4').replace(/[^A-Za-z0-9_-]/g,'').slice(0,32)||'TAMPERE-S4';
async function syncRunBadge(){
 try{
  const r=await fetch(`/api/charging/utility-summary?workshop=${encodeURIComponent(workshop131)}`,{cache:'no-store',credentials:'same-origin'});if(!r.ok)return;
  const d=await r.json(),c=d?.utility_clock,b=document.querySelector('.clock-badge');if(!c||!b)return;
  const fi=document.documentElement.lang==='fi';
  if(c.complete&&!c.running){b.textContent=fi?'✓ ajojakso päättynyt · uusi QR aloittaa uuden':'✓ run complete · a new QR starts the next run';b.classList.add('complete');}
  else b.classList.remove('complete');
 }catch{}
}
syncRunBadge();setInterval(syncRunBadge,2000);
