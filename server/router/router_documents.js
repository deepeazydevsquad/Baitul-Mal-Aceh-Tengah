const express = require("express");
const {
  Op,
} = require("../models");
const {
  Permohonan,
  Realisasi_permohonan,
  Validasi_syarat_permohonan,
  Survey_permohonan,
  Surveyor_kegiatan,
  Riwayat_pengumpulan,
  Riwayat_donasi,
} = require("../models");
const {
  authenticateAnyPrincipal,
} = require("../middleware/authenticateToken");
const { hasPermission } = require("../middleware/authorizePermission");
const { sendPrivateFile } = require("../helper/privateFileHelper");
const {
  loadSurveyCapability,
} = require("../helper/surveyCapabilityHelper");

const router = express.Router();
const VALIDATION_FOLDER = "dokumen/permohonan_bantuan";
const REALISASI_FOLDER = "dokumen/bakal_penerima_bantuan/bukti_realisasi";
const BERITA_ACARA_FOLDER =
  "dokumen/bakal_penerima_bantuan/berita_acara";
const SURVEY_FOLDER = "dokumen/survey_lapangan";
const SK_FOLDER = "img/sk_penetapan";
const PAYMENT_FOLDERS = {
  zakat: "img/zakat",
  infaq: "img/infaq",
  donasi: "img/donasi",
};

function adminHas(req, permission) {
  return (
    req.user?.principalType === "administrator" &&
    (Number(req.user.grup_id) === 1 ||
      hasPermission(req.user.group_access, permission))
  );
}

function deny(res) {
  return res.status(403).json({
    error: true,
    error_msg: "Anda tidak memiliki akses ke dokumen ini.",
    code: "PERMISSION_DENIED",
  });
}

router.get(
  "/documents/validation/:id",
  authenticateAnyPrincipal,
  async (req, res, next) => {
    try {
      const record = await Validasi_syarat_permohonan.findByPk(req.params.id, {
        attributes: ["id", "path"],
        include: [
          {
            model: Realisasi_permohonan,
            required: true,
            attributes: ["id"],
            include: [
              {
                model: Permohonan,
                required: true,
                attributes: ["id", "member_id"],
              },
            ],
          },
        ],
      });
      if (!record?.path) {
        return res.status(404).json({
          error: true,
          error_msg: "Dokumen tidak ditemukan.",
        });
      }

      const ownerId =
        record.Realisasi_permohonan?.Permohonan?.member_id;
      const allowedAdmin = adminHas(req, { menuId: 2, submenuId: 3 });
      const allowedMember =
        req.user.principalType === "member" &&
        Number(ownerId) === Number(req.user.id);
      if (!allowedAdmin && !allowedMember) return deny(res);

      return sendPrivateFile(res, VALIDATION_FOLDER, record.path);
    } catch (error) {
      return next(error);
    }
  }
);

router.get(
  "/documents/realisasi/:id/:field",
  authenticateAnyPrincipal,
  async (req, res, next) => {
    const allowedFields = ["berita_acara", "bukti_transfer", "mou"];
    if (!allowedFields.includes(req.params.field)) return deny(res);

    try {
      const record = await Realisasi_permohonan.findByPk(req.params.id, {
        attributes: ["id", ...allowedFields],
        include: [
          {
            model: Permohonan,
            required: true,
            attributes: ["id", "member_id"],
          },
        ],
      });
      const storedPath = record?.[req.params.field];
      if (!storedPath) {
        return res.status(404).json({
          error: true,
          error_msg: "Dokumen tidak ditemukan.",
        });
      }

      const allowedAdmin = adminHas(req, { menuId: 2, submenuId: 3 });
      const allowedMember =
        req.user.principalType === "member" &&
        Number(record.Permohonan?.member_id) === Number(req.user.id);
      if (!allowedAdmin && !allowedMember) return deny(res);

      const folder =
        req.params.field === "berita_acara"
          ? BERITA_ACARA_FOLDER
          : REALISASI_FOLDER;
      return sendPrivateFile(res, folder, storedPath);
    } catch (error) {
      return next(error);
    }
  }
);

router.get(
  "/documents/payment/:kind/:id/:field",
  authenticateAnyPrincipal,
  async (req, res, next) => {
    const kind = req.params.kind;
    const allowedFields = ["bukti_transfer", "bukti_setoran"];
    if (
      !PAYMENT_FOLDERS[kind] ||
      !allowedFields.includes(req.params.field)
    ) {
      return deny(res);
    }

    try {
      let record;
      if (kind === "donasi") {
        record = await Riwayat_donasi.findByPk(req.params.id, {
          attributes: ["id", "member_id", ...allowedFields],
        });
      } else {
        const typeFilter =
          kind === "infaq"
            ? { tipe: "infaq" }
            : { tipe: { [Op.ne]: "infaq" } };
        record = await Riwayat_pengumpulan.findOne({
          where: { id: req.params.id, ...typeFilter },
          attributes: ["id", "member_id", ...allowedFields],
        });
      }

      const storedPath = record?.[req.params.field];
      if (!storedPath) {
        return res.status(404).json({
          error: true,
          error_msg: "Dokumen tidak ditemukan.",
        });
      }

      const allowedAdmin = adminHas(req, { menuId: 2, submenuId: 1 });
      const allowedMember =
        req.user.principalType === "member" &&
        Number(record.member_id) === Number(req.user.id);
      if (!allowedAdmin && !allowedMember) return deny(res);

      const subfolder =
        req.params.field === "bukti_transfer"
          ? "bukti_transfer"
          : "bukti_setoran";
      return sendPrivateFile(
        res,
        `${PAYMENT_FOLDERS[kind]}/${subfolder}`,
        storedPath
      );
    } catch (error) {
      return next(error);
    }
  }
);

router.get("/documents/sk/:id", async (req, res, next) => {
  try {
    const record = await Surveyor_kegiatan.findByPk(req.params.id, {
      attributes: ["id", "sk", "access_code", "status"],
    });
    if (!record?.sk) {
      return res.status(404).json({
        error: true,
        error_msg: "Dokumen tidak ditemukan.",
      });
    }

    let allowed = false;
    if (req.headers.authorization) {
      return authenticateAnyPrincipal(req, res, () => {
        if (!adminHas(req, { menuId: 2, submenuId: 3 })) return deny(res);
        return sendPrivateFile(res, SK_FOLDER, record.sk);
      });
    }

    const capability = await loadSurveyCapability(req);
    allowed =
      record.status === "active" &&
      capability &&
      Number(capability.id) === Number(record.id);
    if (!allowed) return deny(res);
    return sendPrivateFile(res, SK_FOLDER, record.sk);
  } catch (error) {
    return next(error);
  }
});

router.get("/documents/survey/:id/:field", async (req, res, next) => {
  const allowedFields = ["form_survey", "berita_acara", "dokumentasi"];
  if (!allowedFields.includes(req.params.field)) return deny(res);

  try {
    const record = await Survey_permohonan.findByPk(req.params.id, {
      attributes: ["id", "surveyor_kegiatan_id", ...allowedFields],
      include: [
        {
          model: Surveyor_kegiatan,
          required: true,
          attributes: ["id", "access_code", "status"],
        },
      ],
    });
    if (!record?.[req.params.field]) {
      return res.status(404).json({
        error: true,
        error_msg: "Dokumen tidak ditemukan.",
      });
    }

    if (req.headers.authorization) {
      return authenticateAnyPrincipal(req, res, () => {
        if (!adminHas(req, { menuId: 2, submenuId: 3 })) return deny(res);
        return sendPrivateFile(res, SURVEY_FOLDER, record[req.params.field]);
      });
    }

    const capability = await loadSurveyCapability(req);
    const allowed =
      record.Surveyor_kegiatan?.status === "active" &&
      capability &&
      Number(capability.id) ===
        Number(record.Surveyor_kegiatan?.id);
    if (!allowed) return deny(res);
    return sendPrivateFile(res, SURVEY_FOLDER, record[req.params.field]);
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
module.exports.resolvePrivateFile =
  require("../helper/privateFileHelper").resolvePrivateFile;
