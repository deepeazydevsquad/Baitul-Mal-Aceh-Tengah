const { Kegiatan } = require("../models");
const path = require("path");
const { validationResult } = require("express-validator");
const {
  createSecureImageUpload,
} = require("../helper/secureImageUploadHelper");

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

const bannerUpload = createSecureImageUpload({
  directory: uploadPath,
  field: "banner",
  property: "programKegiatanBanner",
  bodyFieldsToRemove: ["bannerPath"],
  required: false,
  maxSize: 2 * 1024 * 1024,
  width: 602,
  height: 330,
  filenamePrefix: "program-kegiatan",
  outputFormat: "jpg",
  dimensionsMessage: "Ukuran gambar harus 602x330 piksel",
});

validation.upload = (req, res, next) => {
  res.once("finish", () => {
    if (res.statusCode >= 400) {
      bannerUpload.remove(req);
    }
  });
  return bannerUpload.middleware(req, res, next);
};
validation.check_dimensions = () => (req, res, next) => next();
validation.cleanupRejectedUpload = (req, res, next) => {
  if (!validationResult(req).isEmpty()) {
    bannerUpload.remove(req);
  }
  return next();
};
validation.removeUploadedBanner = bannerUpload.remove;
validation.uploadPath = uploadPath;

module.exports = validation;
