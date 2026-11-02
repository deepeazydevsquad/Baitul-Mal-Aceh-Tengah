const JWT_ALGORITHM = "HS256";
const JWT_ISSUER = "baitulmal-api";
const TOKEN_AUDIENCE = {
  administrator: "baitulmal-administrator",
  member: "baitulmal-member",
};

const JWT_SECRET_ENV = {
  administrator: {
    access: "ADMINISTRATOR_SECRET_KEY",
    refresh: "ADMINISTRATOR_REFRESH_SECRET_KEY",
  },
  member: {
    access: "MEMBERSHIP_SECRET_KEY",
    refresh: "MEMBERSHIP_REFRESH_SECRET_KEY",
  },
};

function readSecurityConfiguration(env = process.env) {
  return {
    administrator: {
      access: env.ADMINISTRATOR_SECRET_KEY,
      refresh: env.ADMINISTRATOR_REFRESH_SECRET_KEY,
    },
    member: {
      access: env.MEMBERSHIP_SECRET_KEY,
      refresh: env.MEMBERSHIP_REFRESH_SECRET_KEY,
    },
    otpHashSecret: env.OTP_HASH_SECRET,
  };
}

function validateSecurityConfiguration(env = process.env) {
  const config = readSecurityConfiguration(env);
  const secrets = [
    ["ADMINISTRATOR_SECRET_KEY", config.administrator.access],
    ["ADMINISTRATOR_REFRESH_SECRET_KEY", config.administrator.refresh],
    ["MEMBERSHIP_SECRET_KEY", config.member.access],
    ["MEMBERSHIP_REFRESH_SECRET_KEY", config.member.refresh],
    ["OTP_HASH_SECRET", config.otpHashSecret],
  ];
  const invalid = secrets.filter(
    ([, value]) => typeof value !== "string" || value.trim().length < 32
  );

  if (invalid.length > 0) {
    throw new Error(
      "Konfigurasi keamanan tidak valid: semua secret wajib diisi dan minimal 32 karakter."
    );
  }

  const values = secrets.map(([, value]) => value.trim());
  if (new Set(values).size !== values.length) {
    throw new Error(
      "Konfigurasi keamanan tidak valid: setiap secret harus berbeda."
    );
  }

  return config;
}

module.exports = {
  JWT_ALGORITHM,
  JWT_ISSUER,
  TOKEN_AUDIENCE,
  JWT_SECRET_ENV,
  readSecurityConfiguration,
  validateSecurityConfiguration,
};
