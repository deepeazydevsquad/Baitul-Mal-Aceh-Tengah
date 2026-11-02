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
    const model = new Model_r(req);
    const feedBack = await model.get_filter_type();
    res.status(200).json({
      error: false,
      data: feedBack,
      total: 1,
    });
  } catch (error) {
    handleServerError(res, error);
  }
};

// READ Controllers
controllers.get_monev_list = async (req, res) => {
  try {
    const model = new Model_r(req);
    const feedBack = await model.daftar_monev();

    res.status(200).json({
      error: false,
      data: feedBack.data,
      total: feedBack.total,
    });
  } catch (error) {
    handleServerError(res, error);
  }
};

controllers.pertanyaan = async (req, res) => {
  try {
    const model = new Model_r(req);
    // memanggil method yang benar (daftar_monev)
    const data = await model.pertanyaan();
    res.status(200).json({ error: false, data, total: 1 });
  } catch (error) {
    handleServerError(res, error);
  }
};

controllers.kirim_jawaban = async (req, res) => {
  try {
    const model = new Model_cud(req);
    await model.kirim_jawaban();

    if (await model.response()) {
      res.status(200).json({
        error: false,
        error_msg: "Jawaban berhasil disimpan.",
      });
    } else {
      res.status(model.statusCode || 400).json({
        error: true,
        error_msg: model.message || "Jawaban gagal disimpan.",
      });
    }
  } catch (error) {
    handleServerError(res, error);
  }
};

module.exports = controllers;
