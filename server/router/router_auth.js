const express = require("express");
const { body } = require("express-validator");
const controllersMember = require("../modules/member/controllers/index");
const controllersAdministrator = require("../modules/administrator/controllers/index");
const validationMember = require("../validation/member");
const validationAdministrator = require("../validation/administrator");
const {
  authenticateTokenAdministrator,
  authenticateTokenMember,
} = require("../middleware/authenticateToken");
const {
  createPersistentRateLimiter,
} = require("../helper/rateLimitHelper");

const loginLimiter = createPersistentRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  keyGenerator: (req) =>
    `${req.ip}:${String(req.body?.username || "").trim().toLowerCase()}`,
  message: "Terlalu banyak percobaan login. Silakan coba lagi nanti.",
});
const loginIpLimiter = createPersistentRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 30,
  keyGenerator: (req) => `ip:${req.ip}`,
  message: "Terlalu banyak percobaan login. Silakan coba lagi nanti.",
});
const loginAccountLimiter = createPersistentRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 20,
  keyGenerator: (req) =>
    `account:${String(req.body?.username || "").trim().toLowerCase()}`,
  message: "Akun sementara dibatasi karena terlalu banyak percobaan login.",
});
const refreshIpLimiter = createPersistentRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 30,
  keyGenerator: (req) => `refresh-ip:${req.ip}`,
  message: "Terlalu banyak permintaan refresh session.",
});

// ROUTER
const router = express.Router();

router.post(
  "/auth/login_member",
  body("username")
    .notEmpty()
    .withMessage("Username Tidak Boleh Kosong")
    .trim(),
  body("password")
    .notEmpty()
    .withMessage("Password Tidak Boleh Kosong")
    .isString(),
  loginIpLimiter,
  loginAccountLimiter,
  loginLimiter,
  controllersMember.login_member_process
);

router.post(
  "/auth/login_administrator",
  body("username")
    .notEmpty()
    .withMessage("Username Tidak Boleh Kosong")
    .trim(),
  body("password")
    .notEmpty()
    .withMessage("Password Tidak Boleh Kosong")
    .isString(),
  loginIpLimiter,
  loginAccountLimiter,
  loginLimiter,
  controllersAdministrator.login_administrator_process
);

router.post(
  "/auth/administrator/edit_profile",
  authenticateTokenAdministrator,
  [
    body("name").notEmpty().withMessage("Name Tidak Boleh Kosong").trim(),
    body("jabatan").notEmpty().withMessage("Jabatan Tidak Boleh Kosong").trim(),
    body("username")
      .notEmpty()
      .withMessage("Username Tidak Boleh Kosong")
      .trim()
      .custom(validationAdministrator.check_username),
    body("password")
      .optional()
      .trim()
      .custom(validationAdministrator.check_password),
  ],
  controllersAdministrator.edit_profile
);

router.post(
  "/auth/member/edit_profile_member",
  authenticateTokenMember,
  [
    body("fullname")
      .notEmpty()
      .withMessage("fullname Tidak Boleh Kosong")
      .trim(),
    body("username")
      .notEmpty()
      .withMessage("Username Tidak Boleh Kosong")
      .trim()
      .custom(validationMember.check_username),
    body("password").optional().custom(validationMember.check_password),
  ],
  controllersMember.edit_profile_member
);

router.get(
  "/auth/administrator/get_info_edit_profile",
  authenticateTokenAdministrator,
  controllersAdministrator.get_info_edit_profile
);

router.get(
  "/auth/member/get_info_edit_profile_member",
  authenticateTokenMember,
  controllersMember.get_info_edit_profile_member
);

router.post(
  "/auth/administrator/refresh",
  refreshIpLimiter,
  controllersAdministrator.refreshToken
);

router.post(
  "/auth/member/refresh",
  refreshIpLimiter,
  controllersMember.refreshToken
);

router.post("/auth/member/logout", controllersMember.logout_member_process);

router.post(
  "/auth/administrator/logout",
  controllersAdministrator.logout_administrator_process
);

module.exports = router;
