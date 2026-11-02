// ============================================
// VALIDATION: validation/survey_lapangan.js
// ============================================
const {
  Op,
  Surveyor_kegiatan,
  Surveyor,
  Survey_permohonan,
  Realisasi_permohonan,
  Permohonan,
  Member,
} = require("../models");
const multer = require("multer");
const sharp = require("sharp");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const {
  cleanupRequestUploads,
  removeUploadedFiles,
  SURVEY_UPLOAD_DIRECTORY,
} = require("../helper/uploadedFileHelper");

const validation = {};

// Check access code valid dan active
validation.check_access_code = async (value) => {
  const check = await Surveyor_kegiatan.findOne({
    where: {
      access_code: value,
      status: "active",
    },
  });

  if (!check) {
    throw new Error("Access Code tidak terdaftar atau tidak aktif");
  }

  return true;
};

// Check member exists
validation.check_id_member = async (value) => {
  const check = await Member.findOne({
    where: {
      id: value,
    },
  });

  if (!check) {
    throw new Error("Member tidak terdaftar di pangkalan data");
  }

  return true;
};

async function getCapabilityScope(capability) {
  const capabilityId = Number(capability?.id);
  if (!Number.isInteger(capabilityId) || capabilityId <= 0) {
    throw new Error("Capability survei tidak valid");
  }

  const surveyorKegiatan = await Surveyor_kegiatan.findOne({
    where: { id: capabilityId, status: "active" },
    attributes: ["id", "kegiatan_id"],
  });

  if (!surveyorKegiatan) {
    throw new Error("Capability survei tidak valid atau tidak aktif");
  }
  return surveyorKegiatan;
}

// Check member belum pernah di-survey dalam capability ini
validation.check_member_not_surveyed = async (member_id, capability) => {
  const surveyorKegiatan = await getCapabilityScope(capability);
  const existingSurvey = await Survey_permohonan.findOne({
    where: {
      surveyor_kegiatan_id: surveyorKegiatan.id,
    },
    include: [
      {
        model: Permohonan,
        required: true,
        where: {
          member_id: member_id,
        },
        attributes: ["id"],
      },
    ],
  });

  if (existingSurvey) {
    throw new Error("Member ini sudah pernah disurvey dalam kegiatan ini");
  }

  return true;
};

// Check member termasuk dalam scope capability dan eligible untuk survey
validation.check_member_in_capability = async (member_id, capability) => {
  const surveyorKegiatan = await getCapabilityScope(capability);
  const member = await Member.findOne({
    where: { id: member_id },
    attributes: ["id", "fullname"],
  });

  if (!member) {
    throw new Error("Member tidak ditemukan di pangkalan data");
  }

  // Check if member ada di Realisasi_permohonan dengan status process_lapangan
  // untuk kegiatan ini
  const eligibleRealisasi = await Realisasi_permohonan.findOne({
    where: { status: "process_lapangan" },
    include: [
      {
        model: Permohonan,
        required: true,
        where: {
          member_id: member_id,
          kegiatan_id: surveyorKegiatan.kegiatan_id,
        },
        attributes: ["id"],
      },
    ],
  });

  if (!eligibleRealisasi) {
    throw new Error(
      "Member tidak eligible untuk survey ini (status bukan process_lapangan atau bukan bagian dari kegiatan ini)"
    );
  }

  return true;
};

// === UPLOAD HANDLER ===
const uploadPath = SURVEY_UPLOAD_DIRECTORY;
const SURVEY_UPLOAD_FIELDS = [
  { name: "dokumentasi", maxCount: 10 },
  { name: "form_survey", maxCount: 1 },
  { name: "berita_acara", maxCount: 1 },
];

// Create upload directory if not exists
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/png", "image/jpeg", "image/jpg"];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Format file harus PNG atau JPEG."), false);
  }
};

function createSurveyUpload(directory = uploadPath) {
  fs.mkdirSync(directory, { recursive: true });
  const upload = multer({
    storage: multer.memoryStorage(),
    fileFilter,
    limits: {
      fileSize: 1 * 1024 * 1024, // 1 MB per file
      files: 12, // Max 12 files (10 dokumentasi + 2 single files) total 12 MB per request
      fields: 32,
      parts: 44, // 32 bounded fields + 12 files
      fieldSize: 16 * 1024,
      fieldNameSize: 128,
    },
  });
  const uploadFiles = upload.fields(SURVEY_UPLOAD_FIELDS);

  async function persistImages(req) {
    const normalizedFiles = {};
    let writtenFiles = [];

    try {
      for (const field of SURVEY_UPLOAD_FIELDS) {
        const files = req.files?.[field.name] || [];
        normalizedFiles[field.name] = [];
        for (const file of files) {
          const image = sharp(file.buffer, {
            limitInputPixels: 25_000_000,
          });
          const metadata = await image.metadata();
          if (!["jpeg", "png"].includes(metadata.format)) {
            throw new Error("Isi file bukan gambar PNG atau JPEG.");
          }
          const extension = metadata.format === "png" ? ".png" : ".jpg";
          const output =
            extension === ".png"
              ? await image.png({ compressionLevel: 9 }).toBuffer()
              : await image.jpeg({ quality: 88, mozjpeg: true }).toBuffer();
          const baseName =
            field.name === "dokumentasi" ? "dokumentasi" : field.name;
          const filename = `${baseName}_${Date.now()}_${crypto
            .randomBytes(12)
            .toString("hex")}${extension}`;
          const targetPath = path.resolve(directory, filename);
          await fs.promises.writeFile(targetPath, output, {
            flag: "wx",
            mode: 0o600,
          });
          writtenFiles.push({ filename, fieldname: field.name });
          normalizedFiles[field.name].push({
            ...file,
            filename,
            destination: directory,
            path: targetPath,
            mimetype: extension === ".png" ? "image/png" : "image/jpeg",
            buffer: undefined,
          });
        }
      }
      req.files = normalizedFiles;
      return true;
    } catch {
      removeUploadedFiles(writtenFiles, directory, { allowedFields: null });
      return false;
    }
  }

  return {
    upload,
    middleware(req, res, next) {
      uploadFiles(req, res, (error) => {
        if (error) {
          return res.status(400).json({
            status: "error",
            error: true,
            message: "Unggahan file tidak valid.",
            code: "UPLOAD_REJECTED",
          });
        }
        persistImages(req).then((valid) => {
          if (!valid) {
            return res.status(400).json({
              status: "error",
              error: true,
              message: "Isi file harus berupa gambar PNG atau JPEG yang valid.",
              code: "UPLOAD_REJECTED",
            });
          }
          return next();
        });
      });
    },
  };
}

const defaultSurveyUpload = createSurveyUpload(uploadPath);
validation.upload = defaultSurveyUpload.upload;
validation.uploadSurveyFiles = defaultSurveyUpload.middleware;
validation.createSurveyUploadMiddleware = (directory) =>
  createSurveyUpload(directory).middleware;

validation.removeUntrustedUploadMetadata = (req, res, next) => {
  if (
    req.body &&
    typeof req.body === "object" &&
    Object.prototype.hasOwnProperty.call(req.body, "uploaded_files")
  ) {
    delete req.body.uploaded_files;
  }
  if (
    req.body &&
    typeof req.body === "object" &&
    Object.prototype.hasOwnProperty.call(req.body, "access_code")
  ) {
    delete req.body.access_code;
  }
  return next();
};

validation.uploadPath = uploadPath;
validation.SURVEY_UPLOAD_FIELDS = SURVEY_UPLOAD_FIELDS;

module.exports = validation;
