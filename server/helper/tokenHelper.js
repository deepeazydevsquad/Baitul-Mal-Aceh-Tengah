const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { Auth_session, User, Member, Op } = require("../models");
const {
  JWT_ALGORITHM,
  JWT_ISSUER,
  TOKEN_AUDIENCE,
  readSecurityConfiguration,
} = require("../config/security");

const ACCESS_TTL = {
  administrator: "15m",
  member: "15m",
};
const REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function compactPrincipal(principal, principalType) {
  return {
    id: Number(principal.id),
    username: principal.username,
    name: principal.name,
    fullname: principal.fullname,
    jabatan: principal.jabatan,
    groupId: principal.grup_id,
    principalType,
  };
}

function signToken(principal, principalType, tokenType, sid, jti) {
  const config = readSecurityConfiguration();
  const secret = config[principalType][tokenType];
  if (!secret) throw new Error("Konfigurasi JWT tidak tersedia.");

  return jwt.sign(
    {
      sub: String(principal.id),
      principal_type: principalType,
      token_type: tokenType,
      sid,
      jti,
    },
    secret,
    {
      algorithm: JWT_ALGORITHM,
      issuer: JWT_ISSUER,
      audience: TOKEN_AUDIENCE[principalType],
      expiresIn:
        tokenType === "access" ? ACCESS_TTL[principalType] : "7d",
    }
  );
}

async function issueTokenPair(principal, principalType) {
  await Auth_session.destroy({
    where: {
      expires_at: { [Op.lt]: new Date() },
    },
  });

  const sid = crypto.randomBytes(32).toString("hex");
  const refreshJti = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + REFRESH_TTL_MS);

  await Auth_session.create({
    sid,
    principal_type: principalType,
    principal_id: principal.id,
    refresh_jti: refreshJti,
    expires_at: expiresAt,
  });

  return {
    access_token: signToken(principal, principalType, "access", sid, crypto.randomUUID()),
    refresh_token: signToken(principal, principalType, "refresh", sid, refreshJti),
  };
}

function verifyToken(token, principalType, tokenType) {
  const config = readSecurityConfiguration();
  const secret = config[principalType][tokenType];
  if (!secret) throw new Error("Konfigurasi JWT tidak tersedia.");

  const claims = jwt.verify(token, secret, {
    algorithms: [JWT_ALGORITHM],
    issuer: JWT_ISSUER,
    audience: TOKEN_AUDIENCE[principalType],
  });

  if (
    claims.principal_type !== principalType ||
    claims.token_type !== tokenType ||
    !claims.sub ||
    !claims.sid
  ) {
    const error = new Error("Token bukan untuk principal atau jenis ini.");
    error.code = "TOKEN_TYPE_MISMATCH";
    throw error;
  }

  return claims;
}

async function validateActiveSession(claims) {
  const session = await Auth_session.findOne({
    where: {
      sid: claims.sid,
      principal_type: claims.principal_type,
      principal_id: Number(claims.sub),
      revoked_at: null,
    },
  });

  if (!session || new Date(session.expires_at).getTime() <= Date.now()) {
    const error = new Error("Sesi sudah tidak aktif.");
    error.code = "SESSION_REVOKED";
    throw error;
  }

  return session;
}

async function verifyAndRotateRefreshToken(token, principalType) {
  const claims = verifyToken(token, principalType, "refresh");
  const session = await validateActiveSession(claims);
  const Account = principalType === "administrator" ? User : Member;
  const account = await Account.findByPk(Number(claims.sub), {
    attributes: ["id"],
  });
  if (!account) {
    await Auth_session.update(
      { revoked_at: new Date() },
      { where: { id: session.id } }
    );
    const error = new Error("Akun sudah tidak valid.");
    error.code = "SESSION_REVOKED";
    throw error;
  }

  if (session.refresh_jti !== claims.jti) {
    await Auth_session.update(
      { revoked_at: new Date() },
      { where: { id: session.id, revoked_at: null } }
    );
    const error = new Error("Refresh token sudah digunakan.");
    error.code = "REFRESH_TOKEN_REUSED";
    throw error;
  }

  const nextRefreshJti = crypto.randomBytes(32).toString("hex");
  const [updated] = await Auth_session.update(
    { refresh_jti: nextRefreshJti },
    {
      where: {
        id: session.id,
        refresh_jti: claims.jti,
        revoked_at: null,
      },
    }
  );

  if (updated !== 1) {
    await Auth_session.update(
      { revoked_at: new Date() },
      { where: { id: session.id, revoked_at: null } }
    );
    const error = new Error("Refresh token sudah digunakan.");
    error.code = "REFRESH_TOKEN_REUSED";
    throw error;
  }

  const principal = {
    id: Number(claims.sub),
    username: claims.username,
    name: claims.name,
    fullname: claims.fullname,
    jabatan: claims.jabatan,
    grup_id: claims.groupId,
  };

  return {
    access_token: signToken(
      principal,
      principalType,
      "access",
      claims.sid,
      crypto.randomUUID()
    ),
    refresh_token: signToken(
      principal,
      principalType,
      "refresh",
      claims.sid,
      nextRefreshJti
    ),
  };
}

async function revokeSessionByRefreshToken(token, principalType) {
  const claims = verifyToken(token, principalType, "refresh");
  await Auth_session.update(
    { revoked_at: new Date() },
    {
      where: {
        sid: claims.sid,
        principal_type: principalType,
        principal_id: Number(claims.sub),
        revoked_at: null,
      },
    }
  );
  return claims;
}

async function revokeAllSessions(principalType, principalId) {
  await Auth_session.update(
    { revoked_at: new Date() },
    {
      where: {
        principal_type: principalType,
        principal_id: Number(principalId),
        revoked_at: null,
      },
    }
  );
}

module.exports = {
  compactPrincipal,
  issueTokenPair,
  verifyToken,
  validateActiveSession,
  verifyAndRotateRefreshToken,
  revokeSessionByRefreshToken,
  revokeAllSessions,
};
