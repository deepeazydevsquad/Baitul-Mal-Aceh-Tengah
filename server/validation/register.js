const { Kecamatan } = require("../models");
const { validatePassword } = require("../helper/passwordPolicyHelper");
const {
  validateNikForMemberType,
} = require("../helper/nikHelper");

const validation = {};

validation.check_id_kecamatan = async (value) => {
  const check = await Kecamatan.findByPk(value);
  if (!check) {
    throw new Error("Kecamatan tidak terdaftar di pangkalan data");
  }
  return true;
};

validation.check_username = (value) => {
  const username = String(value || "").trim();
  if (!/^[a-zA-Z0-9._-]+$/.test(username)) {
    throw new Error(
      "Username hanya boleh berisi huruf, angka, titik, garis bawah, atau tanda hubung."
    );
  }
  return true;
};

validation.check_password = (value) => validatePassword(value);
validation.check_nik = (value, { req }) =>
  validateNikForMemberType(value, req.body.tipe);

module.exports = validation;
