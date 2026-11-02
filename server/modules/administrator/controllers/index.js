const Model_r = require("../models/model_r");
const Model_cud = require("../models/model_cud");
const {
  handleValidationErrors,
  handleServerError,
} = require("../../../helper/handleError");
const {
  compactPrincipal,
  issueTokenPair,
  verifyAndRotateRefreshToken,
  revokeSessionByRefreshToken,
  revokeAllSessions,
} = require("../../../helper/tokenHelper");
const {
  setRefreshCookie,
  clearRefreshCookie,
  readRefreshCookie,
} = require("../../../helper/authCookieHelper");
const controllers = {};

controllers.login_administrator_process = async (req, res) => {
  if (!(await handleValidationErrors(req, res))) return;
  try {
    const model = new Model_r(req);
    const data = await model.getInfoUser();
    if (!data) {
      return res.status(401).json({
        error: true,
        error_msg: "Username atau password tidak valid.",
      });
    }

    const tokens = await issueTokenPair(
      compactPrincipal(data, "administrator"),
      "administrator"
    );
    setRefreshCookie(res, "administrator", tokens.refresh_token);

    res.status(200).json({
      access_token: tokens.access_token,
      error: false,
      message: "Proses login berhasil dilakukan.",
    });
  } catch (error) {
    handleServerError(res, error);
  }
};

controllers.logout_administrator_process = async (req, res) => {
  const refreshToken = readRefreshCookie(req, "administrator");
  clearRefreshCookie(res, "administrator");
  if (!refreshToken) return res.status(200).json({ error: false });

  try {
    await revokeSessionByRefreshToken(refreshToken, "administrator");
    return res
      .status(200)
      .json({ error: false, error_msg: "Logout berhasil dilakukan" });
  } catch {
    return res.status(403).json({
      error: true,
      error_msg: "Refresh token tidak valid atau sudah digunakan.",
    });
  }
};

controllers.administrator = async (req, res) => {
  try {
    const model_r = new Model_r(req);
    const data = await model_r.get_menu_submenu_tab();
    res.status(200).json({
      error: false,
      message: "Data Berhasil Ditemukan.",
      menu_info: data.menu_info,
      user_info: data.user_info,
    });
  } catch (error) {
    handleServerError(res, error);
  }
};

controllers.refreshToken = async (req, res) => {
  const refreshToken = readRefreshCookie(req, "administrator");
  if (!refreshToken) {
    return res.status(401).json({ error: true, error_msg: "Token diperlukan" });
  }
  try {
    const tokens = await verifyAndRotateRefreshToken(
      refreshToken,
      "administrator"
    );
    setRefreshCookie(res, "administrator", tokens.refresh_token);
    return res.status(200).json({
      access_token: tokens.access_token,
      error: false,
      error_msg: "Token baru berhasil dibuat",
    });
  } catch {
    return res.status(403).json({
      error: true,
      error_msg: "Token kadaluarsa, tidak valid, atau sudah digunakan.",
    });
  }
};

controllers.edit_profile = async (req, res) => {
  if (!(await handleValidationErrors(req, res))) return;
  try {
    const model_cud = new Model_cud(req);
    await model_cud.edit_profile();

    if (await model_cud.response()) {
      if (req.body.password) {
        await revokeAllSessions("administrator", req.user.id);
      }
      res.status(200).json({
        error: false,
        error_msg: "Profile berhasil diperbaharui.",
      });
    } else {
      res.status(400).json({
        error: true,
        error_msg: "Profile gagal diperbaharui.",
      });
    }
  } catch (error) {
    handleServerError(res, error);
  }
};

controllers.get_info_edit_profile = async (req, res) => {
  if (!(await handleValidationErrors(req, res))) return;
  try {
    const model_r = new Model_r(req);
    const data = await model_r.get_info_edit_profile();
    res.status(200).json({
      error: false,
      message: "Data Berhasil Ditemukan.",
      data: data,
    });
  } catch (error) {
    handleServerError(res, error);
  }
};

module.exports = controllers;
