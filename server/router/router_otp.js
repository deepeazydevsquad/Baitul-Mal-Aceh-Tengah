const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const Controller = require("../modules/otps/controllers/index"); // Pastikan ini benar
const validation = require("../validation/otp");
const {
    createPersistentRateLimiter,
} = require("../helper/rateLimitHelper");

const otpSendLimiter = createPersistentRateLimiter({
    windowMs: 10 * 60 * 1000,
    max: 5,
    keyGenerator: (req) =>
        `${req.ip}:${String(req.body?.whatsappNumber || "").replace(/\D/g, "")}`,
    message: "Terlalu banyak permintaan OTP. Silakan coba lagi nanti.",
});
const otpIpLimiter = createPersistentRateLimiter({
    windowMs: 10 * 60 * 1000,
    max: 20,
    keyGenerator: (req) => `otp-ip:${req.ip}`,
    message: "Terlalu banyak permintaan OTP. Silakan coba lagi nanti.",
});

router.post(
    "/send_otp",
    body("whatsappNumber")
        .notEmpty()
        .withMessage("Nomor Whatsapp Tidak Boleh Kosong")
        .trim()
        .custom(validation.check_whatsappnumber),
    otpIpLimiter,
    otpSendLimiter,
    Controller.sendOtp
); // Pastikan tidak typo

module.exports = router;

