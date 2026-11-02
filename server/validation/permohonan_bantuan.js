const {
  Op,
  sequelize,
  Realisasi_permohonan,
  Permohonan,
  Kegiatan,
  Bank,
  Member,
} = require("../models");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const moment = require("moment");
const { validationResult } = require("express-validator");
const {
  detectFileType,
  isPathInsideDirectory,
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

validation.check_status_permohonan_bantuan = async (value) => {
  const check = await Realisasi_permohonan.findOne({
    where: { id: value },
    attributes: ["status_realisasi"],
    raw: true,
  });

  if (!check) {
    throw new Error("Permohonan tidak ditemukan");
  }

  if (check.status_realisasi === "sudah_direalisasi") {
    throw new Error(
      "Status permohonan sudah direalisasi dan tidak dapat diubah"
    );
  }

  return true;
};

validation.check_id_kegiatan = async (value) => {
  const check = await Kegiatan.findByPk(value);
  if (!check) {
    throw new Error("Kegiatan tidak terdaftar di pangkalan data");
  }
  return true;
};

validation.check_id_bank = async (value) => {
  const check = await Bank.findByPk(value);
  if (!check) {
    throw new Error("Bank tidak terdaftar di pangkalan data");
  }
  return true;
};

validation.check_id_member = async (value, { req }) => {
  const body = req.body;

  const check = await Member.findByPk(value);
  if (!check) {
    throw new Error("Member tidak terdaftar di pangkalan data");
  }

  if (!body.id) {
    const check_permohonan = await Realisasi_permohonan.findOne({
      include: [
        {
          model: Permohonan,
          where: { member_id: value },
          required: true,
          attributes: [],
          include: [
            {
              model: Kegiatan,
              attributes: [],
              where: { tahun: moment().format("YYYY") },
              required: true,
            },
          ],
        },
      ],
    });
    if (check_permohonan) {
      throw new Error("Member sudah mempunyai permohonan");
    }
  }

  return true;
};

validation.check_nominal_yang_disetujui = async (value, { req }) => {
  const { id } = req.body;
  const [dataKegiatan, dataPermohonan] = await Promise.all([
    Kegiatan.findOne({
      where: { id },
      attributes: ["jumlah_dana", "jumlah_maksimal_nominal_bantuan"],
      raw: true,
    }),
    Realisasi_permohonan.findOne({
      raw: true,
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
          where: { kegiatan_id: id },
          required: true,
          attributes: [],
        },
      ],
    }),
  ]);

  if (value > dataKegiatan.jumlah_maksimal_nominal_bantuan) {
    throw new Error("Nominal yang disetujui melebihi batas maksimal bantuan");
  }

  if (value > dataKegiatan.jumlah_dana - dataPermohonan.total) {
    throw new Error("Nominal yang disetujui melebihi sisa dana kegiatan ini");
  }
  return true;
};

// === UPLOAD HANDLER ===
const uploadPath = path.join(
  __dirname,
  "../uploads/dokumen/permohonan_bantuan"
);
const MAX_ADMIN_DOCUMENTS = 10;
const MAX_ADMIN_DOCUMENT_SIZE = 1 * 1024 * 1024;
const ADMIN_DOCUMENT_FIELD_PATTERN = /^dokumen_[a-z0-9_]{1,110}$/;

if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

function isAllowedDocumentField(fieldname) {
  return ADMIN_DOCUMENT_FIELD_PATTERN.test(String(fieldname || ""));
}

function validateUploadedDocument(file) {
  if (!isAllowedDocumentField(file.fieldname)) {
    throw new Error("Field dokumen tidak valid.");
  }

  const detectedType = detectFileType(file.buffer);
  if (!detectedType) {
    throw new Error("Isi file harus PDF, JPEG, JPG, atau PNG.");
  }

  const clientExtension = path
    .extname(String(file.originalname || ""))
    .toLowerCase();
  if (!detectedType.allowedExtensions.has(clientExtension)) {
    throw new Error("Ekstensi file tidak sesuai dengan isi file.");
  }

  return {
    fieldname: file.fieldname,
    file_name: file.fieldname.replace(/^dokumen_/, ""),
    extension: detectedType.extension,
    buffer: file.buffer,
  };
}

const parser = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_ADMIN_DOCUMENT_SIZE,
    files: MAX_ADMIN_DOCUMENTS,
    fields: 40,
  },
  fileFilter(req, file, cb) {
    if (!isAllowedDocumentField(file.fieldname)) {
      return cb(new Error("Field dokumen tidak valid."));
    }
    return cb(null, true);
  },
}).any();

validation.upload = function adminDocumentUpload(req, res, next) {
  parser(req, res, (error) => {
    if (error) {
      return res.status(400).json({
        status: "error",
        error: true,
        message: "Unggahan dokumen tidak valid.",
        code: "UPLOAD_REJECTED",
      });
    }

    try {
      if (req.body) delete req.body.arr_path;
      const seenFields = new Set();
      const pending = (Array.isArray(req.files) ? req.files : []).map(
        (file) => {
          if (seenFields.has(file.fieldname)) {
            throw new Error(
              "Setiap field dokumen hanya boleh berisi satu file."
            );
          }
          seenFields.add(file.fieldname);
          return validateUploadedDocument(file);
        }
      );
      req.adminPermohonanUploadsPending = pending;
      req.adminPermohonanUploads = [];
      return next();
    } catch (uploadError) {
      return res.status(400).json({
        status: "error",
        error: true,
        message: uploadError.message,
        code: "UPLOAD_REJECTED",
      });
    }
  });
};

async function loadDocumentFieldRules(kegiatanId) {
  const { Syarat, Syarat_kegiatan } = require("../models");
  const syaratKegiatan = await Syarat_kegiatan.findAll({
    where: { kegiatan_id: kegiatanId },
    include: [
      {
        model: Syarat,
        required: true,
        attributes: ["name", "path"],
      },
    ],
  });
  const allowedFields = new Set();
  const requiredFields = new Set();
  for (const item of syaratKegiatan) {
    for (const value of [item.Syarat?.name, item.Syarat?.path]) {
      const field = String(value || "")
        .toLowerCase()
        .replace(/[()]/g, "")
        .replace(/[^a-z0-9_]/g, "_")
        .replace(/_+/g, "_")
        .replace(/^_+|_+$/g, "");
      if (!field) continue;
      const fieldname = `dokumen_${field}`;
      allowedFields.add(fieldname);
      if (value === item.Syarat?.path) requiredFields.add(fieldname);
    }
  }
  return { allowedFields, requiredFields };
}

validation.parseUploadData = (req) => {
  const dokumenMap = {};

  for (const file of req.adminPermohonanUploads || []) {
    dokumenMap[file.fieldname] = {
      file: file.path,
      file_name: file.file_name,
    };
  }

  for (const [key, value] of Object.entries(req.body || {})) {
    if (!key.endsWith("_meta")) continue;
    try {
      const meta = JSON.parse(value);
      const baseKey = key.slice(0, -"_meta".length);
      if (!isAllowedDocumentField(baseKey) || !meta || typeof meta !== "object") {
        continue;
      }
      const serverFile = dokumenMap[baseKey] || {};
      dokumenMap[key] = {
        id: Number.isInteger(Number(meta.id)) ? Number(meta.id) : undefined,
        status: ["keep", "replace", "remove", "new"].includes(meta.status)
          ? meta.status
          : undefined,
        file: serverFile.file,
        file_name: serverFile.file_name,
      };
    } catch {
      // Invalid client metadata is ignored. It must never select a file.
    }
  }

  return dokumenMap;
};

validation.persistValidatedUploads = async (req, res, next) => {
  if (!validationResult(req).isEmpty()) {
    return next();
  }

  const pending = Array.isArray(req.adminPermohonanUploadsPending)
    ? req.adminPermohonanUploadsPending
    : [];
  const persisted = [];

  try {
    const { allowedFields, requiredFields } = await loadDocumentFieldRules(
      Number(req.body?.kegiatan_id)
    );
    if (
      (allowedFields.size > 0 &&
        pending.some((file) => !allowedFields.has(file.fieldname))) ||
      (allowedFields.size === 0 && pending.length > 0)
    ) {
      const error = new Error("Dokumen tidak sesuai dengan syarat kegiatan.");
      error.statusCode = 400;
      throw error;
    }

    if (req.path?.endsWith("/add")) {
      const uploadedFields = new Set(pending.map((file) => file.fieldname));
      if ([...requiredFields].some((field) => !uploadedFields.has(field))) {
        const error = new Error("Semua dokumen persyaratan wajib diunggah.");
        error.statusCode = 400;
        throw error;
      }
    }
    if (req.path?.endsWith("/edit")) {
      for (const file of pending) {
        const rawMetadata = req.body?.[`${file.fieldname}_meta`];
        let metadata;
        try {
          metadata = JSON.parse(rawMetadata);
        } catch {
          metadata = null;
        }
        if (
          !metadata ||
          !["replace", "new"].includes(metadata.status)
        ) {
          const error = new Error(
            "Metadata dokumen unggahan tidak valid."
          );
          error.statusCode = 400;
          throw error;
        }
      }
    }

    await fs.promises.mkdir(uploadPath, { recursive: true });
    const realDirectory = await fs.promises.realpath(uploadPath);
    for (const file of pending) {
      const filename = randomStoredFilename("dokumen", file.extension);
      await writeStoredFile(realDirectory, filename, file.buffer, 0o600);
      persisted.push({
        fieldname: file.fieldname,
        file_name: file.file_name,
        path: filename,
      });
    }

    req.adminPermohonanUploads = persisted;
    req.adminPermohonanUploadDirectory = realDirectory;
    delete req.adminPermohonanUploadsPending;
    req.body.dokumenMap = validation.parseUploadData(req);
    return next();
  } catch (error) {
    req.adminPermohonanUploads = persisted;
    await validation.removeUploadedDocuments(req);
    return res.status(error.statusCode || 500).json({
      status: "error",
      error: true,
      message:
        error.statusCode && error.statusCode < 500
          ? error.message
          : "Dokumen gagal diproses.",
      code: "UPLOAD_FAILED",
    });
  }
};

validation.removeUploadedDocuments = async (req) => {
  const directory = req?.adminPermohonanUploadDirectory || uploadPath;
  for (const file of req?.adminPermohonanUploads || []) {
    const filename = file?.path;
    if (
      resolveStoredPath(directory, filename, {
        allowedExtensions: new Set([".pdf", ".png", ".jpg", ".jpeg"]),
      })
    ) {
      removeStoredFile(directory, filename, {
        allowedExtensions: new Set([".pdf", ".png", ".jpg", ".jpeg"]),
      });
    }
  }
};

validation.isPathInsideDirectory = isPathInsideDirectory;
validation.uploadPath = uploadPath;

module.exports = validation;
