const express = require("express");
const { body } = require("express-validator");
const controllers = require("../modules/riwayat_infaq/controllers/index");
const validation = require("../validation/riwayat_infaq");
const validationHelper = require("../helper/handleErrorFile");
const {
  authenticateTokenAdministrator,
} = require("../middleware/authenticateToken");

const router = express.Router();

router.get(
  "/riwayat_infaq/list_member",
  authenticateTokenAdministrator,
  controllers.list_member
);

router.post(
  "/riwayat_infaq/list",
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
    body("status").optional(),
    body("konfirmasi_pembayaran").optional(),
    body("tipe_pembayaran").optional(),
  ],
  controllers.list
);

router.post(
  "/riwayat_infaq/add",
  authenticateTokenAdministrator,
  [
    body("member_id")
      .notEmpty()
      .withMessage("Member ID Tidak Boleh Kosong")
      .isInt()
      .withMessage("Member ID Harus Angka")
      .custom(validation.check_id_member),
    body("nominal")
      .notEmpty()
      .withMessage("Nominal Tidak Boleh Kosong")
      .isInt()
      .withMessage("Nominal Harus Angka"),
    body("tipe_pembayaran")
      .notEmpty()
      .withMessage("Tipe Pembayaran Tidak Boleh Kosong")
      .isIn(["transfer", "cash"])
      .withMessage("Tipe Pembayaran tidak valid"),
    body("wakalah_id")
      .optional({ nullable: true, checkFalsy: true })
      .isInt()
      .withMessage("Wakalah ID Harus Angka")
      .custom(validation.check_id_wakalah_optional),
  ],
  controllers.add
);

router.post(
  "/riwayat_infaq/approve_online",
  authenticateTokenAdministrator,
  [
    body("id")
      .notEmpty()
      .withMessage("ID Tidak Boleh Kosong")
      .isInt()
      .withMessage("ID Harus Angka")
      .custom(validation.check_id_riwayat_infaq),
  ],
  controllers.approve_online
);

router.post(
  "/riwayat_infaq/reject_online",
  authenticateTokenAdministrator,
  [
    body("id")
      .notEmpty()
      .withMessage("ID Tidak Boleh Kosong")
      .isInt()
      .withMessage("ID Harus Angka")
      .custom(validation.check_id_riwayat_infaq),
    body("alasan").notEmpty().withMessage("Alasan Tidak Boleh Kosong"),
  ],
  controllers.reject_online
);

router.post(
  "/riwayat_infaq/delete",
  authenticateTokenAdministrator,
  [
    body("id")
      .notEmpty()
      .withMessage("ID Tidak Boleh Kosong")
      .isInt()
      .withMessage("ID Harus Angka")
      .custom(validation.check_id_riwayat_infaq),
  ],
  controllers.delete
);

router.post(
  "/riwayat_infaq/upload_bukti_transfer",
  authenticateTokenAdministrator,
  validation.upload("transfer").single("bukti"),
  [
    body("id")
      .notEmpty()
      .withMessage("ID Tidak Boleh Kosong")
      .isInt()
      .withMessage("ID Harus Angka")
      .custom(validation.check_id_riwayat_infaq),
    body("nominal_transfer")
      .notEmpty()
      .withMessage("Jumlah Nominal Transfer Tidak Boleh Kosong")
      .isInt()
      .withMessage("Jumlah Nominal Transfer Harus Angka"),
  ],
  validationHelper.handleFileErrors,
  controllers.upload_bukti_transfer
);

router.post(
  "/riwayat_infaq/upload_bukti_setoran",
  authenticateTokenAdministrator,
  validation.upload("cash").single("bukti"),
  [
    body("id")
      .notEmpty()
      .withMessage("ID Tidak Boleh Kosong")
      .isInt()
      .withMessage("ID Harus Angka")
      .custom(validation.check_id_riwayat_infaq),
    body("nominal_setoran")
      .notEmpty()
      .withMessage("Jumlah Nominal Setoran Tidak Boleh Kosong")
      .isInt()
      .withMessage("Jumlah Nominal Setoran Harus Angka"),
  ],
  validationHelper.handleFileErrors,
  controllers.upload_bukti_setoran
);

router.post(
  "/riwayat_infaq/info_bukti_setoran",
  authenticateTokenAdministrator,
  [
    body("id")
      .notEmpty()
      .withMessage("ID Tidak Boleh Kosong")
      .isInt()
      .withMessage("ID Harus Angka")
      .custom(validation.check_id_riwayat_infaq_cash_or_transfer),
  ],
  controllers.info_bukti_setoran
);

module.exports = router;
