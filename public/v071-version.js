const v071VersionScreen=document.querySelector('#screen');
function presentV071Version(){
  document.querySelectorAll('.status-panel span').forEach(el=>{el.textContent=el.textContent.replace(/v0\.7\.0/g,'v0.7.1');});
}
if(v071VersionScreen){
  const observer=new MutationObserver(presentV071Version);
  observer.observe(v071VersionScreen,{childList:true});
  presentV071Version();
}
