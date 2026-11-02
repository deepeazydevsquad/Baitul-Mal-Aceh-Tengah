const express = require("express");
const { body } = require("express-validator");
const controllers = require("../modules/survey_lapangan/controllers/index");
const validation = require("../validation/survey_lapangan.js");
const validationHelper = require("../helper/handleErrorFile.js");
const {
  requireSurveyCapability,
} = require("../helper/surveyCapabilityHelper");
const {
  createPersistentRateLimiter,
} = require("../helper/rateLimitHelper");
const router = express.Router();

const sessionLimiter = createPersistentRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 15,
  keyGenerator: (req) => `survey-session:${req.ip}`,
  message: "Terlalu banyak permintaan sesi survei.",
});
const submitLimiter = createPersistentRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  keyGenerator: (req) => `survey-submit:${req.ip}`,
  message: "Terlalu banyak pengiriman survei.",
});

router.post(
  "/survey_lapangan/session",
  sessionLimiter,
  [
    body("access_code")
      .notEmpty()
      .withMessage("Access Code Tidak Boleh Kosong")
      .isString()
      .withMessage("Access Code Harus String")
      .custom(validation.check_access_code),
  ],
  controllers.create_session
);

// Get info survey lapangan by access code
router.post(
  "/survey_lapangan/info",
  requireSurveyCapability,
  [
  ],
  controllers.survey_lapangan
);

// Get info member by access code & member_id
router.post(
  "/survey_lapangan/info_member",
  requireSurveyCapability,
  [
    body("member_id")
      .notEmpty()
      .withMessage("Member ID Tidak Boleh Kosong")
      .isInt()
      .withMessage("Member ID Harus Angka")
      .custom(validation.check_id_member),
    body("member_id").custom((value, { req }) =>
      validation.check_member_in_capability(value, req.surveyCapability)
    ),
  ],
  controllers.get_info_member
);

// Submit survey lapangan
router.post(
  "/survey_lapangan/submit",
  submitLimiter,
  requireSurveyCapability,
  (req, res, next) => {
    req.surveyUploadPath = validation.uploadPath;
    next();
  },
  validation.uploadSurveyFiles,
  validation.removeUntrustedUploadMetadata,
  [
    body("member_id")
      .notEmpty()
      .withMessage("Member ID tidak boleh kosong")
      .isInt()
      .withMessage("Member ID harus angka")
      .custom(validation.check_id_member)
      .custom((value, { req }) =>
        validation.check_member_not_surveyed(value, req.surveyCapability)
      )
      .custom((value, { req }) =>
        validation.check_member_in_capability(value, req.surveyCapability)
      ),

    // Step 2: Data Responden
    body("tanggal_penilaian")
      .notEmpty()
      .withMessage("Tanggal penilaian harus diisi")
      .isDate()
      .withMessage("Format tanggal penilaian tidak valid"),

    body("nomor_ktp")
      .notEmpty()
      .withMessage("Nomor KTP harus diisi")
      .isLength({ min: 16, max: 16 })
      .withMessage("Nomor KTP harus 16 digit")
      .isNumeric()
      .withMessage("Nomor KTP harus berupa angka"),

    body("tempat_lahir")
      .notEmpty()
      .withMessage("Tempat lahir harus diisi")
      .isString()
      .withMessage("Tempat lahir harus berupa teks"),

    body("tanggal_lahir")
      .notEmpty()
      .withMessage("Tanggal lahir harus diisi")
      .isDate()
      .withMessage("Format tanggal lahir tidak valid"),

    body("nama_suami_istri")
      .notEmpty()
      .withMessage("Nama suami/istri harus diisi")
      .isString()
      .withMessage("Nama suami/istri harus berupa teks"),

    body("pekerjaan_suami_istri")
      .notEmpty()
      .withMessage("Pekerjaan suami/istri harus diisi")
      .isString()
      .withMessage("Pekerjaan suami/istri harus berupa teks"),

    body("jumlah_tanggungan")
      .notEmpty()
      .withMessage("Jumlah tanggungan harus diisi")
      .isInt({ min: 0 })
      .withMessage("Jumlah tanggungan harus berupa angka positif"),

    body("alamat")
      .notEmpty()
      .withMessage("Alamat harus diisi")
      .isString()
      .withMessage("Alamat harus berupa teks"),

    // Step 3: Pertanyaan Saringan
    body("jenis_kelamin")
      .notEmpty()
      .withMessage("Jenis kelamin harus diisi")
      .isIn(["laki_laki", "perempuan"])
      .withMessage("Jenis kelamin harus laki-laki atau perempuan"),

    body("status_pernikahan")
      .notEmpty()
      .withMessage("Status pernikahan harus diisi")
      .isString()
      .withMessage("Status pernikahan harus berupa teks"),

    body("usia_25_60")
      .notEmpty()
      .withMessage("Status usia 25-60 harus diisi")
      .isIn(["iya", "tidak"])
      .withMessage("Status usia 25-60 harus iya atau tidak"),

    body("penduduk_tetap")
      .notEmpty()
      .withMessage("Status penduduk tetap harus diisi")
      .isIn(["iya", "tidak"])
      .withMessage("Status penduduk tetap harus iya atau tidak"),

    body("penghasilan_kepala_keluarga")
      .notEmpty()
      .withMessage("Penghasilan kepala keluarga harus diisi")
      .isIn(["iya", "tidak"])
      .withMessage("Status penduduk tetap harus iya atau tidak"),

    // Step 4: Kondisi Peserta & Rumah
    body("kondisi_fisik")
      .notEmpty()
      .withMessage("Kondisi fisik harus diisi")
      .isString()
      .withMessage("Kondisi fisik harus berupa teks"),

    body("atap")
      .notEmpty()
      .withMessage("Kondisi atap harus diisi")
      .isString()
      .withMessage("Kondisi atap harus berupa teks"),

    body("rangka_rumah")
      .notEmpty()
      .withMessage("Rangka rumah harus diisi")
      .isString()
      .withMessage("Rangka rumah harus berupa teks"),

    body("dinding_rumah")
      .notEmpty()
      .withMessage("Dinding rumah harus diisi")
      .isString()
      .withMessage("Dinding rumah harus berupa teks"),

    body("lantai")
      .notEmpty()
      .withMessage("Kondisi lantai harus diisi")
      .isString()
      .withMessage("Kondisi lantai harus berupa teks"),

    body("mck")
      .notEmpty()
      .withMessage("Kondisi MCK harus diisi")
      .isString()
      .withMessage("Kondisi MCK harus berupa teks"),

    body("luas_rumah")
      .notEmpty()
      .withMessage("Luas rumah harus diisi")
      .isString()
      .withMessage("Luas rumah harus berupa teks"),

    // Step 5: Kondisi Peserta & Rumah (Lanjutan)
    body("aset")
      .notEmpty()
      .withMessage("Aset harus diisi")
      .isString()
      .withMessage("Aset harus berupa teks"),

    body("kendaraan")
      .notEmpty()
      .withMessage("Kendaraan harus diisi")
      .isString()
      .withMessage("Kendaraan harus berupa teks"),

    body("keterangan_kondisi_calon")
      .notEmpty()
      .withMessage("Keterangan kondisi calon harus diisi")
      .isString()
      .withMessage("Keterangan kondisi calon harus berupa teks"),

    body("keterangan_pilih_mustahik")
      .notEmpty()
      .withMessage("Keterangan pilih mustahik harus diisi")
      .isString()
      .withMessage("Keterangan pilih mustahik harus berupa teks"),

    body("kesimpulan")
      .notEmpty()
      .withMessage("Kesimpulan harus diisi")
      .isString()
      .withMessage("Kesimpulan harus berupa teks"),

    body("status")
      .notEmpty()
      .withMessage("Status harus diisi")
      .isIn(["approve", "reject", "pending"])
      .withMessage("Status harus approve, reject, atau pending"),
  ],
  validationHelper.handleFileErrors,
  controllers.submit
);

module.exports = router;
