const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const Controller = require("../modules/wakalah/controllers/index");
const {
  authenticateTokenAdministrator,
} = require("../middleware/authenticateToken");
const validation = require("../validation/wakilah");

router.post(
  "/wakalah/list",
  authenticateTokenAdministrator,
  [
    body("pageNumber")
      .trim()
      .notEmpty()
      .withMessage("Page Number tidak boleh kosong."),
    body("perpage")
      .trim()
      .notEmpty()
      .withMessage("Jumlah Per Page tidak boleh kosong."),
    body("search").trim(),
  ],
  Controller.list,
);

router.post(
  "/wakalah/add",
  authenticateTokenAdministrator,
  [
    body("desa_id")
      .notEmpty()
      .withMessage("Desa Tidak Boleh Kosong")
      .trim()
      .custom(validation.check_desa_id),
    body("fullname")
      .notEmpty()
      .withMessage("Fullname wakilah Tidak Boleh Kosong")
      .trim(),
    body("jabatan")
      .notEmpty()
      .withMessage("Jabatan wakilah Tidak Boleh Kosong")
      .trim(),
    body("whatsapp_number")
      .notEmpty()
      .withMessage("Nomor whatsapp Tidak Boleh Kosong")
      .trim(),
  ],
  Controller.add,
);

router.post(
  "/wakalah/update",
  authenticateTokenAdministrator,
  [
    body("id")
      .notEmpty()
      .withMessage("ID wakalah Tidak Boleh Kosong")
      .trim()
      .custom(validation.check_id),
    body("desa_id")
      .notEmpty()
      .withMessage("Desa Tidak Boleh Kosong")
      .trim()
      .custom(validation.check_desa_id),
    body("fullname")
      .notEmpty()
      .withMessage("Fullname wakilah Tidak Boleh Kosong")
      .trim(),
    body("jabatan")
      .notEmpty()
      .withMessage("Jabatan wakilah Tidak Boleh Kosong")
      .trim(),
    body("whatsapp_number")
      .notEmpty()
      .withMessage("Nomor whatsapp Tidak Boleh Kosong")
      .trim(),
  ],
  Controller.update,
);

router.post(
  "/wakalah/delete",
  authenticateTokenAdministrator,
  [
    body("id")
      .notEmpty()
      .withMessage("ID wakalah Tidak Boleh Kosong")
      .trim()
      .custom(validation.check_id),
  ],
  Controller.delete,
);

router.post(
  "/wakalah/get_info_edit",
  authenticateTokenAdministrator,
  [
    body("id")
      .notEmpty()
      .withMessage("ID wakalah Tidak Boleh Kosong")
      .trim()
      .custom(validation.check_id),
  ],
  Controller.get_info_edit,
);

module.exports = router;
