function originFromReferer(referer) {
  if (!referer) return null;
  try {
    return new URL(referer).origin;
  } catch {
    return null;
  }
}

function isTrustedBrowserOrigin(req, allowedOrigins) {
  const origin = String(req.headers.origin || "").trim();
  if (origin) return allowedOrigins.has(origin);

  const refererOrigin = originFromReferer(req.headers.referer);
  if (refererOrigin) return allowedOrigins.has(refererOrigin);

  const fetchSite = String(req.headers["sec-fetch-site"] || "").toLowerCase();
  if (fetchSite && fetchSite !== "same-origin") return false;

  // Non-browser clients do not send Origin/Referer/Fetch Metadata.
  return true;
}

function createTrustedOriginGuard({ allowedOrigins, paths }) {
  const protectedPaths = new Set(paths);
  return (req, res, next) => {
    const normalizedPath = String(req.path || "")
      .toLowerCase()
      .replace(/\/+$/, "");
    if (
      req.method === "POST" &&
      protectedPaths.has(normalizedPath)
    ) {
      if (!isTrustedBrowserOrigin(req, allowedOrigins)) {
        return res.status(403).json({
          error: true,
          error_msg: "Origin request tidak diizinkan.",
          code: "CSRF_ORIGIN_REJECTED",
        });
      }
    }
    return next();
  };
}

module.exports = {
  originFromReferer,
  isTrustedBrowserOrigin,
  createTrustedOriginGuard,
};
