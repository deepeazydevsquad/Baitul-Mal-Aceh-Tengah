const Model_r = require("../models/model_r");
const Model_cud = require("../models/model_cud");
const validation = require("../../../validation/validasi_permohonan_bantuan");
const {
  handleValidationErrors,
  handleServerError,
} = require("../../../helper/handleError");

const controllers = {};

controllers.get_filter_type = async (req, res) => {
  if (!(await handleValidationErrors(req, res))) return;

  try {
    const model_r = new Model_r(req);
    const feedBack = await model_r.get_filter_type();

    res.status(200).json({
      error: false,
      data: feedBack.data,
      total: feedBack.total,
    });
  } catch (error) {
    handleServerError(res, error);
  }
};

controllers.list_validasi_permohonan_bantuan = async (req, res) => {
  if (!(await handleValidationErrors(req, res))) return;

  try {
    const model_r = new Model_r(req);
    const feedBack = await model_r.validasi_permohonan_bantuan();

    res.status(200).json({
      error: false,
      data: feedBack.data,
      total: feedBack.total,
    });
  } catch (error) {
    handleServerError(res, error);
  }
};

controllers.get_info_edit_file = async (req, res) => {
  if (!(await handleValidationErrors(req, res))) return;

  try {
    const model_r = new Model_r(req);
    const feedBack = await model_r.get_info_edit_file();

    res.status(200).json({
      error: false,
      data: feedBack,
      total: 1,
    });
  } catch (error) {
    handleServerError(res, error);
  }
};

controllers.edit_file = async (req, res) => {
  if (!(await handleValidationErrors(req, res))) return;

  let model_cud;
  try {
    model_cud = new Model_cud(req);
    await model_cud.edit_file();

    if (await model_cud.response()) {
      res.status(200).json({
        error: false,
        error_msg: "File permohonan bantuan berhasil diperbaharui.",
      });
    } else {
      res.status(model_cud.statusCode || 400).json({
        error: true,
        error_msg:
          model_cud.message ||
          "File permohonan bantuan gagal diperbaharui.",
        code: model_cud.errorCode,
      });
    }
  } catch (error) {
    handleServerError(res, error);
  }
};

controllers.get_info_pemberitahuan = async (req, res) => {
  if (!(await handleValidationErrors(req, res))) return;

  try {
    const model_r = new Model_r(req);
    const feedBack = await model_r.get_info_pemberitahuan();

    res.status(200).json({
      error: false,
      data: feedBack,
      total: 1,
    });
  } catch (error) {
    handleServerError(res, error);
  }
};

controllers.approve_berkas = async (req, res) => {
  if (!(await handleValidationErrors(req, res))) return;

  try {
    const model_cud = new Model_cud(req);
    await model_cud.approve_berkas();

    if (await model_cud.response()) {
      res.status(200).json({
        error: false,
        error_msg: "Berkas permohonan bantuan berhasil disetujui.",
      });
    } else {
      res.status(400).json({
        error: true,
        error_msg: "Berkas permohonan bantuan gagal disetujui.",
      });
    }
  } catch (error) {
    handleServerError(res, error);
  }
};

controllers.reject_berkas = async (req, res) => {
  if (!(await handleValidationErrors(req, res))) return;

  try {
    const model_cud = new Model_cud(req);
    await model_cud.reject_berkas();

    if (await model_cud.response()) {
      res.status(200).json({
        error: false,
        error_msg: "Berkas permohonan bantuan berhasil ditolak.",
      });
    } else {
      res.status(400).json({
        error: true,
        error_msg: "Berkas permohonan bantuan gagal ditolak.",
      });
    }
  } catch (error) {
    handleServerError(res, error);
  }
};

controllers.send_pemberitahuan_wa = async (req, res) => {
  if (!(await handleValidationErrors(req, res))) return;

  try {
    const model_r = new Model_r(req);
    await model_r.send_notification_wa();

    res.status(200).json({
      error: false,
      error_msg: "Pemberitahuan WA berhasil dikirim.",
    });
  } catch (error) {
    handleServerError(res, error);
  }
};

controllers.get_info_reject_permohonan = async (req, res) => {
  if (!(await handleValidationErrors(req, res))) return;

  try {
    const model_r = new Model_r(req);
    const feedBack = await model_r.get_info_reject_permohonan();

    res.status(200).json({
      error: false,
      data: feedBack,
      total: 1,
    });
  } catch (error) {
    handleServerError(res, error);
  }
};

controllers.get_info_approve_permohonan = async (req, res) => {
  if (!(await handleValidationErrors(req, res))) return;

  try {
    const model_r = new Model_r(req);
    const feedBack = await model_r.get_info_approve_permohonan();

    res.status(200).json({
      error: false,
      data: feedBack,
      total: 1,
    });
  } catch (error) {
    handleServerError(res, error);
  }
};

controllers.approve_permohonan = async (req, res) => {
  if (!(await handleValidationErrors(req, res))) return;

  let model_cud;
  try {
    model_cud = new Model_cud(req);
    await model_cud.approve_permohonan();

    if (await model_cud.response()) {
      res.status(200).json({
        error: false,
        error_msg: "Permohonan bantuan berhasil disetujui.",
      });
    } else {
      res.status(model_cud.statusCode || 400).json({
        error: true,
        error_msg:
          model_cud.message || "Permohonan bantuan gagal disetujui.",
        code: model_cud.errorCode,
      });
    }
  } catch (error) {
    handleServerError(res, error);
  }
};

controllers.reject_permohonan = async (req, res) => {
  if (!(await handleValidationErrors(req, res))) return;

  let model_cud;
  try {
    model_cud = new Model_cud(req);
    await model_cud.reject_permohonan();

    if (await model_cud.response()) {
      res.status(200).json({
        error: false,
        error_msg: "Permohonan bantuan berhasil ditolak.",
      });
    } else {
      res.status(model_cud.statusCode || 400).json({
        error: true,
        error_msg:
          model_cud.message || "Permohonan bantuan gagal ditolak.",
        code: model_cud.errorCode,
      });
    }
  } catch (error) {
    handleServerError(res, error);
  }
};

module.exports = controllers;
