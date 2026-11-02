const express = require("express");
const { body } = require("express-validator");
const controllers = require("../modules/donasi_member/controllers/index");
const {
  authenticateTokenMember,
} = require("../middleware/authenticateToken");
const validation = require("../validation/infaq_member");

const router = express.Router();

router.post(
  "/donasi_member/list",
  authenticateTokenMember,
  [
    body("perpage")
      .notEmpty()
      .withMessage("Perpage Tidak Boleh Kosong")
      .isInt()
      .withMessage("Perpage Harus Angka"),
    body("page")
      .notEmpty()
      .withMessage("Page Number Tidak Boleh Kosong")
      .isInt()
      .withMessage("Page Number Harus Angka"),
    body("search").optional().isString().withMessage("Search Harus String"),
  ],
  controllers.daftar_program
);

router.post(
  "/donasi_member/daftar_donatur",
  authenticateTokenMember,
  [
    body("program_donasi_id")
      .notEmpty()
      .withMessage("ID Tidak Boleh Kosong")
      .isInt()
      .withMessage("ID Harus Angka"),
  ],
  controllers.daftar_donatur
);

router.post(
  "/donasi_member/detail_donasi",
  authenticateTokenMember,
  [
    body("program_donasi_id")
      .notEmpty()
      .withMessage("ID Tidak Boleh Kosong")
      .isInt()
      .withMessage("ID Harus Angka"),
  ],
  controllers.detail_donasi
);

router.post(
  "/donasi_member/get_konfirmasi",
  authenticateTokenMember,
  [
    body("program_donasi_id")
      .notEmpty()
      .withMessage("ID Tidak Boleh Kosong")
      .isInt()
      .withMessage("ID Harus Angka"),
  ],
  controllers.konfirmasi
);

router.post(
  "/donasi_member/update_konfirmasi",
  authenticateTokenMember,
  [body("invoice").notEmpty().withMessage("invoice Tidak Boleh Kosong")],
  controllers.update_konfirmasi
);

router.post(
  "/donasi_member/konfirmasi_detail",
  authenticateTokenMember,
  [
    body("program_donasi_id")
      .notEmpty()
      .withMessage("ID Tidak Boleh Kosong")
      .isInt()
      .withMessage("ID Harus Angka"),
  ],
  controllers.detail_konfirmasi
);

router.post(
  "/donasi_member/riwayat_donasi_user",
  authenticateTokenMember,
  [
    body("program_donasi_id")
      .notEmpty()
      .withMessage("ID Tidak Boleh Kosong")
      .isInt()
      .withMessage("ID Harus Angka"),
  ],
  controllers.riwayat_donasi_user
);

router.post(
  "/donasi_member/detail_riwayat",
  authenticateTokenMember,
  [body("invoice").notEmpty().withMessage("invoice Tinvoiceak Boleh Kosong")],
  controllers.detail_riwayat
);

router.get(
  "/donasi_member/kode_pembayaran",
  authenticateTokenMember,
  controllers.kode_pembayaran
);

router.get(
  "/donasi_member/profile",
  authenticateTokenMember,
  controllers.getMemberProfile
);

router.get(
  "/donasi_member/banks",
  authenticateTokenMember,
  controllers.getBankList
);

router.post(
  "/donasi_member/add",
  authenticateTokenMember,
  [
    body("nominal")
      .notEmpty()
      .withMessage("Jumlah infaq harus diisi")
      .isInt({ min: 1 })
      .withMessage("Jumlah infaq harus berupa angka positif dan lebih dari 0"),
    body("program_donasi_id")
      .notEmpty()
      .withMessage("Program Donasi harus diisi")
      .isInt()
      .withMessage("Program Donasi harus berupa angka"),
    body("invoice")
      .notEmpty()
      .withMessage("Invoice harus diisi")
      .isString()
      .withMessage("Invoice harus berupa teks")
      .custom(validation.check_invoice_exists),
    body("kode")
      .notEmpty()
      .withMessage("kode donasi harus diisi")
      .isInt()
      .withMessage("kode donasi harus berupa angka"),
  ],
  controllers.add
);

module.exports = router;
