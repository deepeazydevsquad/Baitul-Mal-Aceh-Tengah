const {
  Op,
  sequelize,
  Realisasi_permohonan,
  Validasi_syarat_permohonan,
  Permohonan,
  Kegiatan,
  Bank,
  Member,
} = require("../models");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const moment = require("moment");
const { convertToRP } = require("../helper/currencyHelper");
const { validationResult } = require("express-validator");
const {
  detectFileType,
  randomStoredFilename,
  removeStoredFile,
  resolveStoredPath,
  writeStoredFile,
} = require("../helper/uploadStorageHelper");

const validation = {};

// === VALIDATION DATABASE CHECKS ===
validation.check_id_permohonan_bantuan = async (value) => {
  const check = await Realisasi_permohonan.findByPk(value);
  if (!check) {
    throw new Error("Permohonan tidak terdaftar di pangkalan data");
  }
  return true;
};

validation.check_id_validasi_permohonan_bantuan = async (value, { req }) => {
  const body = req.body;
  const check = await Validasi_syarat_permohonan.findOne({
    where: {
      id: value,
      realisasi_permohonan_id: body.id,
    },
  });

  if (!check) {
    throw new Error("Validasi file syarat tidak terdaftar di pangkalan data");
  }

  // Pastikan status bukan approve
  if (check.status === "approve") {
    throw new Error(
      "Validasi file syarat sudah disetujui, tidak dapat diubah lagi"
    );
  }

  return true;
};

validation.check_berkas = async (value) => {
  const totalBerkas = await Validasi_syarat_permohonan.count({
    where: { realisasi_permohonan_id: value },
  });

  if (totalBerkas === 0) {
    throw new Error("Belum ada berkas yang diunggah untuk permohonan ini.");
  }

  const allValidasi = await Validasi_syarat_permohonan.findAll({
    where: { realisasi_permohonan_id: value },
    attributes: ["id", "status"],
    raw: true,
  });

  const rejected = allValidasi.some((v) => v.status === "reject");
  if (rejected) {
    throw new Error("Ada berkas yang ditolak. Harap perbaiki terlebih dahulu.");
  }

  const allApproved = allValidasi.every((v) => v.status === "approve");
  if (!allApproved) {
    throw new Error(
      "Masih ada berkas yang belum disetujui. Harap approve semua berkas terlebih dahulu."
    );
  }

  return true;
};

validation.check_biaya_disetujui = async (value, { req }) => {
  // Ambil kegiatan_id langsung lewat relasi Realisasi → Permohonan
  const realisasi = await Realisasi_permohonan.findOne({
    where: { id: req.body.id },
    attributes: [],
    include: [
      {
        model: Permohonan,
        attributes: ["kegiatan_id"],
        required: true,
      },
    ],
    raw: true,
    nest: true,
  });

  if (!realisasi) throw new Error("Data realisasi permohonan tidak ditemukan");

  const kegiatanId = realisasi.Permohonan.kegiatan_id;

  // Jalankan dua query paralel
  const [dataKegiatan, dataRealisasiTotal] = await Promise.all([
    Kegiatan.findOne({
      where: { id: kegiatanId },
      attributes: ["jumlah_dana"],
      raw: true,
    }),
    Realisasi_permohonan.findOne({
      attributes: [
        [
          sequelize.fn(
            "COALESCE",
            sequelize.fn("SUM", sequelize.col("nominal_realisasi")),
            0
          ),
          "total",
        ],
      ],
      include: [
        {
          model: Permohonan,
          where: { kegiatan_id: kegiatanId },
          required: true,
          attributes: [],
        },
      ],
      raw: true,
    }),
  ]);

  if (!dataKegiatan) throw new Error("Data kegiatan tidak ditemukan");

  const totalRealisasi = Number(dataRealisasiTotal.total) || 0;
  const sisaDana = dataKegiatan.jumlah_dana - totalRealisasi;

  if (value > sisaDana) {
    throw new Error(
      `Nominal disetujui (${convertToRP(
        value
      )}) melebihi sisa dana kegiatan (${convertToRP(sisaDana)})`
    );
  }

  return true;
};

// === UPLOAD HANDLER ===
const uploadPath = path.join(
  __dirname,
  "../uploads/dokumen/permohonan_bantuan"
);
const DOCUMENT_EXTENSIONS = new Set([".pdf"]);
const DOCUMENT_FIELD_PATTERN = /^dokumen_[a-z0-9_]{1,110}$/;

if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

const parser = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 1 * 1024 * 1024,
    files: 1,
    fields: 20,
  },
  fileFilter(req, file, cb) {
    if (!DOCUMENT_FIELD_PATTERN.test(String(file.fieldname || ""))) {
      return cb(new Error("Field dokumen tidak valid."));
    }
    return cb(null, true);
  },
}).any();

validation.upload = function validationDocumentUpload(req, res, next) {
  parser(req, res, (error) => {
    if (error) {
      return res.status(400).json({
        status: "error",
        error: true,
        message: "Unggahan dokumen tidak valid.",
        code: "UPLOAD_REJECTED",
      });
    }

    const files = Array.isArray(req.files) ? req.files : [];
    if (files.length > 1) {
      return res.status(400).json({
        status: "error",
        error: true,
        message: "Hanya satu dokumen yang dapat diunggah.",
        code: "UPLOAD_REJECTED",
      });
    }
    if (files.length === 1) {
      const file = files[0];
      const detectedType = detectFileType(file.buffer);
      if (
        !detectedType ||
        !detectedType.allowedExtensions.has(
          path.extname(String(file.originalname || "")).toLowerCase()
        )
      ) {
        return res.status(400).json({
          status: "error",
          error: true,
          message: "Isi file harus berupa PDF yang valid.",
          code: "UPLOAD_REJECTED",
        });
      }
      req.validationReplacementPending = {
        fieldname: file.fieldname,
        file_name: file.fieldname.replace(/^dokumen_/, ""),
        buffer: file.buffer,
      };
    }
    if (req.body) delete req.body.file;
    return next();
  });
};

validation.persistValidatedUpload = async (req, res, next) => {
  if (!req.validationReplacementPending) return next();
  if (!validationResult(req).isEmpty()) return next();

  try {
    await fs.promises.mkdir(uploadPath, { recursive: true });
    const realDirectory = await fs.promises.realpath(uploadPath);
    const filename = randomStoredFilename("dokumen", ".pdf");
    await writeStoredFile(
      realDirectory,
      filename,
      req.validationReplacementPending.buffer,
      0o600
    );
    req.validationReplacementUpload = {
      filename,
      directory: realDirectory,
      file_name: req.validationReplacementPending.file_name,
    };
    delete req.validationReplacementPending;
    return next();
  } catch {
    return res.status(500).json({
      status: "error",
      error: true,
      message: "Dokumen gagal diproses.",
      code: "UPLOAD_FAILED",
    });
  }
};

validation.removeUploadedDocument = (req) => {
  const directory =
    req?.validationReplacementUpload?.directory || uploadPath;
  const filename = req?.validationReplacementUpload?.filename;
  if (
    resolveStoredPath(directory, filename, {
      allowedExtensions: DOCUMENT_EXTENSIONS,
    })
  ) {
    return removeStoredFile(directory, filename, {
      allowedExtensions: DOCUMENT_EXTENSIONS,
    });
  }
  return false;
};

validation.uploadPath = uploadPath;
validation.DOCUMENT_EXTENSIONS = DOCUMENT_EXTENSIONS;

module.exports = validation;
