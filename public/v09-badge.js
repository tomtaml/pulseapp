const b=document.querySelector('.brand-block');
if(b&&!document.querySelector('#v09BuildBadge')){document.querySelector('#v08BuildBadge')?.remove();const x=document.createElement('span');x.id='v09BuildBadge';x.className='status-badge';x.textContent='UI v0.9 fleet-manager preview';b.appendChild(x);}
