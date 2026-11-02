function parseGroupAccess(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function permissionSet(value) {
  const permissions = new Set();
  for (const menu of parseGroupAccess(value)) {
    const menuId = Number(menu?.id);
    if (!Number.isInteger(menuId)) continue;
    permissions.add(`menu:${menuId}`);
    for (const submenu of Array.isArray(menu?.Submenus)
      ? menu.Submenus
      : []) {
      const submenuId = Number(submenu?.id);
      if (Number.isInteger(submenuId)) {
        permissions.add(`menu:${menuId}:submenu:${submenuId}`);
      }
    }
  }
  return permissions;
}

function isPermissionSubset(candidate, allowed, { strict = false } = {}) {
  const candidateSet = permissionSet(candidate);
  const allowedSet = permissionSet(allowed);
  if (strict && candidateSet.size >= allowedSet.size) return false;
  for (const permission of candidateSet) {
    if (!allowedSet.has(permission)) return false;
  }
  return true;
}

module.exports = {
  parseGroupAccess,
  permissionSet,
  isPermissionSubset,
};
