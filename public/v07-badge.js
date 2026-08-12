const v07Brand = document.querySelector('.brand-block');
if (v07Brand && !document.querySelector('#v07BuildBadge')) {
  document.querySelector('#v06BuildBadge')?.remove();
  document.querySelector('#v05BuildBadge')?.remove();
  const badge = document.createElement('span');
  badge.id = 'v07BuildBadge';
  badge.className = 'status-badge';
  badge.textContent = 'UI v0.7 preview';
  v07Brand.appendChild(badge);
}
