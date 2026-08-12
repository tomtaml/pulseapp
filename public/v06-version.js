const v06Screen = document.querySelector('#screen');
function presentV06Version() {
  document.querySelectorAll('.status-panel span').forEach(el => {
    el.textContent = el.textContent.replace(/v0\.4\.0|v0\.5\.0/g,'v0.6.0');
  });
}
if (v06Screen) {
  const observer = new MutationObserver(presentV06Version);
  observer.observe(v06Screen,{childList:true});
  presentV06Version();
}
