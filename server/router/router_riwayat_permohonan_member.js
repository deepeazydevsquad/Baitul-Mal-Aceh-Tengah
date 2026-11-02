const express = require("express");
const { body } = require("express-validator");
const controllers = require("../modules/riwayat_permohonan_bantuan/controllers/index");
const {
  authenticateTokenMember,
} = require("../middleware/authenticateToken");

const router = express.Router();

router.post(
  "/riwayat_permohonan_member/list",
  authenticateTokenMember,
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
  controllers.list
);

router.post(
  "/riwayat_permohonan_member/delete",
  authenticateTokenMember,
  [
    body("id")
      .notEmpty()
      .withMessage("id Tidak Boleh Kosong")
      .isInt()
      .withMessage("id Harus Angka"),
  ],
  controllers.delete
);

module.exports = router;
