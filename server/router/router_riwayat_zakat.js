const express = require("express");
const { body } = require("express-validator");
const controllers = require("../modules/riwayat_zakat/controllers/index");
const validation = require("../validation/riwayat_zakat");
const validationHelper = require("../helper/handleErrorFile");
const {
  authenticateTokenAdministrator,
} = require("../middleware/authenticateToken");

const router = express.Router();

router.get(
  "/riwayat_zakat/list_member",
  authenticateTokenAdministrator,
  controllers.list_member
);

router.post(
  "/riwayat_zakat/list",
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
  "/riwayat_zakat/add",
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
    body("tipe_zakat")
      .notEmpty()
      .withMessage("Tipe Zakat Tidak Boleh Kosong")
      .isIn([
        "zakat_harta",
        "zakat_simpanan",
        "zakat_profesi",
        "zakat_perdagangan",
        "zakat_pertanian",
      ])
      .withMessage("Tipe Zakat tidak valid"),
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
  "/riwayat_zakat/approve_online",
  authenticateTokenAdministrator,
  [
    body("id")
      .notEmpty()
      .withMessage("ID Tidak Boleh Kosong")
      .isInt()
      .withMessage("ID Harus Angka")
      .custom(validation.check_id_riwayat_zakat),
  ],
  controllers.approve_online
);

router.post(
  "/riwayat_zakat/reject_online",
  authenticateTokenAdministrator,
  [
    body("id")
      .notEmpty()
      .withMessage("ID Tidak Boleh Kosong")
      .isInt()
      .withMessage("ID Harus Angka")
      .custom(validation.check_id_riwayat_zakat),
    body("alasan").notEmpty().withMessage("Alasan Tidak Boleh Kosong"),
  ],
  controllers.reject_online
);

router.post(
  "/riwayat_zakat/delete",
  authenticateTokenAdministrator,
  [
    body("id")
      .notEmpty()
      .withMessage("ID Tidak Boleh Kosong")
      .isInt()
      .withMessage("ID Harus Angka")
      .custom(validation.check_id_riwayat_zakat),
  ],
  controllers.delete
);

router.post(
  "/riwayat_zakat/upload_bukti_transfer",
  authenticateTokenAdministrator,
  validation.upload("transfer").single("bukti"),
  [
    body("id")
      .notEmpty()
      .withMessage("ID Tidak Boleh Kosong")
      .isInt()
      .withMessage("ID Harus Angka")
      .custom(validation.check_id_riwayat_zakat),
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
  "/riwayat_zakat/upload_bukti_setoran",
  authenticateTokenAdministrator,
  validation.upload("cash").single("bukti"),
  [
    body("id")
      .notEmpty()
      .withMessage("ID Tidak Boleh Kosong")
      .isInt()
      .withMessage("ID Harus Angka")
      .custom(validation.check_id_riwayat_zakat),
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
  "/riwayat_zakat/info_bukti_setoran",
  authenticateTokenAdministrator,
  [
    body("id")
      .notEmpty()
      .withMessage("ID Tidak Boleh Kosong")
      .isInt()
      .withMessage("ID Harus Angka")
      .custom(validation.check_id_riwayat_zakat_cash_or_transfer),
  ],
  controllers.info_bukti_setoran
);

module.exports = router;
