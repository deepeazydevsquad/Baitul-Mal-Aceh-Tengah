const { Op, Riwayat_pengumpulan, Member, Wakalah } = require("../models");
const multer = require("multer");
const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

const validation = {};

// Validasi id member apakah sudah ada di database
validation.check_id_member = async (value) => {
  const check = await Member.findByPk(value);
  if (!check) {
    throw new Error("Member tidak terdaftar di pangkalan data");
  }
  return true;
};

// Validasi id wakalah opsional
validation.check_id_wakalah_optional = async (value) => {
  if (value === null || value === undefined || value === "") return true;
  const check = await Wakalah.findByPk(value);
  if (!check) {
    throw new Error("Wakalah tidak terdaftar di pangkalan data");
  }
  return true;
};

// Validasi id riwayat infaq apakah sudah ada di database
validation.check_id_riwayat_infaq = async (value) => {
  console.log("ID riwayat infaq", value);
  const check = await Riwayat_pengumpulan.findOne({
    where: {
      id: value,
      tipe: "infaq",
    },
  });

  if (!check) {
    throw new Error("Riwayat infaq tidak terdaftar di pangkalan data");
  }
  return true;
};

// Validasi id Riwayat apakah sudah ada di database dan dalam tipe pembayaran cash atau transfer
validation.check_id_riwayat_infaq_cash_or_transfer = async (value) => {
  const check = await Riwayat_pengumpulan.findOne({
    where: {
      id: value,
      tipe: "infaq",
      tipe_pembayaran: {
        [Op.in]: ["transfer", "cash"],
      },
    },
  });

  if (!check) {
    throw new Error("Riwayat infaq tidak terdaftar di pangkalan data");
  }
};

validation.upload = (tipe = "cash") => {
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const folder = tipe === "transfer" ? "bukti_transfer" : "bukti_setoran";
      const uploadPath = path.join(__dirname, "../uploads/img/infaq", folder);
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
};

module.exports = validation;
