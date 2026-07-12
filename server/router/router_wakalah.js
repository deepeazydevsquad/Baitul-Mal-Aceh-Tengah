const express = require("express");
const { body } = require("express-validator");
const controllers = require("../modules/wakalah/controllers/index");
const validation = require("../validation/wakalah");
const {
  authenticateTokenAdministrator,
} = require("../middleware/authenticateToken");

const router = express.Router();

router.post(
  "/wakalah/list",
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
  controllers.daftar_wakalah
);

router.post(
  "/wakalah/add",
  authenticateTokenAdministrator,
  [
    body("nama")
      .notEmpty().withMessage("Nama Tidak Boleh Kosong")
      .isString().withMessage("Nama Harus String"),
    body("nik")
      .notEmpty().withMessage("NIK Tidak Boleh Kosong")
      .isString().withMessage("NIK Harus String")
      .custom(validation.check_nik),
    body("desa_id")
      .notEmpty().withMessage("Desa Tidak Boleh Kosong")
      .isInt().withMessage("Desa Harus Angka")
      .custom(validation.check_desa)
  ],
  controllers.add
);

router.post(
  "/wakalah/get_info_edit_wakalah",
  authenticateTokenAdministrator,
  [
    body("id")
      .notEmpty().withMessage("ID Tidak Boleh Kosong")
      .isInt().withMessage("ID Harus Angka")
      .custom(validation.check_id_wakalah),
  ],
  controllers.get_info_edit_wakalah
);

router.post(
  "/wakalah/edit",
  authenticateTokenAdministrator,
  [
    body("id")
      .notEmpty().withMessage("ID Tidak Boleh Kosong")
      .isInt().withMessage("ID Harus Angka")
      .custom(validation.check_id_wakalah),
    body("nama")
      .notEmpty().withMessage("Nama Tidak Boleh Kosong")
      .isString().withMessage("Nama Harus String"),
    body("nik")
      .notEmpty().withMessage("NIK Tidak Boleh Kosong")
      .isString().withMessage("NIK Harus String")
      .custom(validation.check_nik),
    body("desa_id")
      .notEmpty().withMessage("Desa Tidak Boleh Kosong")
      .isInt().withMessage("Desa Harus Angka")
      .custom(validation.check_desa)
  ],
  controllers.edit
);

router.post(
  "/wakalah/delete",
  authenticateTokenAdministrator,
  [
    body("id")
      .notEmpty().withMessage("ID Tidak Boleh Kosong")
      .isInt().withMessage("ID Harus Angka")
      .custom(validation.check_id_wakalah),
  ],
  controllers.delete
);

module.exports = router;
