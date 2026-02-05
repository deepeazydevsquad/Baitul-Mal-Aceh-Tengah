const Model_r = require("../models/model_r");
const Model_cud = require("../models/model_cud");
const {
  handleValidationErrors,
  handleServerError,
} = require("../../../helper/handleError");

const controllers = {};

controllers.list = async (req, res) => {
  if (!(await handleValidationErrors(req, res))) return;

  try {
    const model_r = new Model_r(req);
    const feedBack = await model_r.list();

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
        error_msg: "Wakalah baru berhasil ditambahkan.",
      });
    } else {
      res.status(400).json({
        error: true,
        error_msg: "Wakalah baru gagal ditambahkan.",
      });
    }
  } catch (error) {
    handleServerError(res, error);
  }
};

controllers.update = async (req, res) => {
  if (!(await handleValidationErrors(req, res))) return;

  try {
    const model_cud = new Model_cud(req);
    await model_cud.update();

    if (await model_cud.response()) {
      res.status(200).json({
        error: false,
        error_msg: "Data wakalah berhasil diperbaharui.",
      });
    } else {
      res.status(400).json({
        error: true,
        error_msg: "Data wakalah gagal diperbaharui.",
      });
    }
  } catch (error) {
    handleServerError(res, error);
  }
};

controllers.delete = async (req, res) => {
  if (!(await handleValidationErrors(req, res))) return;

  try {
    const model = new Model_cud(req);
    await model.delete();

    if (await model.response()) {
      res.status(200).json({
        message: "Berhasil menghapus wakalah",
        status: "success",
      });
    } else {
      res.status(400).json({
        message: "Gagal menghapus wakalah",
        status: "failed",
      });
    }
  } catch (error) {
    console.error("Terjadi error saat menghapus wakalah:", error);
    handleServerError(res, error);
  }
};

controllers.get_info_edit = async (req, res) => {
  if (!(await handleValidationErrors(req, res))) return;

  try {
    const model = new Model_r(req);
    const data = await model.get_info_edit();
    let response = {};

    if (Object.keys(data).length > 0) {
      const kecamatan = await model.list_kecamatan();
      const desa = await model.list_desa(data.Desa.kecamatan_id);
      response = {
        data: {
          kecamatan_id: data.Desa.kecamatan_id,
          desa_id: data.desa_id,
          fullname: data.fullname,
          jabatan: data.jabatan,
          whatsapp_number: data.whatsapp_number,
        },
        kecamatan,
        desa,
      };
    } else {
      response = {
        data: [],
        kecamatan: [],
        desa: [],
      };
    }
    res.status(200).json({
      ...response,
      ...{ message: "Data wakalah berhasil ditemukan", status: "success" },
    });
  } catch (error) {
    console.error("Terjadi error saat menghapus wakalah:", error);
    handleServerError(res, error);
  }
};

module.exports = controllers;
