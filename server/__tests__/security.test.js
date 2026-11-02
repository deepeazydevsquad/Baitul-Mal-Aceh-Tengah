process.env.NODE_ENV = "test";
process.env.ADMINISTRATOR_SECRET_KEY = "test-admin-access-secret-000000000001";
process.env.ADMINISTRATOR_REFRESH_SECRET_KEY =
  "test-admin-refresh-secret-00000000002";
process.env.MEMBERSHIP_SECRET_KEY = "test-member-access-secret-00000000003";
process.env.MEMBERSHIP_REFRESH_SECRET_KEY =
  "test-member-refresh-secret-0000000004";
process.env.OTP_HASH_SECRET = "test-otp-hash-secret-00000000000005";
process.env.DB_DIALECT = "mysql";
process.env.DB_NAME = "test";
process.env.DB_USER = "test";
process.env.DB_PASS = "test";
process.env.DB_HOST = "127.0.0.1";

const jwt = require("jsonwebtoken");
const request = require("supertest");
const {
  validateSecurityConfiguration,
} = require("../config/security");
const {
  verifyToken,
} = require("../helper/tokenHelper");
const {
  normalizeWhatsAppNumber,
  createOtpVerifier,
  verifyOtpCode,
} = require("../helper/otpHelper");
const {
  hasPermission,
  requirePermission,
} = require("../middleware/authorizePermission");
const { createRateLimiter, clearRateLimits } = require("../helper/rateLimitHelper");
const { collectRoutes } = require("../security/routeInventory");

const app = require("../app");

const validSecurityEnv = {
  ADMINISTRATOR_SECRET_KEY: "admin-access-secret-0000000000000001",
  ADMINISTRATOR_REFRESH_SECRET_KEY: "admin-refresh-secret-000000000000002",
  MEMBERSHIP_SECRET_KEY: "member-access-secret-000000000000003",
  MEMBERSHIP_REFRESH_SECRET_KEY: "member-refresh-secret-00000000000004",
  OTP_HASH_SECRET: "otp-hash-secret-0000000000000000005",
};

function legacyAdminToken() {
  return jwt.sign(
    { id: 1, role: "admin" },
    process.env.ADMINISTRATOR_SECRET_KEY,
    { algorithm: "HS256", expiresIn: "1h" }
  );
}

describe("security configuration", () => {
  test("accepts five distinct secrets of sufficient length", () => {
    expect(() => validateSecurityConfiguration(validSecurityEnv)).not.toThrow();
  });

  test("rejects missing, short, or repeated secrets", () => {
    expect(() =>
      validateSecurityConfiguration({
        ...validSecurityEnv,
        MEMBERSHIP_SECRET_KEY: validSecurityEnv.ADMINISTRATOR_SECRET_KEY,
      })
    ).toThrow(/berbeda/);

    expect(() =>
      validateSecurityConfiguration({
        ...validSecurityEnv,
        OTP_HASH_SECRET: "short",
      })
    ).toThrow(/32 karakter/);
  });
});

describe("JWT principal and token separation", () => {
  test("accepts only the correct principal, token type, and claims", () => {
    const now = Math.floor(Date.now() / 1000);
    const baseClaims = {
      sub: "9",
      sid: "session-1",
      jti: "jti-1",
      iat: now,
      exp: now + 300,
    };
    const sign = (secret, audience, claims) =>
      jwt.sign(claims, secret, {
        algorithm: "HS256",
        issuer: "baitulmal-api",
        audience,
      });

    const adminAccess = sign(
      process.env.ADMINISTRATOR_SECRET_KEY,
      "baitulmal-administrator",
      {
        ...baseClaims,
        principal_type: "administrator",
        token_type: "access",
      }
    );
    const adminRefresh = sign(
      process.env.ADMINISTRATOR_REFRESH_SECRET_KEY,
      "baitulmal-administrator",
      {
        ...baseClaims,
        principal_type: "administrator",
        token_type: "refresh",
      }
    );
    const memberAccess = sign(
      process.env.MEMBERSHIP_SECRET_KEY,
      "baitulmal-member",
      {
        ...baseClaims,
        principal_type: "member",
        token_type: "access",
      }
    );

    expect(verifyToken(adminAccess, "administrator", "access").sub).toBe("9");
    expect(() => verifyToken(adminRefresh, "administrator", "access")).toThrow();
    expect(() => verifyToken(memberAccess, "administrator", "access")).toThrow();
    expect(() => verifyToken(legacyAdminToken(), "administrator", "access")).toThrow();
  });
});

describe("authorization and OTP helpers", () => {
  const access = [
    { id: 2, Submenus: [{ id: 3 }, { id: 4 }] },
    { id: 6, Submenus: [{ id: 17 }] },
  ];

  test("uses deny-by-default group permissions", () => {
    expect(hasPermission(access, { menuId: 2, submenuId: 3 })).toBe(true);
    expect(hasPermission(access, { menuId: 6, submenuId: 17 })).toBe(true);
    expect(hasPermission(access, { menuId: 6, submenuId: 16 })).toBe(false);
    expect(hasPermission("not-json", { menuId: 2 })).toBe(false);

    const deniedResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    requirePermission({ menuId: 6, submenuId: 16 })(
      {
        user: {
          principalType: "administrator",
          id: 10,
          grup_id: 2,
          group_access: JSON.stringify(access),
        },
      },
      deniedResponse,
      jest.fn()
    );
    expect(deniedResponse.status).toHaveBeenCalledWith(403);
  });

  test("normalizes WhatsApp numbers and verifies a salted HMAC", () => {
    expect(normalizeWhatsAppNumber("+62 812-3456-7890")).toBe("081234567890");
    const salt = "synthetic-salt";
    const verifier = createOtpVerifier("123456", salt);
    expect(verifier).not.toContain("123456");
    expect(verifyOtpCode("123456", salt, verifier)).toBe(true);
    expect(verifyOtpCode("654321", salt, verifier)).toBe(false);
  });

  test("rate limiter returns 429 after the configured limit", () => {
    clearRateLimits();
    const middleware = createRateLimiter({ max: 1, windowMs: 60_000 });
    const response = {
      set: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const req = { ip: "127.0.0.1" };
    const next = jest.fn();

    middleware(req, response, next);
    middleware(req, response, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(response.status).toHaveBeenCalledWith(429);
  });
});

describe("HTTP boundaries", () => {
  test("every loaded administrator route has an explicit permission mapping", () => {
    const routes = collectRoutes(app);
    expect(routes.length).toBeGreaterThan(250);
    expect(
      routes.filter(
        (route) => route.access === "admin" && !route.permission
      )
    ).toEqual([]);
  });

  test.each([
    "/daftar_pengguna/list",
    "/validasi_permohonan_bantuan/get_info_pemberitahuan",
    "/validasi_permohonan_bantuan/pemberitahuan",
    "/validasi_permohonan_bantuan/get_info_approve_permohonan",
    "/validasi_permohonan_bantuan/approve_permohonan",
    "/validasi_permohonan_bantuan/get_info_reject_permohonan",
    "/validasi_permohonan_bantuan/reject_permohonan",
  ])("rejects anonymous access to %s", async (path) => {
    const response = await request(app).post(path).send({ id: 1 });
    expect(response.status).toBe(401);
  });

  test("does not serve private documents through the static upload path", async () => {
    const documentResponse = await request(app).get(
      "/uploads/dokumen/permohonan_bantuan/synthetic.pdf"
    );
    const paymentResponse = await request(app).get(
      "/uploads/img/zakat/bukti_transfer/synthetic.png"
    );
    expect(documentResponse.status).toBe(404);
    expect(paymentResponse.status).toBe(404);
  });

  test("does not cache sensitive WhatsApp configuration responses", async () => {
    const response = await request(app).get(
      "/pengaturan_whatsapp/list"
    );

    expect(response.headers["cache-control"]).toBe("no-store");
  });

  test("only emits CORS permission for an allowlisted origin", async () => {
    const allowed = await request(app)
      .options("/auth/login_administrator")
      .set("Origin", "http://localhost:5173")
      .set("Access-Control-Request-Method", "POST");
    const denied = await request(app)
      .options("/auth/login_administrator")
      .set("Origin", "https://synthetic.invalid")
      .set("Access-Control-Request-Method", "POST");

    expect(allowed.headers["access-control-allow-origin"]).toBe(
      "http://localhost:5173"
    );
    expect(denied.headers["access-control-allow-origin"]).toBeUndefined();
  });

  test("requires a server-side OTP in registration", async () => {
    const response = await request(app).post("/register").send({
      desa_id: 1,
      tipe: "perorangan",
      fullname: "Fixture Sintetis",
      whatsapp_number: "081234567890",
      username: "fixture",
      password: "password-test",
    });
    expect(response.status).toBe(400);
  });
});
