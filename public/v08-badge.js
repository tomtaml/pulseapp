const brand=document.querySelector('.brand-block');
if(brand){
  document.querySelector('#v08BuildBadge')?.remove();
  document.querySelector('#v071BuildBadge')?.remove();
  document.querySelector('#v07BuildBadge')?.remove();
  document.querySelector('#v06BuildBadge')?.remove();
  const badge=document.createElement('span');
  badge.id='v08BuildBadge';
  badge.className='status-badge';
  badge.textContent='UI v0.8.1 dispatcher preview';
  brand.appendChild(badge);
}
