function applyV137UtilityVersion(){
  const badge=document.getElementById('viewBadge');
  const eyebrow=document.getElementById('eyebrow');
  if(badge)badge.textContent='Utility / aggregator v1.3.9';
  if(eyebrow)eyebrow.textContent='PULSE v1.3.9 · shared utility clock';
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',applyV137UtilityVersion,{once:true});
else applyV137UtilityVersion();
window.addEventListener('load',applyV137UtilityVersion,{once:true});
