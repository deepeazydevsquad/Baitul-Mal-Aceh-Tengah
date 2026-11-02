const REFRESH_COOKIE = {
  administrator: "administrator_refresh_token",
  member: "member_refresh_token",
};
const REFRESH_COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

function cookieOptions() {
  return {
    httpOnly: true,
    secure:
      process.env.NODE_ENV === "production" ||
      process.env.AUTH_COOKIE_SECURE === "true",
    sameSite: "strict",
    path: process.env.AUTH_COOKIE_PATH || "/auth",
    maxAge: REFRESH_COOKIE_MAX_AGE,
  };
}

function setRefreshCookie(res, principalType, token) {
  res.cookie(REFRESH_COOKIE[principalType], token, cookieOptions());
}

function clearRefreshCookie(res, principalType) {
  const { maxAge, ...options } = cookieOptions();
  res.clearCookie(REFRESH_COOKIE[principalType], options);
}

function readRefreshCookie(req, principalType) {
  return req?.cookies?.[REFRESH_COOKIE[principalType]] || null;
}

module.exports = {
  REFRESH_COOKIE,
  setRefreshCookie,
  clearRefreshCookie,
  readRefreshCookie,
};
