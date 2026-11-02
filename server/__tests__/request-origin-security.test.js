const {
  isTrustedBrowserOrigin,
  createTrustedOriginGuard,
} = require("../middleware/requestOrigin");

const allowedOrigins = new Set(["https://app.example.test"]);

describe("state-changing auth request origin", () => {
  test("rejects cross-site browsers and accepts trusted or non-browser clients", () => {
    expect(
      isTrustedBrowserOrigin(
        { headers: { origin: "https://evil.example.test" } },
        allowedOrigins
      )
    ).toBe(false);
    expect(
      isTrustedBrowserOrigin(
        { headers: { referer: "https://evil.example.test/form" } },
        allowedOrigins
      )
    ).toBe(false);
    expect(
      isTrustedBrowserOrigin(
        { headers: { "sec-fetch-site": "cross-site" } },
        allowedOrigins
      )
    ).toBe(false);
    expect(
      isTrustedBrowserOrigin(
        { headers: { origin: "https://app.example.test" } },
        allowedOrigins
      )
    ).toBe(true);
    expect(isTrustedBrowserOrigin({ headers: {} }, allowedOrigins)).toBe(true);
  });

  test.each([
    "/auth/login_administrator",
    "/auth/login_administrator/",
  ])(
    "returns 403 before a login handler for a cross-site origin on %s",
    (path) => {
      const next = jest.fn();
      const response = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const guard = createTrustedOriginGuard({
        allowedOrigins,
        paths: ["/auth/login_administrator"],
      });

      guard(
        {
          method: "POST",
          path,
          headers: { origin: "https://evil.example.test" },
        },
        response,
        next
      );

      expect(response.status).toHaveBeenCalledWith(403);
      expect(response.json).toHaveBeenCalledWith(
        expect.objectContaining({ code: "CSRF_ORIGIN_REJECTED" })
      );
      expect(next).not.toHaveBeenCalled();
    }
  );
});
