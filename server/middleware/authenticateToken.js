const { User, Member, Grup } = require("../models");
const {
  verifyToken,
  validateActiveSession,
} = require("../helper/tokenHelper");

function extractBearerToken(req) {
  const header = String(req.headers.authorization || "");
  const match = header.match(/^Bearer\s+([^\s]+)$/i);
  return match ? match[1] : null;
}

function tokenErrorResponse(res, error) {
  if (error?.name === "TokenExpiredError" || error?.code === "SESSION_REVOKED") {
    return res.status(401).json({
      error: true,
      error_msg: "Sesi sudah kedaluwarsa. Silakan login kembali.",
      code: "SESSION_EXPIRED",
    });
  }

  return res.status(403).json({
    error: true,
    error_msg: "Token tidak valid.",
    code: "INVALID_TOKEN",
  });
}

async function authenticatePrincipal(req, res, principalType, respond = true) {
  const token = extractBearerToken(req);
  if (!token) {
    if (respond) {
      res.status(401).json({
        error: true,
        error_msg: "Token tidak ditemukan.",
        code: "TOKEN_MISSING",
      });
    }
    return false;
  }

  try {
    const claims = verifyToken(token, principalType, "access");
    await validateActiveSession(claims);

    if (principalType === "administrator") {
      const account = await User.findByPk(Number(claims.sub), {
        include: [{ model: Grup, required: false }],
      });
      if (!account) {
        const error = new Error("Akun tidak valid.");
        error.code = "SESSION_REVOKED";
        throw error;
      }

      req.user = {
        id: account.id,
        principalType,
        username: account.username,
        name: account.name,
        jabatan: account.jabatan,
        grup_id: account.grup_id,
        group_access: account.Grup?.group_access || null,
      };
    } else {
      const account = await Member.findByPk(Number(claims.sub), {
        attributes: ["id", "username", "fullname", "whatsapp_number"],
      });
      if (!account) {
        const error = new Error("Akun tidak valid.");
        error.code = "SESSION_REVOKED";
        throw error;
      }

      req.user = {
        id: account.id,
        principalType,
        username: account.username,
        fullname: account.fullname,
        whatsapp_number: account.whatsapp_number,
      };
    }

    req.auth = { claims, principalType };
    return true;
  } catch (error) {
    if (respond) tokenErrorResponse(res, error);
    return false;
  }
}

async function authenticateTokenAdministrator(req, res, next) {
  if (await authenticatePrincipal(req, res, "administrator")) return next();
}

async function authenticateTokenMember(req, res, next) {
  if (await authenticatePrincipal(req, res, "member")) return next();
}

async function authenticateAnyPrincipal(req, res, next) {
  const token = extractBearerToken(req);
  if (!token) {
    return res.status(401).json({
      error: true,
      error_msg: "Token tidak ditemukan.",
      code: "TOKEN_MISSING",
    });
  }

  if (await authenticatePrincipal(req, res, "administrator", false)) {
    return next();
  }
  req.user = undefined;
  req.auth = undefined;
  if (await authenticatePrincipal(req, res, "member", false)) return next();

  return res.status(403).json({
    error: true,
    error_msg: "Token tidak valid.",
    code: "INVALID_TOKEN",
  });
}

module.exports = {
  extractBearerToken,
  authenticateTokenAdministrator,
  authenticateTokenMember,
  authenticateAnyPrincipal,
};
