const express = require("express");
const { body } = require("express-validator");
const controllers = require("../modules/daftar_keanggotaan/controllers/index");
const validation = require("../validation/daftar_keanggotaan");
const {
  authenticateTokenAdministrator,
} = require("../middleware/authenticateToken");

const router = express.Router();

router.get(
  "/daftar_keanggotaan/daftar_kecamatan",
  authenticateTokenAdministrator,
  controllers.daftar_kecamatan,
);

router.post(
  "/daftar_keanggotaan/daftar_desa",
  authenticateTokenAdministrator,
  [
    body("kecamatan_id")
      .notEmpty()
      .withMessage("kecamatan_id tidak boleh kosong.")
      .custom(validation.check_id_kecamatan),
  ],
  controllers.daftar_desa,
);

router.post(
  "/daftar_keanggotaan/list",
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
    body("type").optional().isString().withMessage("Type Harus String"),
  ],
  controllers.daftar_keanggotaan,
);

router.post(
  "/daftar_keanggotaan/daftar_keanggotaan",
  authenticateTokenAdministrator,
  [
    body("id")
      .notEmpty()
      .withMessage("ID Tidak Boleh Kosong")
      .isInt()
      .withMessage("ID Harus Angka")
      .custom(validation.check_id_keanggotaan),
  ],
  controllers.daftar_keanggotaan,
);

router.post(
  "/daftar_keanggotaan/add",
  authenticateTokenAdministrator,
  [
    body("tipeAkun")
      .notEmpty()
      .withMessage("Tipe Akun Tidak Boleh Kosong")
      .isIn(["perorangan", "instansi"])
      .withMessage("Tipe Akun Harus Perorangan atau Instansi"),
    body("kecamatan_id")
      .optional()
      .isInt()
      .withMessage("Kecamatan ID Harus Angka")
      .custom(validation.check_id_kecamatan),
    body("desa_id")
      .optional()
      .isInt()
      .withMessage("Desa ID Harus Angka")
      .custom(validation.check_id_desa),
    body("fullname")
      .notEmpty()
      .withMessage("Nama Lengkap Tidak Boleh Kosong")
      .isString()
      .withMessage("Nama Lengkap Harus String"),
    body("username")
      .notEmpty()
      .withMessage("Nama Pengguna Tidak Boleh Kosong")
      .isString()
      .withMessage("Nama Pengguna Harus String")
      .custom(validation.check_username),
    body("nomor_ktp")
      .optional()
      .isString()
      .withMessage("Nomor KTP Harus String"),
    body("nomor_kk").optional(),
    body("wa_number")
      .optional()
      .isString()
      .withMessage("Nomor Whatsapp Harus String"),
    body("alamat").optional().isString().withMessage("Alamat Harus String"),
    body("birth_date")
      .optional()
      .isString()
      .withMessage("Tanggal Lahir Harus String"),
    body("password").optional().custom(validation.check_password),
  ],
  validation.validateData,
  controllers.add,
);

router.post(
  "/daftar_keanggotaan/get_info_edit_keanggotaan",
  authenticateTokenAdministrator,
  [
    body("id")
      .notEmpty()
      .withMessage("ID Tidak Boleh Kosong")
      .isInt()
      .withMessage("ID Harus Angka")
      .custom(validation.check_id_keanggotaan),
  ],
  controllers.get_info_edit_daftar_keanggotaan,
);

router.post(
  "/daftar_keanggotaan/edit",
  authenticateTokenAdministrator,
  [
    body("id")
      .notEmpty()
      .withMessage("ID Tidak Boleh Kosong")
      .isInt()
      .withMessage("ID Harus Angka")
      .custom(validation.check_id_keanggotaan),
    body("tipeAkun")
      .notEmpty()
      .withMessage("Tipe Akun Tidak Boleh Kosong")
      .isIn(["perorangan", "instansi"])
      .withMessage("Tipe Akun Harus Perorangan atau Instansi"),
    body("kecamatan_id")
      .optional()
      .isInt()
      .withMessage("Kecamatan ID Harus Angka")
      .custom(validation.check_id_kecamatan),
    body("desa_id")
      .optional()
      .isInt()
      .withMessage("Desa ID Harus Angka")
      .custom(validation.check_id_desa),
    body("fullname")
      .notEmpty()
      .withMessage("Nama Lengkap Tidak Boleh Kosong")
      .isString()
      .withMessage("Nama Lengkap Harus String"),
    body("username")
      .notEmpty()
      .withMessage("Nama Pengguna Tidak Boleh Kosong")
      .isString()
      .withMessage("Nama Pengguna Harus String")
      .custom(validation.check_username),
    body("nomor_ktp")
      .optional()
      .isString()
      .withMessage("Nomor KTP Harus String"),
    body("nomor_kk").optional(),
    body("wa_number")
      .optional()
      .isString()
      .withMessage("Nomor Whatsapp Harus String"),
    body("alamat").optional().isString().withMessage("Alamat Harus String"),
    body("birth_date")
      .optional()
      .isString()
      .withMessage("Tanggal Lahir Harus String"),
    body("password").optional().custom(validation.check_password),
  ],
  validation.validateData,
  controllers.edit,
);

router.post(
  "/daftar_keanggotaan/delete",
  authenticateTokenAdministrator,
  [
    body("id")
      .notEmpty()
      .withMessage("ID Tidak Boleh Kosong")
      .isInt()
      .withMessage("ID Harus Angka")
      .custom(validation.check_id_keanggotaan),
  ],
  controllers.delete,
);

module.exports = router;
