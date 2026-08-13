const v09VersionScreen=document.querySelector('#screen');
function presentV09Version(){document.querySelectorAll('.status-panel span').forEach(el=>{const next=el.textContent.replace(/v0\.(?:4\.0|5\.0|6\.0|7\.0|7\.1|8\.0|8\.1)/g,'v0.9.0');if(el.textContent!==next)el.textContent=next;});}
if(v09VersionScreen){const observer=new MutationObserver(presentV09Version);observer.observe(v09VersionScreen,{childList:true});presentV09Version();}
