const Model_r = require("../models/model_r");
const Model_cud = require("../models/model_cud");
const { handleValidationErrors, handleServerError } = require("../../../helper/handleError");

const controllers = {};

controllers.daftar_wakalah = async (req, res) => {
  if (!(await handleValidationErrors(req, res))) return;

  try {
    const model_r = new Model_r(req);
    const feedBack = await model_r.wakalah();

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
    const model_cud = new Model_cud(req);
    await model_cud.add();

    if (await model_cud.response()) {
      res.status(200).json({
        error: false,
        error_msg: 'Wakalah berhasil ditambahkan.',
      });
    } else {
      res.status(400).json({
        error: true,
        error_msg: 'Wakalah gagal ditambahkan.',
      });
    }
  } catch (error) {
    handleServerError(res, error);
  }
};

controllers.get_info_edit_wakalah = async (req, res) => {
  if (!(await handleValidationErrors(req, res))) return;

  try {
    const model_r = new Model_r(req);
    const feedBack = await model_r.get_info_edit_wakalah();

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

  try {
    const model_cud = new Model_cud(req);
    await model_cud.edit();

    if (await model_cud.response()) {
      res.status(200).json({
        error: false,
        error_msg: 'Wakalah berhasil diperbaharui.',
      });
    } else {
      res.status(400).json({
        error: true,
        error_msg: 'Wakalah gagal diperbaharui.',
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
        error_msg: 'Wakalah berhasil dihapus.',
      });
    } else {
      res.status(400).json({
        error: true,
        error_msg: 'Wakalah gagal dihapus.',
      });
    }
  } catch (error) {
    handleServerError(res, error);
  }
};

module.exports = controllers;
