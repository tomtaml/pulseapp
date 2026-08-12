const brand = document.querySelector('.brand-block');
if (brand && !document.querySelector('#v06BuildBadge')) {
  document.querySelector('#v05BuildBadge')?.remove();
  const badge = document.createElement('span');
  badge.id = 'v06BuildBadge';
  badge.className = 'status-badge';
  badge.textContent = 'UI v0.6 preview';
  brand.appendChild(badge);
}
