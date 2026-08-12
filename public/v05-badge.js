const brand = document.querySelector('.brand-block');
if (brand && !document.querySelector('#v05BuildBadge')) {
  const badge = document.createElement('span');
  badge.id = 'v05BuildBadge';
  badge.className = 'status-badge';
  badge.textContent = 'UI v0.5 preview';
  brand.appendChild(badge);
}
