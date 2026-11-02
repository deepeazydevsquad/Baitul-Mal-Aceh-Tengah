const { Op, User } = require("../models");
const { validatePassword } = require("../helper/passwordPolicyHelper");

const validation = {};

validation.username = async (value) => {
  var check = await User.findOne({
    where: { username: value },
  });
  if (!check) {
    throw new Error("Username tidak terdaftar dipangkalan data");
  }
  return true;
};

validation.password = async (value) => typeof value === "string" && value.length > 0;

// validasi username
validation.check_username = async (value, { req }) => {
  const selfProfileEdit =
    req.user?.principalType === "administrator" &&
    String(req.path || "").toLowerCase().replace(/\/+$/, "") ===
      "/auth/administrator/edit_profile";
  const id = selfProfileEdit ? req.user.id : req.body.id;

  // 🧩 MODE EDIT (user sedang update profile)
  if (id) {
    const current = await User.findByPk(id);

    if (!current) {
      throw new Error("User tidak ditemukan di pangkalan data.");
    }

    // Jika username tidak berubah, loloskan
    if (current.username === value) {
      return true;
    }

    // Cek apakah username baru sudah dipakai user lain
    const check = await User.findOne({
      where: {
        username: value,
        id: { [Op.ne]: id }, // user lain selain yang sedang login
      },
    });

    if (check) {
      throw new Error("Username sudah digunakan oleh pengguna lain.");
    }

    return true;
  }

  // MODE REGISTRASI (user baru)
  const check = await User.findOne({
    where: { username: value },
  });

  if (check) {
    throw new Error("Username sudah digunakan oleh pengguna lain.");
  }

  return true;
};

// validasi password
validation.check_password = async (value, { req }) => {
  if (value) validatePassword(value, { minLength: 12 });
  if (value && value !== req.body.password_confirmation) {
    throw new Error("Password dan konfirmasi password harus sama");
  }
  return true;
};

module.exports = validation;
