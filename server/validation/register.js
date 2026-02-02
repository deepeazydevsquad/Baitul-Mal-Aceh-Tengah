const { body } = require("express-validator");
const { Kecamatan, Desa, Otp, Member } = require("../models");

class RegisterValidation {
  /**
   * Validasi ID Desa
   * @param {string|number} value - ID Desa yang akan divalidasi
   * @returns {Promise<boolean>}
   * @throws {Error} Jika Desa tidak ditemukan
   */
  async checkDesaId(value) {
    const desa = await Desa.findByPk(value);

    if (!desa) {
      throw new Error("Desa tidak terdaftar di pangkalan data");
    }

    return true;
  }

  /**
   * Validasi ID Kecamatan
   * @param {string|number} value - ID Kecamatan yang akan divalidasi
   * @returns {Promise<boolean>}
   * @throws {Error} Jika Kecamatan tidak ditemukan
   */
  async checkIdKecamatan(value) {
    const kecamatan = await Kecamatan.findByPk(value);

    if (!kecamatan) {
      throw new Error("Kecamatan tidak terdaftar di pangkalan data");
    }

    return true;
  }

  /**
   * Validasi OTP
   * @param {string} value - Kode OTP yang akan divalidasi
   * @param {Object} options - Opsi tambahan
   * @param {Object} options.req - Express request object
   * @returns {Promise<boolean>}
   * @throws {Error} Jika OTP tidak valid atau sudah digunakan
   */
  async checkOtp(value, { req }) {
    const { whatsapp_number } = req.body;

    const otp = await Otp.findOne({
      where: {
        whatsapp_number,
        otp: value,
        status: "belum_digunakan",
      },
    });

    if (!otp) {
      throw new Error("OTP tidak valid");
    }

    return true;
  }

  /**
   * Validasi nomor WhatsApp
   * @param {string} value - Nomor WhatsApp yang akan divalidasi
   * @returns {Promise<boolean>}
   * @throws {Error} Jika nomor WhatsApp sudah terdaftar
   */
  async checkNomorWhatsapp(value) {
    const member = await Member.findOne({
      where: {
        whatsapp_number: value,
      },
    });

    if (member) {
      throw new Error("Nomor WhatsApp tidak tersedia");
    }

    return true;
  }

  /**
   * Validasi nomor KTP (khusus tipe perorangan)
   * @param {string} nomor_ktp - Nomor KTP yang akan divalidasi
   * @param {Object} options - Opsi tambahan
   * @param {Object} options.req - Express request object
   * @returns {Promise<boolean>}
   * @throws {Error} Jika nomor KTP kosong atau sudah terdaftar
   */
  async checkNomorKtp(nomor_ktp, { req }) {
    const { tipe } = req.body;

    if (tipe === "perorangan") {
      if (typeof nomor_ktp !== "string" || nomor_ktp.trim() === "") {
        throw new Error("Nomor KTP tidak boleh kosong");
      }

      const member = await Member.findOne({
        where: {
          nomor_ktp,
        },
      });

      if (member) {
        throw new Error("Nomor KTP tidak tersedia");
      }
    }

    return true;
  }

  /**
   * Validasi nomor KK (khusus tipe perorangan)
   * @param {string} nomor_kk - Nomor KK yang akan divalidasi
   * @param {Object} options - Opsi tambahan
   * @param {Object} options.req - Express request object
   * @returns {Promise<boolean>}
   * @throws {Error} Jika nomor KK kosong untuk tipe perorangan
   */
  async checkNomorKk(nomor_kk, { req }) {
    const { tipe } = req.body;

    if (tipe === "perorangan") {
      if (typeof nomor_kk !== "string" || nomor_kk.trim() === "") {
        throw new Error("Nomor KK tidak boleh kosong");
      }
    }

    return true;
  }

  /**
   * Validasi username
   * @param {string} username - Username yang akan divalidasi
   * @returns {Promise<boolean>}
   * @throws {Error} Jika username sudah terdaftar
   */
  async checkUsername(username) {
    const member = await Member.findOne({
      where: {
        username,
      },
    });

    if (member) {
      throw new Error("Username tidak tersedia");
    }

    return true;
  }
}

// Instance dari RegisterValidation class
const validation = new RegisterValidation();

/**
 * Get validasi field register
 * @returns {Array} Array validasi untuk body()
 */
function getRegisterValidation() {
  return [
    body("desa_id")
      .notEmpty()
      .withMessage("desa_id tidak boleh kosong.")
      .custom((value) => validation.checkDesaId(value)),
    body("tipe")
      .notEmpty()
      .withMessage("Tipe tidak boleh kosong.")
      .isIn(["perorangan", "instansi"])
      .withMessage("Tipe tidak valid."),
    body("fullname").notEmpty().withMessage("Fullname tidak boleh kosong."),
    body("otp")
      .notEmpty()
      .withMessage("OTP tidak boleh kosong.")
      .custom((value, { req }) => validation.checkOtp(value, { req })),
    body("whatsapp_number")
      .notEmpty()
      .withMessage("Nomor WhatsApp tidak boleh kosong.")
      .custom((value) => validation.checkNomorWhatsapp(value)),
    body("nomor_ktp")
      .optional()
      .custom((value, { req }) => validation.checkNomorKtp(value, { req })),
    body("nomor_kk")
      .optional()
      .custom((value, { req }) => validation.checkNomorKk(value, { req })),
    body("username")
      .notEmpty()
      .withMessage("Username tidak boleh kosong.")
      .custom((value) => validation.checkUsername(value)),
    body("password")
      .notEmpty()
      .withMessage("Password tidak boleh kosong.")
      .isLength({ min: 6 })
      .withMessage("Password minimal 6 karakter."),
  ];
}

/**
 * Get validasi field daftar desa
 * @returns {Array} Array validasi untuk body()
 */
function getDaftarDesaValidation() {
  return [
    body("kecamatan_id")
      .notEmpty()
      .withMessage("kecamatan_id tidak boleh kosong.")
      .custom((value) => validation.checkIdKecamatan(value)),
  ];
}

module.exports = {
  getRegisterValidation,
  getDaftarDesaValidation,
};
