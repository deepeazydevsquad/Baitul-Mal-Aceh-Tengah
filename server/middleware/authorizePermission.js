const { parseGroupAccess } = require("../helper/groupPermissionHelper");

function hasPermission(groupAccess, { menuId, submenuId } = {}) {
  const menus = parseGroupAccess(groupAccess);

  return menus.some((menu) => {
    if (menuId && Number(menu.id) !== Number(menuId)) return false;
    if (!submenuId) return true;
    return (
      Array.isArray(menu.Submenus) &&
      menu.Submenus.some((submenu) => Number(submenu.id) === Number(submenuId))
    );
  });
}

function requirePermission(permission) {
  return (req, res, next) => {
    if (
      req.user?.principalType !== "administrator" ||
      !req.user.id
    ) {
      return res.status(401).json({
        error: true,
        error_msg: "Autentikasi administrator diperlukan.",
        code: "ADMINISTRATOR_REQUIRED",
      });
    }

    if (Number(req.user.grup_id) === 1) return next();

    if (!hasPermission(req.user.group_access, permission)) {
      return res.status(403).json({
        error: true,
        error_msg: "Anda tidak memiliki izin untuk operasi ini.",
        code: "PERMISSION_DENIED",
      });
    }

    return next();
  };
}

module.exports = {
  parseGroupAccess,
  hasPermission,
  requirePermission,
};
