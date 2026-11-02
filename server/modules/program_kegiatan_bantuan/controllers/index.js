const Model_r = require("../models/model_r");
const Model_cud = require("../models/model_cud");
const { handleValidationErrors, handleServerError } = require("../../../helper/handleError");

const controllers = {};

controllers.get_filter_type = async (req, res) => {
  if (!(await handleValidationErrors(req, res))) return;

  try {
    const model_r = new Model_r(req);
    const feedBack = await model_r.get_filter_type();

    res.status(200).json({
      error: false,
      data: feedBack,
      total: 1,
    });
  } catch (error) {
    handleServerError(res, error);
  }
};

controllers.daftar_kecamatan = async (req, res) => {
  try {
    const model_r = new Model_r(req);
    const feedBack = await model_r.daftar_kecamatan();

    res.status(200).json({
      error: false,
      data: feedBack,
      total: feedBack.length,
    });
  } catch (error) {
    handleServerError(res, error);
  }
};

controllers.daftar_desa = async (req, res) => {
  if (!(await handleValidationErrors(req, res))) return;

  try {
    const model_r = new Model_r(req);
    const feedBack = await model_r.daftar_desa();

    res.status(200).json({
      error: false,
      data: feedBack,
      total: feedBack.length,
    });
  } catch (error) {
    handleServerError(res, error);
  }
};

controllers.daftar_list = async (req, res) => {
  if (!(await handleValidationErrors(req, res))) return;

  try {
    const model_r = new Model_r(req);
    const feedBack = await model_r.program_kegiatan_bantuan();

    res.status(200).json({
      error: false,
      data: feedBack.data,
      total: feedBack.total,
    });
  } catch (error) {
    handleServerError(res, error);
  }
};

controllers.add = async (req, res) => {
  if (!(await handleValidationErrors(req, res))) return;

  try {
    const model_r = new Model_r(req);
    const model_cud = new Model_cud(req);
    const kode = await model_r.generate_kode();
    const slug = await model_r.generate_slug();
    await model_cud.add(kode, slug);

    if (await model_cud.response()) {
      res.status(200).json({
        error: false,
        error_msg: 'Program kegiatan bantuan berhasil ditambahkan.',
      });
    } else {
      res.status(400).json({
        error: true,
        error_msg: 'Program kegiatan bantuan gagal ditambahkan.',
      });
    }
  } catch (error) {
    handleServerError(res, error);
  }
};

controllers.get_info_edit_program_kegiatan_bantuan = async (req, res) => {
  if (!(await handleValidationErrors(req, res))) return;

  try {
    const model_r = new Model_r(req);
    const feedBack = await model_r.get_info_edit_program_kegiatan_bantuan();

    res.status(200).json({
      error: false,
      data: feedBack,
      total: 1
    });
  } catch (error) {
    handleServerError(res, error);
  }
};

controllers.edit = async (req, res) => {
  if (!(await handleValidationErrors(req, res))) return;

  let model_cud;
  try {
    model_cud = new Model_cud(req);
    await model_cud.edit();

    if (await model_cud.response()) {
      res.status(200).json({
        error: false,
        error_msg: 'Program kegiatan bantuan berhasil diperbaharui.',
      });
    } else {
      res.status(model_cud.statusCode || 400).json({
        error: true,
        error_msg:
          model_cud.message ||
          'Program kegiatan bantuan gagal diperbaharui.',
      });
    }
  } catch (error) {
    handleServerError(res, error);
  }
};

controllers.get_edit_status_program_bantuan = async (req, res) => {
  if (!(await handleValidationErrors(req, res))) return;

  try {
    const model_r = new Model_r(req);
    const feedBack = await model_r.get_edit_status_program_bantuan();

    res.status(200).json({
      error: false,
      data: feedBack,
      total: 1
    });
  } catch (error) {
    handleServerError(res, error);
  }
}

controllers.edit_status_program_bantuan = async (req, res) => {
  if (!(await handleValidationErrors(req, res))) return;

  try {
    const model_cud = new Model_cud(req);
    await model_cud.edit_status_program_bantuan();

    if (await model_cud.response()) {
      res.status(200).json({
        error: false,
        error_msg: 'Status Program kegiatan bantuan berhasil diperbaharui.',
      });
    } else {
      res.status(400).json({
        error: true,
        error_msg: 'Status Program kegiatan bantuan gagal diperbaharui.',
      });
    }
  } catch (error) {
    handleServerError(res, error);
  }
};

controllers.delete = async (req, res) => {
  if (!(await handleValidationErrors(req, res))) return;

  try {
    const model_cud = new Model_cud(req);
    await model_cud.delete();

    if (await model_cud.response()) {
      res.status(200).json({
        error: false,
        error_msg: 'Program kegiatan bantuan berhasil dihapus.',
      });
    } else {
      res.status(400).json({
        error: true,
        error_msg: 'Program kegiatan bantuan gagal dihapus.',
      });
    }
  } catch (error) {
    handleServerError(res, error);
  }
};

module.exports = controllers;
