const express = require("express");
const request = require("supertest");

const mockSurveyorKegiatan = {
  findOne: jest.fn(),
};

jest.mock("../models", () => ({
  Surveyor_kegiatan: mockSurveyorKegiatan,
}));

const {
  SURVEY_COOKIE_NAME,
  SURVEY_CAPABILITY_TTL_MS,
  accessCodeHash,
  createCapabilityToken,
  verifyCapabilityToken,
  setSurveyCapabilityCookie,
  requireSurveyCapability,
} = require("../helper/surveyCapabilityHelper");

const syntheticRecord = {
  id: 17,
  access_code: "synthetic-private-access-code",
  status: "active",
  kegiatan_id: 23,
};

describe("survey capability", () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalOtpSecret = process.env.OTP_HASH_SECRET;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.OTP_HASH_SECRET =
      "synthetic-survey-capability-secret-at-least-32-characters";
  });

  afterEach(() => {
    jest.restoreAllMocks();
    process.env.NODE_ENV = originalNodeEnv;
    if (originalOtpSecret === undefined) {
      delete process.env.OTP_HASH_SECRET;
    } else {
      process.env.OTP_HASH_SECRET = originalOtpSecret;
    }
  });

  test("signs a scoped capability without embedding the access code", () => {
    const token = createCapabilityToken(syntheticRecord);
    const payload = JSON.parse(
      Buffer.from(token.split(".")[0], "base64url").toString("utf8")
    );

    expect(token).not.toContain(syntheticRecord.access_code);
    expect(payload).toEqual(
      expect.objectContaining({
        sid: syntheticRecord.id,
        code: accessCodeHash(syntheticRecord.access_code),
      })
    );
    expect(verifyCapabilityToken(token)).toEqual(
      expect.objectContaining({
        sid: syntheticRecord.id,
        code: accessCodeHash(syntheticRecord.access_code),
      })
    );
  });

  test("rejects tampered and expired capability tokens", () => {
    const now = Date.UTC(2026, 10, 2, 8, 0, 0);
    const nowSpy = jest.spyOn(Date, "now").mockReturnValue(now);
    const token = createCapabilityToken(syntheticRecord);

    expect(`${token.slice(0, -1)}x`).not.toBe(token);
    expect(verifyCapabilityToken(`${token.slice(0, -1)}x`)).toBeNull();

    nowSpy.mockReturnValue(now + SURVEY_CAPABILITY_TTL_MS + 1000);
    expect(verifyCapabilityToken(token)).toBeNull();
  });

  test("uses a hardened cookie in production", () => {
    process.env.NODE_ENV = "production";
    const response = { cookie: jest.fn() };

    setSurveyCapabilityCookie(response, syntheticRecord);

    expect(response.cookie).toHaveBeenCalledWith(
      SURVEY_COOKIE_NAME,
      expect.any(String),
      expect.objectContaining({
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        path: "/",
        maxAge: SURVEY_CAPABILITY_TTL_MS,
      })
    );
  });

  test("rejects an inactive or revoked record", async () => {
    const token = createCapabilityToken(syntheticRecord);
    mockSurveyorKegiatan.findOne.mockResolvedValue(null);
    const req = { cookies: { [SURVEY_COOKIE_NAME]: token }, body: {} };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      clearCookie: jest.fn(),
    };
    const next = jest.fn();

    await requireSurveyCapability(req, res, next);

    expect(mockSurveyorKegiatan.findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: syntheticRecord.id, status: "active" },
      })
    );
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  test("stores only verified capability identity and ignores the body code", async () => {
    const token = createCapabilityToken(syntheticRecord);
    mockSurveyorKegiatan.findOne.mockResolvedValue(syntheticRecord);
    const req = {
      cookies: { [SURVEY_COOKIE_NAME]: token },
      body: { access_code: "attacker-supplied-code" },
    };
    const res = {};
    const next = jest.fn();

    await requireSurveyCapability(req, res, next);

    expect(req.body.access_code).toBe("attacker-supplied-code");
    expect(req.surveyCapability).toEqual({
      id: syntheticRecord.id,
      kegiatan_id: syntheticRecord.kegiatan_id,
    });
    expect(next).toHaveBeenCalledTimes(1);
  });

  test("denies upload middleware when no capability cookie is present", async () => {
    const uploadMiddleware = jest.fn((req, res) => {
      res.status(200).json({ uploaded: true });
    });
    const app = express();
    app.use(express.json());
    app.post(
      "/survey_lapangan/submit",
      requireSurveyCapability,
      uploadMiddleware
    );

    const response = await request(app)
      .post("/survey_lapangan/submit")
      .send({ access_code: syntheticRecord.access_code });

    expect(response.status).toBe(403);
    expect(response.body.code).toBe("SURVEY_CAPABILITY_REQUIRED");
    expect(uploadMiddleware).not.toHaveBeenCalled();
  });
});
