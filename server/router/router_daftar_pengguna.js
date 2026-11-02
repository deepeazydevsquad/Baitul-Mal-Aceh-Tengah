const express = require("express");
const { body, param } = require("express-validator");
const controllers = require("../modules/daftar_pengguna/controllers/index");
const {
  authenticateTokenAdministrator,
} = require("../middleware/authenticateToken");
const validation = require("../validation/administrator");

const router = express.Router();

router.post(
  "/daftar_pengguna/list",
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
  controllers.list_daftar_pengguna
);

router.post(
  "/daftar_pengguna/add",
  authenticateTokenAdministrator,
  [
    body("name").notEmpty().withMessage("Nama Pengguna Tidak Boleh Kosong"),
    body("jabatan")
      .notEmpty()
      .withMessage("Jabatan Pengguna Tidak Boleh Kosong"),
    body("grup_id").notEmpty().withMessage("Grup Pengguna Tidak Boleh Kosong"),
    body("username")
      .notEmpty()
      .withMessage("Username Tidak Boleh Kosong")
      .custom(validation.check_username),
    body("password")
      .notEmpty()
      .withMessage("Password Tidak Boleh Kosong")
      .isLength({ min: 8 })
      .withMessage("Password minimal 8 karakter")
      .custom(validation.check_password),
    body("password_confirmation")
      .notEmpty()
      .withMessage("Konfirmasi Password Tidak Boleh Kosong")
      .custom((value, { req }) => {
        if (value !== req.body.password) {
          throw new Error("Konfirmasi Password Tidak Sama");
        }
        return true;
      }),
  ],
  controllers.add
);

router.post(
  "/daftar_pengguna/update",
  authenticateTokenAdministrator,
  [
    body("id")
      .notEmpty()
      .withMessage("ID Tidak Boleh Kosong")
      .isInt()
      .withMessage("ID harus angka"),
    body("name")
      .notEmpty()
      .withMessage("Name Tidak Boleh Kosong")
      .isString()
      .withMessage("Name Harus String"),
    body("grup_id").notEmpty().withMessage("Grup Tidak Boleh Kosong"),
    body("username")
      .notEmpty()
      .withMessage("Username Tidak Boleh Kosong")
      .custom(validation.check_username),
    body("password")
      .optional({ values: "falsy" })
      .isLength({ min: 8 })
      .withMessage("Password minimal 8 karakter")
      .custom(validation.check_password),
  ],
  controllers.update
);

router.post(
  "/daftar_pengguna/delete",
  authenticateTokenAdministrator,
  [
    body("id")
      .notEmpty()
      .withMessage("ID Tidak Boleh Kosong")
      .isInt()
      .withMessage("ID harus angka"),
  ],
  controllers.delete
);

router.post(
  "/daftar_pengguna/pengguna_by_id",
  authenticateTokenAdministrator,
  [
    body("id")
      .notEmpty()
      .withMessage("ID Tidak Boleh Kosong")
      .isInt()
      .withMessage("ID harus angka"),
  ],
  controllers.detail
);

router.get(
  "/daftar_pengguna/list_grup",
  authenticateTokenAdministrator,
  controllers.grup
);

module.exports = router;
