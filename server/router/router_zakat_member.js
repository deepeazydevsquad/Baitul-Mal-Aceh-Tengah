const express = require("express");
const { body } = require("express-validator");
const controllers = require("../modules/zakat_member/controllers/index");
const validation = require("../validation/zakat_member");
const {
  authenticateTokenMember,
} = require("../middleware/authenticateToken");

const router = express.Router();

router.post(
  "/zakat_member/list",
  authenticateTokenMember,
  controllers.getZakatList
);

router.get(
  "/zakat_member/kode_pembayaran",
  authenticateTokenMember,
  controllers.kode_pembayaran
);

router.get(
  "/zakat_member/profile",
  authenticateTokenMember,
  controllers.getMemberProfile
);

router.get(
  "/zakat_member/banks",
  authenticateTokenMember,
  controllers.getBankList
);

router.get(
  "/zakat_member/tipe",
  authenticateTokenMember,
  controllers.getTipeZakat
);

router.post(
  "/zakat_member/add",
  authenticateTokenMember,
  [
    // Validasi Tipe Zakat
    body("tipe")
      .notEmpty()
      .withMessage("Tipe zakat harus dipilih")
      .custom(validation.check_tipe_zakat),

    // Validasi Nominal
    body("nominal")
      .notEmpty()
      .withMessage("Jumlah zakat harus diisi")
      .isInt({ min: 1 })
      .withMessage("Jumlah zakat harus berupa angka positif dan lebih dari 0")
      .toInt(),

    // Validasi Invoice
    body("invoice")
      .notEmpty()
      .withMessage("Invoice harus diisi")
      .isString()
      .withMessage("Invoice harus berupa teks")
      .custom(validation.check_invoice_exists),
    body("kode")
      .notEmpty()
      .withMessage("kode harus diisi")
      .isString()
      .withMessage("kode harus berupa teks"),
  ],
  controllers.addZakat
);

router.post(
  "/zakat_member/confirm",
  authenticateTokenMember,
  [
    body("invoice")
      .notEmpty()
      .withMessage("Invoice harus diisi")
      .isString()
      .withMessage("Invoice harus berupa teks")
      .custom(validation.check_invoice_for_confirm),
  ],
  controllers.confirmZakatPayment
);

module.exports = router;
