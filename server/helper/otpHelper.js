const crypto = require("crypto");

const OTP_LENGTH = 6;
const OTP_TTL_MS = 5 * 60 * 1000;
const OTP_MAX_ATTEMPTS = 5;

function normalizeWhatsAppNumber(value) {
  let digits = String(value || "").replace(/\D/g, "");
  if (digits.startsWith("62")) digits = `0${digits.slice(2)}`;
  if (digits.startsWith("8")) digits = `0${digits}`;
  return /^08\d{8,10}$/.test(digits) ? digits : null;
}

function generateOtpCode() {
  return String(crypto.randomInt(100000, 1000000)).padStart(OTP_LENGTH, "0");
}

function createOtpVerifier(code, salt, secret = process.env.OTP_HASH_SECRET) {
  if (!secret) throw new Error("OTP_HASH_SECRET belum dikonfigurasi.");
  return crypto
    .createHmac("sha256", secret)
    .update(`${salt}:${String(code)}`)
    .digest("hex");
}

function verifyOtpCode(code, salt, verifier, secret = process.env.OTP_HASH_SECRET) {
  if (!code || !salt || !verifier || !secret) return false;
  const actual = Buffer.from(createOtpVerifier(code, salt, secret), "hex");
  const expected = Buffer.from(verifier, "hex");
  return (
    actual.length === expected.length &&
    crypto.timingSafeEqual(actual, expected)
  );
}

module.exports = {
  OTP_LENGTH,
  OTP_TTL_MS,
  OTP_MAX_ATTEMPTS,
  normalizeWhatsAppNumber,
  generateOtpCode,
  createOtpVerifier,
  verifyOtpCode,
};
