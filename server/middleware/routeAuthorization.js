const {
  authenticateTokenAdministrator,
  authenticateTokenMember,
} = require("./authenticateToken");
const { requirePermission } = require("./authorizePermission");
const { getRoutePolicy, permissionRules } = require("../security/routePolicy");

function enforceMemberScope(req, res, next) {
  const suppliedMemberIds = [req.body?.member_id, req.query?.member_id].filter(
    (value) => value !== undefined
  );

  if (
    suppliedMemberIds.some(
      (memberId) => String(memberId) !== String(req.user?.id)
    )
  ) {
    return res.status(403).json({
      error: true,
      error_msg: "Data member tidak sesuai dengan sesi.",
      code: "MEMBER_SCOPE_VIOLATION",
    });
  }

  if (req.body && typeof req.body === "object") {
    req.body.member_id = req.user.id;
  }
  return next();
}

function protectConfiguredRoutes(app) {
  app.use((req, res, next) => {
    const policy = getRoutePolicy(req.method, req.path);

    if (
      policy.access === "public-or-capability" ||
      policy.access === "document-owner-or-capability"
    ) {
      return next();
    }

    if (policy.access === "member") {
      return authenticateTokenMember(req, res, () =>
        enforceMemberScope(req, res, next)
      );
    }

    if (policy.access === "admin") {
      return authenticateTokenAdministrator(req, res, () => {
        if (!policy.permission) return next();
        return requirePermission(policy.permission)(req, res, next);
      });
    }

    return res.status(404).json({
      error: true,
      error_msg: "Endpoint tidak ditemukan.",
      code: "NOT_FOUND",
    });
  });
}

module.exports = {
  permissionRules,
  enforceMemberScope,
  protectConfiguredRoutes,
};
