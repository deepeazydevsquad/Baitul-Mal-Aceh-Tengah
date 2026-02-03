const {
  Op,
  Riwayat_pengumpulan,
  Member,
  Kecamatan,
  Desa,
  Wakalah,
} = require("../models");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

class RiwayatZakatValidation {
  /**
   * Validasi ID Wakalah
   * @param {string|number} value - ID Wakalah yang akan divalidasi
   * @returns {Promise<boolean>}
   * @throws {Error} Jika Wakalah tidak ditemukan
   */
  async checkIdWakalah(value) {
    if (value != "") {
      const check = await Wakalah.findByPk(value);
      if (!check) {
        throw new Error("ID Wakalah tidak terdaftar di pangkalan data");
      }
    }
    return true;
  }

  /**
   * Validasi ID Desa
   * @param {string|number} value - ID Desa yang akan divalidasi
   * @returns {Promise<boolean>}
   * @throws {Error} Jika Desa tidak ditemukan
   */
  async checkIdDesa(value) {
    const check = await Desa.findByPk(value);
    if (!check) {
      throw new Error("ID Desa tidak terdaftar di pangkalan data");
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
    const check = await Kecamatan.findByPk(value);
    if (!check) {
      throw new Error("ID Kecamatan tidak terdaftar di pangkalan data");
    }
    return true;
  }

  /**
   * Validasi ID Member
   * @param {string|number} value - ID Member yang akan divalidasi
   * @returns {Promise<boolean>}
   * @throws {Error} Jika Member tidak ditemukan
   */
  async checkIdMember(value) {
    const check = await Member.findByPk(value);
    if (!check) {
      throw new Error("Member tidak terdaftar di pangkalan data");
    }
    return true;
  }

  /**
   * Validasi ID Riwayat Zakat
   * @param {string|number} value - ID Riwayat yang akan divalidasi
   * @returns {Promise<boolean>}
   * @throws {Error} Jika Riwayat Zakat tidak ditemukan
   */
  async checkIdRiwayatZakat(value) {
    const check = await Riwayat_pengumpulan.findOne({
      where: {
        id: value,
        tipe: { [Op.in]: ZAKAT_TYPES },
      },
    });

    if (!check) {
      throw new Error("Riwayat zakat tidak terdaftar di pangkalan data");
    }
    return true;
  }

  /**
   * Validasi ID Riwayat Zakat dengan tipe pembayaran tertentu
   * @param {string|number} value - ID Riwayat yang akan divalidasi
   * @returns {Promise<boolean>}
   * @throws {Error} Jika Riwayat Zakat tidak ditemukan atau tipe pembayaran tidak sesuai
   */
  async checkIdRiwayatZakatCashOrTransfer(value) {
    const check = await Riwayat_pengumpulan.findOne({
      where: {
        id: value,
        tipe: {
          [Op.in]: [
            "zakat_harta",
            "zakat_simpanan",
            "zakat_profesi",
            "zakat_perdagangan",
            "zakat_pertanian",
          ],
        },
        tipe_pembayaran: {
          [Op.in]: ["transfer", "cash"],
        },
      },
    });

    if (!check) {
      throw new Error("Riwayat zakat tidak terdaftar di pangkalan data");
    }
    return true;
  }

  /**
   * Konfigurasi upload file untuk bukti zakat
   * @param {string} tipe - Tipe pembayaran ("cash" atau "transfer")
   * @returns {multer.Multer} Instance multer untuk upload file
   */
  getUploadMiddleware(tipe = "cash") {
    const storage = multer.diskStorage({
      destination: (req, file, cb) => {
        const folder = tipe === "transfer" ? "bukti_transfer" : "bukti_setoran";
        const uploadPath = path.join(__dirname, "../uploads/img/zakat", folder);
        if (!fs.existsSync(uploadPath)) {
          fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
      },
      filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        const timestamp = Date.now();
        const filename = `${timestamp}${ext}`;
        req.body.buktiPath = filename;
        cb(null, filename);
      },
    });

    const fileFilter = (req, file, cb) => {
      const allowedTypes = ["image/png", "image/jpeg", "image/jpg"];
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error("Format file harus PNG, JPG, atau JPEG"), false);
      }
    };

    return multer({
      storage,
      fileFilter,
      limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB
    });
  }
}

// Instance dari RiwayatZakatValidation class
const validation = new RiwayatZakatValidation();

module.exports = {
  validation,
  upload: (tipe = "cash") => validation.getUploadMiddleware(tipe),
};
