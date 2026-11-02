const express = require("express");
const { body } = require("express-validator");
const controllers = require("../modules/bank/controllers/index");
const validation = require("../validation/bank");
const {
  authenticateTokenAdministrator,
} = require("../middleware/authenticateToken");

const router = express.Router();

router.post(
  "/bank/list",
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
    body("search")
      .optional()
      .isString().withMessage("Search Harus String"),
  ],
  controllers.daftar_bank
);

router.post(
  "/bank/add",
  authenticateTokenAdministrator,
  validation.upload.single("img"),
  validation.check_dimensions(true),
  [
    body("name")
      .notEmpty().withMessage("Name Tidak Boleh Kosong")
      .isString().withMessage("Name Harus String")
      .custom(validation.check_nama_bank),
  ],
  validation.cleanupRejectedUpload,
  controllers.add
);

router.post(
  "/bank/get_info_edit_bank",
  authenticateTokenAdministrator,
  [
    body("id")
      .notEmpty().withMessage("ID Tidak Boleh Kosong")
      .isInt().withMessage("ID Harus Angka")
      .custom(validation.check_id_bank),
  ],
  controllers.get_info_edit_bank
)

router.post(
  "/bank/edit",
  authenticateTokenAdministrator,
  validation.upload.single("img"), // upload logo
  validation.check_dimensions(false),      // cek ukuran gambar
  [
    body("id")
      .notEmpty().withMessage("ID Tidak Boleh Kosong")
      .isInt().withMessage("ID Harus Angka")
      .custom(validation.check_id_bank),
    body("name")
      .notEmpty().withMessage("Name Tidak Boleh Kosong")
      .isString().withMessage("Name Harus String")
      .custom(validation.check_nama_bank),
  ],
  validation.cleanupRejectedUpload,
  controllers.edit
)

router.post(
  "/bank/delete",
  authenticateTokenAdministrator,
  [
    body("id")
      .notEmpty().withMessage("ID Tidak Boleh Kosong")
      .isInt().withMessage("ID Harus Angka")
      .custom(validation.check_id_bank),
  ],
  controllers.delete
);

module.exports = router;
