const express = require("express");
const controllers = require("../modules/register/controllers");
const {
  getRegisterValidation,
  getDaftarDesaValidation,
} = require("../validation/register");

const router = express.Router();

// ===== Endpoint Register =====

/**
 * POST /register
 * Endpoint untuk registrasi member baru
 */
router.post("/register", getRegisterValidation(), controllers.register);

/**
 * POST /register/daftar_desa
 * Endpoint untuk mendapatkan daftar desa berdasarkan kecamatan
 */
router.post(
  "/register/daftar_desa",
  getDaftarDesaValidation(),
  controllers.list_desa,
);

/**
 * GET /register/daftar_kecamatan
 * Endpoint untuk mendapatkan daftar semua kecamatan
 */
router.get("/register/daftar_kecamatan", controllers.list_kecamatan);

module.exports = router;
