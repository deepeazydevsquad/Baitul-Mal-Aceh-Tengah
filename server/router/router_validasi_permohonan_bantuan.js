const express = require("express");
const { body } = require("express-validator");
const controllers = require("../modules/validasi_permohonan_bantuan/controllers/index");
const validation = require("../validation/validasi_permohonan_bantuan");
const {
  authenticateTokenAdministrator,
} = require("../middleware/authenticateToken.js");
const {
  requirePermission,
} = require("../middleware/authorizePermission");
const validationHelper = require("../helper/handleErrorFile.js");

const router = express.Router();

router.get(
  "/validasi_permohonan_bantuan/get_filter_type",
  authenticateTokenAdministrator,
  controllers.get_filter_type
);

router.post(
  "/validasi_permohonan_bantuan/list",
  authenticateTokenAdministrator,
  [
    body("perpage")
      .notEmpty()
      .withMessage("Perpage Tidak Boleh Kosong")
      .isInt()
      .withMessage("Perpage Harus Angka"),
    body("pageNumber")
      .notEmpty()
      .withMessage("Page Number Tidak Boleh Kosong")
      .isInt()
      .withMessage("Page Number Harus Angka"),
    body("search").optional().isString().withMessage("Search Harus String"),
    body("type_kegiatan").optional(),
  ],
  controllers.list_validasi_permohonan_bantuan
);

router.post(
  "/validasi_permohonan_bantuan/get_info_edit_file",
  authenticateTokenAdministrator,
  [
    body("id")
      .notEmpty()
      .withMessage("ID Tidak Boleh Kosong")
      .isInt()
      .withMessage("ID Harus Angka")
      .custom(validation.check_id_permohonan_bantuan),
    body("validasi_id")
      .notEmpty()
      .withMessage("Validasi ID Tidak Boleh Kosong")
      .isInt()
      .withMessage("Validasi ID Harus Angka")
      .custom(validation.check_id_validasi_permohonan_bantuan),
  ],
  controllers.get_info_edit_file
);

router.post(
  "/validasi_permohonan_bantuan/edit_file",
  authenticateTokenAdministrator,
  validation.upload,
  [
    body("id")
      .notEmpty()
      .withMessage("ID Tidak Boleh Kosong")
      .isInt()
      .withMessage("ID Harus Angka")
      .custom(validation.check_id_permohonan_bantuan),
    body("validasi_id")
      .notEmpty()
      .withMessage("Validasi ID Tidak Boleh Kosong")
      .isInt()
      .withMessage("Validasi ID Harus Angka")
      .custom(validation.check_id_validasi_permohonan_bantuan),
  ],
  validation.persistValidatedUpload,
  validationHelper.handleFileErrors,
  controllers.edit_file
);

router.post(
  "/validasi_permohonan_bantuan/get_info_pemberitahuan",
  authenticateTokenAdministrator,
  requirePermission({ menuId: 2, submenuId: 3 }),
  [
    body("id")
      .notEmpty()
      .withMessage("ID Tidak Boleh Kosong")
      .isInt()
      .withMessage("ID Harus Angka")
      .custom(validation.check_id_permohonan_bantuan),
  ],
  controllers.get_info_pemberitahuan
);

router.post(
  "/validasi_permohonan_bantuan/pemberitahuan",
  authenticateTokenAdministrator,
  requirePermission({ menuId: 2, submenuId: 3 }),
  [
    body("id")
      .notEmpty()
      .withMessage("ID Tidak Boleh Kosong")
      .isInt()
      .withMessage("ID Harus Angka")
      .custom(validation.check_id_permohonan_bantuan),
  ],
  controllers.send_pemberitahuan_wa
);

router.post(
  "/validasi_permohonan_bantuan/approve_berkas",
  authenticateTokenAdministrator,
  [
    body("id")
      .notEmpty()
      .withMessage("ID Tidak Boleh Kosong")
      .isInt()
      .withMessage("ID Harus Angka")
      .custom(validation.check_id_permohonan_bantuan),
    body("validasi_id")
      .notEmpty()
      .withMessage("Validasi ID Tidak Boleh Kosong")
      .isInt()
      .withMessage("Validasi ID Harus Angka")
      .custom(validation.check_id_validasi_permohonan_bantuan),
  ],
  controllers.approve_berkas
);

router.post(
  "/validasi_permohonan_bantuan/reject_berkas",
  authenticateTokenAdministrator,
  [
    body("id")
      .notEmpty()
      .withMessage("ID Tidak Boleh Kosong")
      .isInt()
      .withMessage("ID Harus Angka")
      .custom(validation.check_id_permohonan_bantuan),
    body("validasi_id")
      .notEmpty()
      .withMessage("Validasi ID Tidak Boleh Kosong")
      .isInt()
      .withMessage("Validasi ID Harus Angka")
      .custom(validation.check_id_validasi_permohonan_bantuan),
    body("alasan_penolakan")
      .notEmpty()
      .withMessage("Alasan Penolakan Tidak Boleh Kosong")
      .isString()
      .withMessage("Alasan Penolakan Harus String"),
  ],
  controllers.reject_berkas
);

router.post(
  "/validasi_permohonan_bantuan/get_info_approve_permohonan",
  authenticateTokenAdministrator,
  requirePermission({ menuId: 2, submenuId: 3 }),
  [
    body("id")
      .notEmpty()
      .withMessage("ID Tidak Boleh Kosong")
      .isInt()
      .withMessage("ID Harus Angka")
      .custom(validation.check_id_permohonan_bantuan),
  ],
  controllers.get_info_approve_permohonan
);

router.post(
  "/validasi_permohonan_bantuan/approve_permohonan",
  authenticateTokenAdministrator,
  requirePermission({ menuId: 2, submenuId: 3 }),
  [
    body("id")
      .notEmpty()
      .withMessage("ID Tidak Boleh Kosong")
      .isInt()
      .withMessage("ID Harus Angka")
      .custom(validation.check_id_permohonan_bantuan)
      .custom(validation.check_berkas),
    body("send_wa")
      .notEmpty()
      .withMessage("Send Wa Tidak Boleh Kosong")
      .isBoolean()
      .withMessage("Send Wa Harus Boolean"),
    body("catatan").optional().isString().withMessage("Catatan Harus String"),
    body("biaya_disetujui")
      .notEmpty()
      .withMessage("Biaya Disetujui Tidak Boleh Kosong")
      .isInt()
      .withMessage("Biaya Disetujui Harus Angka")
      .custom(validation.check_biaya_disetujui),
  ],
  controllers.approve_permohonan
);

router.post(
  "/validasi_permohonan_bantuan/get_info_reject_permohonan",
  authenticateTokenAdministrator,
  requirePermission({ menuId: 2, submenuId: 3 }),
  [
    body("id")
      .notEmpty()
      .withMessage("ID Tidak Boleh Kosong")
      .isInt()
      .withMessage("ID Harus Angka")
      .custom(validation.check_id_permohonan_bantuan),
  ],
  controllers.get_info_reject_permohonan
);

router.post(
  "/validasi_permohonan_bantuan/reject_permohonan",
  authenticateTokenAdministrator,
  requirePermission({ menuId: 2, submenuId: 3 }),
  [
    body("id")
      .notEmpty()
      .withMessage("ID Tidak Boleh Kosong")
      .isInt()
      .withMessage("ID Harus Angka")
      .custom(validation.check_id_permohonan_bantuan),
    body("send_wa")
      .notEmpty()
      .withMessage("Send Wa Tidak Boleh Kosong")
      .isBoolean()
      .withMessage("Send Wa Harus Boolean"),
    body("alasan_penolakan")
      .notEmpty()
      .withMessage("Alasan Penolakan Tidak Boleh Kosong")
      .isString()
      .withMessage("Alasan Penolakan Harus String"),
  ],
  controllers.reject_permohonan
);

module.exports = router;
