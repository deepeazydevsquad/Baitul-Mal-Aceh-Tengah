const {
  sequelize,
  Realisasi_permohonan,
  Permohonan,
  Kegiatan,
  Bank,
  Member,
  Syarat,
  Syarat_kegiatan,
} = require("../models");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const {
  getKegiatanPeriodWhere,
  validateKegiatanPeriod,
} = require("../helper/kegiatanPeriodHelper");

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
  const kegiatan = await Kegiatan.findByPk(value, {
    attributes: [
      "id",
      "status_kegiatan",
      "tahun",
      "start_date",
      "end_date",
    ],
  });
  const period = validateKegiatanPeriod(kegiatan);
  if (!period.valid) {
    throw new Error(period.message);
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
  const check = await Member.findByPk(value);
  if (!check) {
    throw new Error("Member tidak terdaftar di pangkalan data");
  }

  return true;
};

validation.check_member_can_add_permohonan = async (value) => {
  const member = await Member.findByPk(value);
  if (!member) {
    throw new Error("Member tidak terdaftar di pangkalan data");
  }

  const existing = await Permohonan.findOne({
    where: { member_id: value },
    attributes: ["id"],
    include: [
      {
        model: Kegiatan,
        required: true,
        attributes: [],
        where: getKegiatanPeriodWhere(),
      },
    ],
  });

  if (existing) {
    throw new Error("Member sudah mempunyai permohonan");
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
const uploadPath = path.resolve(
  __dirname,
  "../uploads/dokumen/permohonan_bantuan"
);
const MAX_MEMBER_DOCUMENTS = 10;
const MAX_MEMBER_DOCUMENT_SIZE = 1 * 1024 * 1024;
const MEMBER_DOCUMENT_FIELD_PATTERN = /^dokumen_[a-z0-9_]{1,110}$/;

function generateDocumentFieldName(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[()]/g, "")
    .replace(/[^a-z0-9_]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function isAllowedDocumentField(fieldname) {
  return MEMBER_DOCUMENT_FIELD_PATTERN.test(String(fieldname || ""));
}

function detectUploadedFileType(buffer) {
  if (!Buffer.isBuffer(buffer)) return null;

  if (
    buffer.length >= 5 &&
    buffer.subarray(0, 5).toString("ascii") === "%PDF-"
  ) {
    return {
      mimeType: "application/pdf",
      extension: ".pdf",
      allowedExtensions: new Set([".pdf"]),
    };
  }

  if (
    buffer.length >= 8 &&
    buffer.subarray(0, 8).equals(
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
    )
  ) {
    return {
      mimeType: "image/png",
      extension: ".png",
      allowedExtensions: new Set([".png"]),
    };
  }

  if (
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) {
    return {
      mimeType: "image/jpeg",
      extension: ".jpg",
      allowedExtensions: new Set([".jpg", ".jpeg"]),
    };
  }

  return null;
}

function validateUploadedDocument(file) {
  if (!isAllowedDocumentField(file.fieldname)) {
    throw new Error("Field dokumen tidak valid.");
  }

  const clientExtension = path
    .extname(String(file.originalname || ""))
    .toLowerCase();
  const detectedType = detectUploadedFileType(file.buffer);
  if (!detectedType) {
    throw new Error("Isi file harus PDF, JPEG, JPG, atau PNG.");
  }

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

function isPathInsideDirectory(directory, targetPath) {
  const relativePath = path.relative(
    path.resolve(directory),
    path.resolve(targetPath)
  );
  return (
    relativePath !== "" &&
    relativePath !== ".." &&
    !relativePath.startsWith(`..${path.sep}`) &&
    !path.isAbsolute(relativePath)
  );
}

function createPermohonanUploadMiddleware(directory = uploadPath) {
  const resolvedDirectory = path.resolve(directory);
  const parser = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: MAX_MEMBER_DOCUMENT_SIZE,
      files: MAX_MEMBER_DOCUMENTS,
      fields: 30,
    },
    fileFilter(req, file, cb) {
      if (!isAllowedDocumentField(file.fieldname)) {
        return cb(new Error("Field dokumen tidak valid."));
      }
      return cb(null, true);
    },
  }).any();

  return function memberDocumentUpload(req, res, next) {
    parser(req, res, (error) => {
      if (error) {
        return res.status(400).json({
          status: "error",
          error: true,
          message: "Unggahan file tidak valid.",
          code: "UPLOAD_REJECTED",
        });
      }

      try {
        if (
          req.body &&
          Object.prototype.hasOwnProperty.call(req.body, "arr_path")
        ) {
          delete req.body.arr_path;
        }

        const seenFields = new Set();
        const uploads = (Array.isArray(req.files) ? req.files : []).map(
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

        req.permohonanUploadDirectory = resolvedDirectory;
        req.permohonanUploadsPending = uploads;
        req.permohonanUploads = [];
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
}

async function loadDocumentFieldRules(kegiatanId) {
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
    const fieldFromName = generateDocumentFieldName(item.Syarat?.name);
    const fieldFromPath = generateDocumentFieldName(item.Syarat?.path);
    if (fieldFromName) {
      const fieldname = `dokumen_${fieldFromName}`;
      allowedFields.add(fieldname);
      requiredFields.add(fieldname);
    }
    if (fieldFromPath) {
      allowedFields.add(`dokumen_${fieldFromPath}`);
    }
  }
  return { allowedFields, requiredFields };
}

validation.validateAddRequest = (req, res, next) => {
  const { validationResult } = require("express-validator");
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();

  const message = errors
    .array()
    .map((error) => error.msg)
    .join(" ");
  return res.status(400).json({
    status: "error",
    error: true,
    message,
  });
};

validation.persistUploads = async (req, res, next) => {
  const directory =
    req.permohonanUploadDirectory || path.resolve(uploadPath);
  const pendingUploads = Array.isArray(req.permohonanUploadsPending)
    ? req.permohonanUploadsPending
    : [];
  const persistedUploads = [];

  try {
    const { allowedFields, requiredFields } = await loadDocumentFieldRules(
      Number(req.body?.kegiatan_id)
    );
    const invalidField = pendingUploads.find(
      (file) => !allowedFields.has(file.fieldname)
    );
    if (
      invalidField ||
      (allowedFields.size === 0 && pendingUploads.length > 0)
    ) {
      const error = new Error("Dokumen tidak sesuai dengan syarat kegiatan.");
      error.statusCode = 400;
      throw error;
    }

    const uploadedFields = new Set(
      pendingUploads.map((file) => file.fieldname)
    );
    const missingFields = [...requiredFields].filter(
      (fieldname) => !uploadedFields.has(fieldname)
    );
    if (missingFields.length > 0) {
      const error = new Error(
        "Semua dokumen persyaratan wajib diunggah."
      );
      error.statusCode = 400;
      throw error;
    }

    await fs.promises.mkdir(directory, { recursive: true });
    const realDirectory = await fs.promises.realpath(directory);
    req.permohonanUploadDirectory = realDirectory;
    for (const file of pendingUploads) {
      const filename = `${Date.now()}_${crypto
        .randomBytes(18)
        .toString("hex")}${file.extension}`;
      const targetPath = path.resolve(realDirectory, filename);
      if (!isPathInsideDirectory(realDirectory, targetPath)) {
        throw new Error("Path dokumen tidak valid.");
      }

      await fs.promises.writeFile(targetPath, file.buffer, {
        flag: "wx",
        mode: 0o600,
      });
      persistedUploads.push({
        fieldname: file.fieldname,
        file_name: file.file_name,
        path: filename,
      });
    }

    req.permohonanUploads = persistedUploads;
    delete req.permohonanUploadsPending;
    return next();
  } catch (error) {
    req.permohonanUploads = persistedUploads;
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
  const directory =
    req?.permohonanUploadDirectory || path.resolve(uploadPath);
  const uploads = Array.isArray(req?.permohonanUploads)
    ? req.permohonanUploads
    : [];

  await Promise.all(
    uploads.map(async (file) => {
      const filename = path.basename(String(file?.path || ""));
      const targetPath = path.resolve(directory, filename);
      if (!filename || !isPathInsideDirectory(directory, targetPath)) return;
      try {
        await fs.promises.unlink(targetPath);
      } catch {
        // Cleanup is best effort; the upload outcome must still be returned.
      }
    })
  );
};

validation.upload = createPermohonanUploadMiddleware(uploadPath);
validation.createPermohonanUploadMiddleware =
  createPermohonanUploadMiddleware;
validation.detectUploadedFileType = detectUploadedFileType;
validation.generateDocumentFieldName = generateDocumentFieldName;
validation.isAllowedDocumentField = isAllowedDocumentField;
validation.uploadPath = uploadPath;

module.exports = validation;
