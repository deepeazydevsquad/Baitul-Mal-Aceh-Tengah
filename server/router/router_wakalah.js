const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const Controller = require("../modules/wakalah/controllers/index");
const {
  authenticateTokenAdministrator,
} = require("../middleware/authenticateToken");
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

// router.post(
//   "/surveyor/detail/",
//   authenticateTokenAdministrator,
//   [body("id").isInt().withMessage("ID harus berupa angka")],
//   Controller.detail,
// );
// router.post(
//   "/surveyor/add",
//   authenticateTokenAdministrator,
//   [
//     body("name").notEmpty().withMessage("Nama Tidak Boleh Kosong").trim(),
//     body("nik").notEmpty().withMessage("Nik Tidak Boleh Kosong").trim(),
//     body("whatsapp_number")
//       .notEmpty()
//       .withMessage("Nomor Whatsapp Tidak Boleh Kosong")
//       .trim(),
//   ],
//   Controller.add,
// ); // Pastikan tidak typo

// router.post(
//   "/surveyor/update/",
//   authenticateTokenAdministrator,
//   [
//     body("id").isInt().withMessage("ID harus berupa angka"),
//     body("name").notEmpty().withMessage("Nama Tidak Boleh Kosong").trim(),
//     body("nik").notEmpty().withMessage("NIK Tidak Boleh Kosong").trim(),
//     body("whatsapp_number")
//       .notEmpty()
//       .withMessage("Nomor Whatsapp Tidak Boleh Kosong")
//       .trim(),
//   ],
//   Controller.updateSurveyor,
// );

// router.post(
//   "/wakalah/delete/",
//   authenticateTokenAdministrator,
//   [body("id").isInt().withMessage("ID harus berupa angka")],
//   Controller.deleteSurveyor,
// );

module.exports = router;
