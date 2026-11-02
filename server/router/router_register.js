const express = require("express");
const { body } = require("express-validator");
const controllers = require("../modules/register/controllers/index");
const validation = require("../validation/register");
const {
    createPersistentRateLimiter,
} = require("../helper/rateLimitHelper");

const registerIpLimiter = createPersistentRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 10,
    keyGenerator: (req) => `register-ip:${req.ip}`,
    message: "Terlalu banyak permintaan registrasi. Silakan coba lagi nanti.",
});

const router = express.Router();

router.post(
    "/register",
    registerIpLimiter,
    [
        body("desa_id").notEmpty().withMessage("desa_id tidak boleh kosong."),
        body("tipe")
          .notEmpty()
          .withMessage("tipe tidak boleh kosong.")
          .isIn(["perorangan", "instansi"])
          .withMessage("tipe tidak valid."),
        body("fullname").notEmpty().withMessage("fullname tidak boleh kosong."),
        body("whatsapp_number").notEmpty().withMessage("whatsapp_number tidak boleh kosong."),
        body("otp")
            .notEmpty()
            .withMessage("otp tidak boleh kosong.")
            .isLength({ min: 6, max: 6 })
            .withMessage("otp harus 6 digit.")
            .isNumeric()
            .withMessage("otp harus berupa angka."),
        body("username")
          .notEmpty()
          .withMessage("username tidak boleh kosong.")
          .trim()
          .isLength({ min: 3, max: 100 })
          .withMessage("username harus 3-100 karakter.")
          .custom(validation.check_username),
        body("password")
          .notEmpty()
          .withMessage("password tidak boleh kosong.")
          .custom(validation.check_password),
        body("nomor_ktp")
          .if(body("tipe").equals("perorangan"))
          .notEmpty()
          .withMessage("nomor_ktp tidak boleh kosong.")
          .custom(validation.check_nik),
    ],
    controllers.register
);

router.post("/register/daftar_desa",
  [
    body("kecamatan_id").notEmpty().withMessage("kecamatan_id tidak boleh kosong.").custom(validation.check_id_kecamatan),
  ],
  controllers.list_desa
);

router.get("/register/daftar_kecamatan", controllers.list_kecamatan);

module.exports = router;

