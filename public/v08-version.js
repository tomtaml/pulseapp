const v08VersionScreen=document.querySelector('#screen');
function presentV08Version(){
  document.querySelectorAll('.status-panel span').forEach(el=>{
    const next=el.textContent.replace(/v0\.(?:4\.0|5\.0|6\.0|7\.0|7\.1|8\.0)/g,'v0.8.1');
    if(el.textContent!==next)el.textContent=next;
  });
}
if(v08VersionScreen){
  const observer=new MutationObserver(presentV08Version);
  observer.observe(v08VersionScreen,{childList:true});
  presentV08Version();
}
