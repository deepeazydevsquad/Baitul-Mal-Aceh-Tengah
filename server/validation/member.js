const { Op, Member } = require("../models");
const bcrypt = require("bcryptjs");
const { validatePassword } = require("../helper/passwordPolicyHelper");

const validation = {};

validation.username = async (value) => {
  var check = await Member.findOne({
    where: { username: value },
  });
  if (!check) {
    throw new Error("Username tidak terdaftar dipangkalan data");
  }
  return true;
};

validation.password = async (value) => typeof value === "string" && value.length > 0;

validation.check_username = async (value, { req }) => {
  // Jika sedang login (edit profil)
  if (req.user && req.user.username) {
    const current = await Member.findOne({
      where: { username: req.user.username },
    });

    if (!current) {
      throw new Error("Member tidak ditemukan.");
    }

    // Jika username tidak berubah, lolos
    if (current.username === value) {
      return true;
    }

    // Jika username berubah, pastikan belum dipakai member lain
    const check = await Member.findOne({
      where: {
        username: value,
        id: { [Op.ne]: current.id }, // hindari bentrok dengan diri sendiri
      },
    });

    if (check) {
      throw new Error("Username sudah digunakan oleh member lain.");
    }

    return true;
  }

  // MODE REGISTRASI
  const check = await Member.findOne({
    where: { username: value },
  });

  if (check) {
    throw new Error("Username sudah digunakan oleh member lain.");
  }

  return true;
};

validation.check_password = async (value, { req }) => {
  if (!value) return true; // kalau user tidak ubah password, biarkan valid (edit profile)

  validatePassword(value);

  if (req.user && req.user.username) {
    const q = await Member.findOne({
      where: { username: req.user.username },
      attributes: ["password"],
    });

    if (!q) {
      throw new Error("Member ini tidak terdaftar di pangkalan data.");
    }

    const isSame = await bcrypt.compare(value, q.password);
    if (isSame) {
      throw new Error("Password tidak boleh sama dengan password sebelumnya.");
    }
  }

  return true;
};


module.exports = validation;
