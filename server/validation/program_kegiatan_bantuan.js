const { Kegiatan } = require("../models");
const multer = require("multer");
const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

const validation = {};

// Validasi id bank apakah sudah ada di database
validation.check_id_program_kegiatan_bantuan = async (value) => {
  const check = await Kegiatan.findByPk(value);
  if (!check) {
    throw new Error("Program Kegiatan tidak terdaftar di pangkalan data");
  }
  return true;
};

// Validasi id kecamatan apakah sudah ada di database
validation.check_id_kecamatan = async (value) => {
  const check = await Kecamatan.findByPk(value);
  if (!check) {
    throw new Error("Kecamatan tidak terdaftar di pangkalan data");
  }
  return true;
};

// Validasi nama bank apakah sudah ada di database
validation.check_nama_program_kegiatan_bantuan = async (value, { req }) => {
  const id = req.body.id;

  if (id) {
    const current = await Kegiatan.findByPk(id);
    if (!current) {
      throw new Error("Program Kegiatan tidak ditemukan");
    }

    if (current.name === value) {
      return true;
    }

    const check = await Kegiatan.findOne({
      where: { id: { [Op.ne]: id }, name: value },
    });
    if (check) {
      throw new Error(
        "Program Kegiatan dengan nama yang sama sudah terdaftar di pangkalan data"
      );
    }
  } else {
    const check = await Kegiatan.findOne({
      where: { name: value },
    });
    if (check) {
      throw new Error(
        "Program Kegiatan dengan nama yang sama sudah terdaftar di pangkalan data"
      );
    }
  }

  return true;
};
validation.check_start_end_date = (req, res, next) => {
  const body = req.body;
  const start_date = body.start_date; // format: YYYY-MM-DD
  const end_date = body.end_date;

  // Jika tidak ada keduanya, maka lewati karena bersifat opsional
  if (!start_date && !end_date) {
    return next();
  }

  // Jika salah satu ada, maka harus ada dua-duanya
  if (!start_date || !end_date) {
    throw new Error("Tanggal awal dan akhir harus diisi keduanya");
  }

  const tahun = parseInt(body.tahun);
  if (!tahun) {
    throw new Error("Tahun harus diisi");
  }

  // Validasi format date
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(start_date) || !dateRegex.test(end_date)) {
    throw new Error("Format tanggal tidak valid (gunakan YYYY-MM-DD)");
  }

  if (start_date > end_date) {
    throw new Error("Tanggal akhir harus lebih besar dari tanggal awal");
  }

  const startYear = new Date(start_date).getFullYear();
  const endYear = new Date(end_date).getFullYear();

  if (startYear !== tahun || endYear !== tahun) {
    throw new Error(`Tanggal awal dan akhir harus berada di tahun ${tahun}`);
  }

  next();
};

const uploadPath = path.join(
  __dirname,
  "../uploads/img/program_kegiatan_bantuan"
);

if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadPath),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const timestamp = Date.now();
    const nama_kegiatan = (req.body.nama_kegiatan || "program")
      .replace(/\s+/g, "_")
      .toLowerCase();

    const filename = `${timestamp}_${nama_kegiatan}${ext}`;
    req.body.bannerPath = filename;
    cb(null, filename);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/png", "image/jpeg", "image/jpg"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Format file harus PNG, JPG atau JPEG"), false);
  }
};

validation.upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB
});

// Middleware validasi dimensi gambar
validation.check_dimensions = (isRequired = true) => {
  return async (req, res, next) => {
    if (!req.file) {
      if (isRequired) {
        return res.status(400).json({
          error: true,
          error_msg: "Banner program kegiatan wajib diupload",
        });
      } else {
        return next();
      }
    }

    try {
      const metadata = await sharp(req.file.path).metadata();
      if (metadata.width !== 602 || metadata.height !== 330) {
        fs.unlinkSync(req.file.path); // hapus file invalid
        return res.status(400).json({
          error: true,
          error_msg: "Ukuran gambar harus 602x330 piksel",
        });
      }
      next();
    } catch (err) {
      return res.status(500).json({
        error: true,
        error_msg: `Gagal memproses gambar: ${err.message}`,
      });
    }
  };
};

module.exports = validation;
