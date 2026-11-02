function normalizeNik(value) {
  const digits = String(value || "").replace(/\D/g, "");
  return digits || null;
}

function isValidNik(value) {
  const nik = normalizeNik(value);
  return Boolean(nik && /^\d{16}$/.test(nik));
}

function validateNikForMemberType(value, memberType) {
  if (memberType !== "perorangan") return true;
  if (!isValidNik(value)) {
    throw new Error("Nomor KTP harus terdiri dari 16 digit.");
  }
  return true;
}

module.exports = {
  normalizeNik,
  isValidNik,
  validateNikForMemberType,
};
