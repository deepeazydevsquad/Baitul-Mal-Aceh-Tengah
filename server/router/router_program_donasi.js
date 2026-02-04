const express = require("express");
const { body } = require("express-validator");
const controllers = require("../modules/program_donasi/controllers/index");
const validation = require("../validation/program_donasi");
const {
  authenticateTokenAdministrator,
} = require("../middleware/authenticateToken");

const router = express.Router();

router.post(
  "/program_donasi/add",
  authenticateTokenAdministrator,
  validation.upload.single("banner"),
  [
    body("name")
      .notEmpty()
      .withMessage("Name Tidak Boleh Kosong")
      .isString()
      .withMessage("Name Harus String"),
    body("tahun")
      .notEmpty()
      .withMessage("Tahun Tidak Boleh Kosong")
      .isInt()
      .withMessage("Tahun Harus Angka"),
    body("deskripsi")
      .notEmpty()
      .withMessage("Deskripsi Tidak Boleh Kosong")
      .isString()
      .withMessage("Deskripsi Harus String"),
    body("target_donasi_terkumpul")
      .notEmpty()
      .withMessage("Target Donasi Terkumpul Tidak Boleh Kosong"),
    body("waktu_donasi")
      .notEmpty()
      .withMessage("Waktu Donasi Tidak Boleh Kosong"),
  ],
  controllers.add,
);

router.post(
  "/program_donasi/edit",
  authenticateTokenAdministrator,
  validation.upload.single("banner"),
  [
    body("id")
      .notEmpty()
      .withMessage("ID Tidak Boleh Kosong")
      .isInt()
      .withMessage("ID Harus Angka"),
    body("name").notEmpty().withMessage("Name Tidak Boleh Kosong"),

    body("tahun").notEmpty().withMessage("Tahun Tidak Boleh Kosong"),
    body("deskripsi").notEmpty().withMessage("Deskripsi Tidak Boleh Kosong"),
    body("target_donasi_terkumpul")
      .notEmpty()
      .withMessage("Target Donasi Terkumpul Tidak Boleh Kosong"),
    body("waktu_donasi")
      .notEmpty()
      .withMessage("Waktu Donasi Tidak Boleh Kosong"),
  ],
  controllers.edit,
);

router.post(
  "/program_donasi/detail",
  authenticateTokenAdministrator,
  [
    body("id")
      .notEmpty()
      .withMessage("ID Tidak Boleh Kosong")
      .isInt()
      .withMessage("ID Harus Angka"),
  ],
  controllers.detail,
);

router.post(
  "/program_donasi/tutup",
  authenticateTokenAdministrator,
  [
    body("id")
      .notEmpty()
      .withMessage("ID Tidak Boleh Kosong")
      .isInt()
      .withMessage("ID Harus Angka"),
  ],
  controllers.tutup,
);

router.post(
  "/program_donasi/delete",
  authenticateTokenAdministrator,
  [
    body("id")
      .notEmpty()
      .withMessage("ID Tidak Boleh Kosong")
      .isInt()
      .withMessage("ID Harus Angka"),
  ],
  controllers.delete,
);

router.post(
  "/program_donasi/list",
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
  ],
  controllers.daftar_program_donasi,
);

router.post(
  "/program_donasi/add_donasi",
  authenticateTokenAdministrator,
  [
    body("program_donasi_id")
      .notEmpty()
      .withMessage("program donasi Tidak Boleh Kosong"),
    body("member_id").notEmpty().withMessage("Member Tidak Boleh Kosong"),
    body("wakalah_id").optional().custom(validation.checkIdWakalah),
    body("nominal").notEmpty().withMessage("Nominal Tidak Boleh Kosong"),
    body("tipe_pembayaran")
      .notEmpty()
      .withMessage("Tipe Pembayaran Tidak Boleh Kosong")
      .isIn(["transfer", "cash"])
      .withMessage("Tipe Pembayaran tidak valid"),
  ],
  controllers.add_donasi,
);

router.get(
  "/program_donasi/daftar_member",
  authenticateTokenAdministrator,
  controllers.daftar_member,
);

module.exports = router;
