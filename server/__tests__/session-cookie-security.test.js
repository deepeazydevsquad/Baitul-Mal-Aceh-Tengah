const {
  setRefreshCookie,
  readRefreshCookie,
  clearRefreshCookie,
} = require("../helper/authCookieHelper");

describe("refresh token cookie handling", () => {
  test("stores refresh tokens only in an HttpOnly SameSite cookie", () => {
    const response = { cookie: jest.fn(), clearCookie: jest.fn() };

    setRefreshCookie(response, "administrator", "synthetic-refresh-token");

    expect(response.cookie).toHaveBeenCalledWith(
      "administrator_refresh_token",
      "synthetic-refresh-token",
      expect.objectContaining({
        httpOnly: true,
        sameSite: "strict",
        path: "/auth",
      })
    );
    expect(
      readRefreshCookie(
        {
          cookies: {
            administrator_refresh_token: "synthetic-refresh-token",
          },
        },
        "administrator"
      )
    ).toBe("synthetic-refresh-token");

    clearRefreshCookie(response, "administrator");
    expect(response.clearCookie).toHaveBeenCalledWith(
      "administrator_refresh_token",
      expect.objectContaining({ httpOnly: true, path: "/auth" })
    );
  });

  test("uses the reverse-proxy cookie path in production", () => {
    const previousPath = process.env.AUTH_COOKIE_PATH;
    process.env.AUTH_COOKIE_PATH = "/api/auth";
    const response = { cookie: jest.fn(), clearCookie: jest.fn() };

    setRefreshCookie(response, "member", "synthetic-refresh-token");

    expect(response.cookie).toHaveBeenCalledWith(
      "member_refresh_token",
      "synthetic-refresh-token",
      expect.objectContaining({ path: "/api/auth" })
    );
    if (previousPath === undefined) {
      delete process.env.AUTH_COOKIE_PATH;
    } else {
      process.env.AUTH_COOKIE_PATH = previousPath;
    }
  });
});
