const crypto = require("crypto");
const { Surveyor_kegiatan } = require("../models");

const SURVEY_COOKIE_NAME = "survey_capability";
const SURVEY_CAPABILITY_TTL_MS = 8 * 60 * 60 * 1000;

function capabilitySecret() {
  const secret = process.env.OTP_HASH_SECRET;
  if (!secret) throw new Error("OTP_HASH_SECRET belum dikonfigurasi.");
  return secret;
}

function accessCodeHash(accessCode) {
  return crypto
    .createHash("sha256")
    .update(String(accessCode || ""))
    .digest("hex");
}

function signPayload(encodedPayload) {
  return crypto
    .createHmac("sha256", capabilitySecret())
    .update(`survey-capability:${encodedPayload}`)
    .digest("base64url");
}

function createCapabilityToken(record) {
  const payload = {
    sid: Number(record.id),
    code: accessCodeHash(record.access_code),
    exp: Math.floor((Date.now() + SURVEY_CAPABILITY_TTL_MS) / 1000),
  };
  const encoded = Buffer.from(JSON.stringify(payload), "utf8").toString(
    "base64url"
  );
  return `${encoded}.${signPayload(encoded)}`;
}

function verifyCapabilityToken(token) {
  if (typeof token !== "string" || token.length > 2048) return null;
  const [encoded, signature, extra] = token.split(".");
  if (!encoded || !signature || extra) return null;

  try {
    const expected = Buffer.from(signPayload(encoded));
    const actual = Buffer.from(signature);
    if (
      actual.length !== expected.length ||
      !crypto.timingSafeEqual(actual, expected)
    ) {
      return null;
    }
    const payload = JSON.parse(
      Buffer.from(encoded, "base64url").toString("utf8")
    );
    if (
      !Number.isInteger(Number(payload.sid)) ||
      typeof payload.code !== "string" ||
      !Number.isInteger(Number(payload.exp)) ||
      Number(payload.exp) <= Math.floor(Date.now() / 1000)
    ) {
      return null;
    }
    return { sid: Number(payload.sid), code: payload.code, exp: payload.exp };
  } catch {
    return null;
  }
}

function cookieOptions() {
  return {
    httpOnly: true,
    secure:
      process.env.NODE_ENV === "production" ||
      process.env.AUTH_COOKIE_SECURE === "true",
    sameSite: "strict",
    path: "/",
    maxAge: SURVEY_CAPABILITY_TTL_MS,
  };
}

function setSurveyCapabilityCookie(res, record) {
  res.cookie(SURVEY_COOKIE_NAME, createCapabilityToken(record), cookieOptions());
}

function clearSurveyCapabilityCookie(res) {
  const { maxAge, ...options } = cookieOptions();
  res.clearCookie(SURVEY_COOKIE_NAME, options);
}

async function loadSurveyCapability(req) {
  const token = req?.cookies?.[SURVEY_COOKIE_NAME];
  const claims = verifyCapabilityToken(token);
  if (!claims) return null;

  const record = await Surveyor_kegiatan.findOne({
    where: { id: claims.sid, status: "active" },
    attributes: ["id", "access_code", "status", "kegiatan_id"],
  });
  if (!record || accessCodeHash(record.access_code) !== claims.code) {
    return null;
  }
  return record;
}

async function requireSurveyCapability(req, res, next) {
  try {
    const record = await loadSurveyCapability(req);
    if (!record) {
      clearSurveyCapabilityCookie(res);
      return res.status(403).json({
        error: true,
        error_msg: "Sesi survei tidak valid atau sudah berakhir.",
        code: "SURVEY_CAPABILITY_REQUIRED",
      });
    }
    req.surveyCapability = {
      id: Number(record.id),
      kegiatan_id: Number(record.kegiatan_id),
    };
    return next();
  } catch (error) {
    return next(error);
  }
}

async function issueSurveyCapability(req, res) {
  const accessCode = String(req.body?.access_code || "");
  const record = await Surveyor_kegiatan.findOne({
    where: {
      access_code: accessCode,
      status: "active",
    },
    attributes: ["id", "access_code", "status", "kegiatan_id"],
  });
  if (!record) {
    return res.status(403).json({
      error: true,
      error_msg: "Access Code tidak terdaftar atau tidak aktif.",
      code: "INVALID_SURVEY_CAPABILITY",
    });
  }

  setSurveyCapabilityCookie(res, record);
  return res.status(200).json({
    error: false,
    expires_in_seconds: Math.floor(SURVEY_CAPABILITY_TTL_MS / 1000),
  });
}

module.exports = {
  SURVEY_COOKIE_NAME,
  SURVEY_CAPABILITY_TTL_MS,
  accessCodeHash,
  createCapabilityToken,
  verifyCapabilityToken,
  setSurveyCapabilityCookie,
  clearSurveyCapabilityCookie,
  loadSurveyCapability,
  requireSurveyCapability,
  issueSurveyCapability,
};
