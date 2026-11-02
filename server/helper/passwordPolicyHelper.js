const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_BYTES = 72;
const COMMON_PASSWORDS = new Set([
  "12345678",
  "123456789",
  "admin123",
  "baitulmal",
  "password",
  "password1",
  "password123",
  "password1234",
  "qwerty123",
  "baitulmal123",
  "rahasia",
]);

function validatePassword(value, { allowEmpty = false, minLength = MIN_PASSWORD_LENGTH } = {}) {
  if (!value) {
    if (allowEmpty) return true;
    throw new Error("Password tidak boleh kosong.");
  }
  const password = String(value);
  if (password.length < minLength) {
    throw new Error(
      `Password minimal ${minLength} karakter.`
    );
  }
  if (Buffer.byteLength(password, "utf8") > MAX_PASSWORD_BYTES) {
    throw new Error("Password maksimal 72 byte.");
  }
  if (COMMON_PASSWORDS.has(password.toLowerCase())) {
    throw new Error("Password terlalu umum dan mudah ditebak.");
  }
  return true;
}

module.exports = {
  MIN_PASSWORD_LENGTH,
  MAX_PASSWORD_BYTES,
  validatePassword,
};
