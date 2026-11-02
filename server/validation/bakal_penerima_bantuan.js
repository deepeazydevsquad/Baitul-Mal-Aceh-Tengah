const {
  Op,
  sequelize,
  Realisasi_permohonan,
  Permohonan,
  Kegiatan,
  Bank,
  Member,
} = require("../models");
const path = require("path");
const moment = require("moment");
const {
  createSecureDocumentUpload,
} = require("../helper/secureDocumentUploadHelper");

const validation = {};

// ========================================
// VALIDATION DATABASE CHECKS
// ========================================
validation.check_id_realisasi = async (value) => {
  const check = await Realisasi_permohonan.findByPk(value);
  if (!check) {
    throw new Error("Realisasi tidak terdaftar di pangkalan data");
  }
  return true;
};

validation.check_status_belum_direalisasi = async (value) => {
  const check = await Realisasi_permohonan.findOne({
    where: { id: value },
    attributes: ["status_realisasi", "status"],
    raw: true,
  });

  if (!check) {
    throw new Error("Realisasi tidak ditemukan");
  }

  if (check.status !== "approve") {
    throw new Error(
      "Realisasi belum disetujui, tidak dapat melakukan realisasi bantuan"
    );
  }

  if (check.status_realisasi === "sudah_direalisasi") {
    throw new Error("Realisasi sudah direalisasi dan tidak dapat diubah");
  }

  return true;
};

validation.check_status_approve = async (value) => {
  const check = await Realisasi_permohonan.findOne({
    where: { id: value },
    attributes: ["status", "status_realisasi"],
    raw: true,
  });

  if (!check) {
    throw new Error("Realisasi tidak ditemukan");
  }

  if (check.status !== "approve") {
    throw new Error("Realisasi belum disetujui");
  }

  return true;
};

validation.check_status_sudah_direalisasi = async (value) => {
  const check = await Realisasi_permohonan.findOne({
    where: { id: value },
    attributes: ["status_realisasi"],
    raw: true,
  });

  if (!check) {
    throw new Error("Realisasi tidak ditemukan");
  }

  if (check.status_realisasi !== "sudah_direalisasi") {
    throw new Error("Realisasi belum direalisasi, tidak dapat dibatalkan");
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

validation.check_tanggal_realisasi = async (value) => {
  const today = moment().format("YYYY-MM-DD");
  if (moment(value).isAfter(today)) {
    throw new Error("Tanggal realisasi tidak boleh lebih dari hari ini");
  }
  return true;
};

validation.check_nominal_realisasi = async (value, { req }) => {
  const { id } = req.body;

  const realisasi = await Realisasi_permohonan.findOne({
    where: { id },
    attributes: ["biaya_disetujui"],
    raw: true,
  });

  if (!realisasi) {
    throw new Error("Realisasi tidak ditemukan");
  }

  if (value > realisasi.biaya_disetujui) {
    throw new Error(
      `Nominal realisasi tidak boleh melebihi biaya yang disetujui (Rp ${realisasi.biaya_disetujui.toLocaleString(
        "id-ID"
      )})`
    );
  }

  if (value <= 0) {
    throw new Error("Nominal realisasi harus lebih dari 0");
  }

  return true;
};

validation.check_selected_ids = async (value) => {
  try {
    const ids = JSON.parse(value);

    if (!Array.isArray(ids) || ids.length === 0) {
      throw new Error("Selected IDs harus berupa array dan tidak boleh kosong");
    }

    // Validasi setiap ID
    const checks = await Promise.all(
      ids.map((id) =>
        Realisasi_permohonan.findOne({
          where: {
            id,
            status: "approve",
            status_realisasi: "sudah_direalisasi",
            berita_acara: null,
            [Op.or]: [
              { bukti_transfer: { [Op.not]: null } },
              { mou: { [Op.not]: null } },
            ],
          },
          attributes: ["id"],
        })
      )
    );

    const invalidIds = ids.filter((id, index) => !checks[index]);
    if (invalidIds.length > 0) {
      throw new Error(
        `ID tidak valid atau tidak memenuhi syarat: ${invalidIds.join(", ")}`
      );
    }

    return true;
  } catch (error) {
    throw new Error(error.message || "Format Selected IDs tidak valid");
  }
};

validation.check_status_sudah_direalisasi = async (value) => {
  const check = await Realisasi_permohonan.findOne({
    where: { id: value },
    attributes: ["status_realisasi"],
    raw: true,
  });

  if (!check) {
    throw new Error("Realisasi tidak ditemukan");
  }

  if (check.status_realisasi !== "sudah_direalisasi") {
    throw new Error("Realisasi belum direalisasi, tidak dapat dibatalkan");
  }

  return true;
};

// ========================================
// UPLOAD HANDLER - BUKTI REALISASI
// ========================================
const uploadPathRealisasi = path.join(
  __dirname,
  "../uploads/dokumen/bakal_penerima_bantuan/bukti_realisasi"
);

const realisasiUpload = createSecureDocumentUpload({
  directory: uploadPathRealisasi,
  field: "bukti_realisasi",
  property: "buktiRealisasiDocument",
  bodyFieldsToRemove: ["bukti_realisasi"],
  required: true,
  maxSize: 1 * 1024 * 1024,
  filenamePrefix: "bukti-realisasi",
});

// ========================================
// UPLOAD HANDLER - BERITA ACARA
// ========================================
const uploadPathBeritaAcara = path.join(
  __dirname,
  "../uploads/dokumen/bakal_penerima_bantuan/berita_acara"
);

const beritaAcaraUpload = createSecureDocumentUpload({
  directory: uploadPathBeritaAcara,
  field: "berita_acara",
  property: "beritaAcaraDocument",
  bodyFieldsToRemove: ["berita_acara"],
  required: true,
  maxSize: 1 * 1024 * 1024,
  filenamePrefix: "berita-acara",
});

// ========================================
// MULTER UPLOAD CONFIGS
// ========================================
validation.single = {
  upload: (fieldName) => {
    return (req, res, next) => {
      const upload =
        fieldName === "bukti_realisasi"
          ? realisasiUpload
          : fieldName === "berita_acara"
            ? beritaAcaraUpload
            : null;
      if (!upload) {
        return res.status(400).json({
          error: true,
          error_msg: "Field unggahan tidak valid.",
        });
      }
      return upload.middleware(req, res, (error) => {
        if (error) return next(error);
        return upload.persist(req, res, next);
      });
    };
  },
};

validation.uploadPathRealisasi = uploadPathRealisasi;
validation.uploadPathBeritaAcara = uploadPathBeritaAcara;
validation.removeUploadedRealisasi = realisasiUpload.remove;
validation.removeUploadedBeritaAcara = beritaAcaraUpload.remove;

module.exports = validation;
