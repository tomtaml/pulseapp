const p=new URLSearchParams(location.search);
if((p.get('variant')||'fi-fleet')==='fi-fleet'&&p.get('ops')==='1'&&!document.querySelector('link[data-v13-grid]')){
  const link=document.createElement('link');link.rel='stylesheet';link.href='/v13-grid.css';link.dataset.v13Grid='1';document.head.appendChild(link);
}
