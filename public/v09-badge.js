const qBadge=new URLSearchParams(location.search);
const variantBadgeMode=qBadge.get('variant')||'fi-fleet';
const b=document.querySelector('.brand-block');
if(b){
  document.querySelector('#v08BuildBadge')?.remove();
  let x=document.querySelector('#v09BuildBadge');
  if(!x){x=document.createElement('span');x.id='v09BuildBadge';x.className='status-badge';b.appendChild(x);}
  x.textContent=variantBadgeMode==='fi-citizen'?'UI v0.10 citizen/accessibility preview':'UI v0.9.1 fleet-manager preview';
}
