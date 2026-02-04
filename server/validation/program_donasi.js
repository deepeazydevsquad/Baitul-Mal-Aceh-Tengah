const { Bank, Wakalah } = require("../models");
const multer = require("multer");
const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

const validation = {};

const uploadPath = path.join(__dirname, "../uploads/img/program_donasi");
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadPath),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    let safeName = req.body.name || "program_donasi";
    safeName = safeName
      .replace(/\s+/g, "_")
      .replace(/[^a-zA-Z0-9_]/g, "")
      .toLowerCase();

    const filename = `${safeName}${ext}`;
    req.body.photoPath = filename;
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
  limits: { fileSize: 1 * 1024 * 1024 },
});

validation.checkIdWakalah = async (value) => {
  if (value != "0") {
    console.log("+++++++");
    console.log(value);
    console.log("+++++++");
    const check = await Wakalah.findByPk(value);
    if (!check) {
      throw new Error("ID Wakalah tidak terdaftar di pangkalan data");
    }
  }
  return true;
};

module.exports = validation;
