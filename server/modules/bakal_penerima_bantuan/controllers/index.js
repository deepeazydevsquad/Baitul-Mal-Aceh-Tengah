const Model_r = require("../models/model_r");
const Model_cud = require("../models/model_cud");
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

controllers.list_bakal_penerima_bantuan = async (req, res) => {
  if (!(await handleValidationErrors(req, res))) return;

  try {
    const model_r = new Model_r(req);
    const feedBack = await model_r.bakal_penerima_bantuan();

    res.status(200).json({
      error: false,
      data: feedBack.data,
      total: feedBack.total,
    });
  } catch (error) {
    handleServerError(res, error);
  }
};

controllers.get_info_permohonan = async (req, res) => {
  if (!(await handleValidationErrors(req, res))) return;

  try {
    const model_r = new Model_r(req);
    const feedBack = await model_r.get_info_permohonan();

    res.status(200).json({
      error: false,
      data: feedBack,
      total: 1,
    });
  } catch (error) {
    handleServerError(res, error);
  }
};

controllers.list_belum_upload_berita_acara = async (req, res) => {
  if (!(await handleValidationErrors(req, res))) return;

  try {
    const model_r = new Model_r(req);
    const feedBack = await model_r.list_belum_upload_berita_acara();

    res.status(200).json({
      error: false,
      data: feedBack.data,
      total: feedBack.total,
    });
  } catch (error) {
    handleServerError(res, error);
  }
};

controllers.realisasi_bantuan = async (req, res) => {
  if (!(await handleValidationErrors(req, res))) return;

  let model_cud;
  try {
    model_cud = new Model_cud(req);
    await model_cud.realisasi_bantuan();

    if (await model_cud.response()) {
      res.status(200).json({
        error: false,
        error_msg: "Realisasi bantuan berhasil disimpan.",
      });
    } else {
      res.status(model_cud.statusCode || 400).json({
        error: true,
        error_msg:
          model_cud.message || "Realisasi bantuan gagal disimpan.",
        code: model_cud.errorCode,
      });
    }
  } catch (error) {
    handleServerError(res, error);
  }
};

controllers.get_info_upload_berita_acara = async (req, res) => {
  if (!(await handleValidationErrors(req, res))) return;

  try {
    const model_r = new Model_r(req);
    const feedBack = await model_r.get_info_upload_berita_acara();

    res.status(200).json({
      error: false,
      data: feedBack,
      total: 1,
    });
  } catch (error) {
    handleServerError(res, error);
  }
};

controllers.upload_berita_acara = async (req, res) => {
  if (!(await handleValidationErrors(req, res))) return;

  let model_cud;
  try {
    model_cud = new Model_cud(req);
    await model_cud.upload_berita_acara();

    if (await model_cud.response()) {
      res.status(200).json({
        error: false,
        error_msg: "Berita acara berhasil diupload.",
      });
    } else {
      res.status(model_cud.statusCode || 400).json({
        error: true,
        error_msg: model_cud.message || "Berita acara gagal diupload.",
        code: model_cud.errorCode,
      });
    }
  } catch (error) {
    handleServerError(res, error);
  }
};

controllers.upload_berita_acara_massal = async (req, res) => {
  if (!(await handleValidationErrors(req, res))) return;

  let model_cud;
  try {
    model_cud = new Model_cud(req);
    await model_cud.upload_berita_acara_massal();

    if (await model_cud.response()) {
      res.status(200).json({
        error: false,
        error_msg: "Berita acara massal berhasil diupload.",
      });
    } else {
      res.status(model_cud.statusCode || 400).json({
        error: true,
        error_msg:
          model_cud.message || "Berita acara massal gagal diupload.",
        code: model_cud.errorCode,
      });
    }
  } catch (error) {
    handleServerError(res, error);
  }
};

controllers.batal_realisasi = async (req, res) => {
  if (!(await handleValidationErrors(req, res))) return;

  let model_cud;
  try {
    model_cud = new Model_cud(req);
    await model_cud.batal_realisasi();

    if (await model_cud.response()) {
      res.status(200).json({
        error: false,
        error_msg: "Realisasi bantuan berhasil dibatalkan.",
      });
    } else {
      res.status(model_cud.statusCode || 400).json({
        error: true,
        error_msg:
          model_cud.message || "Realisasi bantuan gagal dibatalkan.",
        code: model_cud.errorCode,
      });
    }
  } catch (error) {
    handleServerError(res, error);
  }
};

module.exports = controllers;
