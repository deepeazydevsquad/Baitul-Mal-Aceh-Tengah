const express = require("express");
const { body } = require("express-validator");
const controllers = require("../modules/infaq_member/controllers/index");
const {
  authenticateTokenMember,
} = require("../middleware/authenticateToken");
const validation = require("../validation/infaq_member");

const router = express.Router();

router.post(
  "/infaq_member/list",
  authenticateTokenMember,
  controllers.getInfaqList
);

router.get(
  "/infaq_member/kode_pembayaran",
  authenticateTokenMember,
  controllers.kode_pembayaran
);

router.get(
  "/infaq_member/profile",
  authenticateTokenMember,
  controllers.getMemberProfile
);

router.get(
  "/infaq_member/banks",
  authenticateTokenMember,
  controllers.getBankList
);

router.post(
  "/infaq_member/add",
  authenticateTokenMember,
  [
    body("nominal")
      .notEmpty()
      .withMessage("Jumlah infaq harus diisi")
      .isInt({ min: 1 })
      .withMessage("Jumlah infaq harus berupa angka positif dan lebih dari 0")
      .toInt()
      .custom(validation.check_nominal_positive),

    body("invoice")
      .notEmpty()
      .withMessage("Invoice harus diisi")
      .isString()
      .withMessage("Invoice harus berupa teks")
      .custom(validation.check_invoice_exists),
    body("kode")
      .notEmpty()
      .withMessage("kode Infaq harus diisi")
      .isInt()
      .withMessage("kode Infaq harus berupa angka"),
  ],
  controllers.addInfaq
);

router.post(
  "/infaq_member/confirm",
  authenticateTokenMember,
  [
    body("invoice")
      .notEmpty()
      .withMessage("Invoice harus diisi")
      .isString()
      .withMessage("Invoice harus berupa teks")
      .custom(validation.check_invoice_for_confirm),
  ],
  controllers.confirmInfaqPayment
);

module.exports = router;
