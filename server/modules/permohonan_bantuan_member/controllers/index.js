const Model_r = require("../models/model_r");
const Model_cud = require("../models/model_cud");
const validation = require("../../../validation/permohonan_member");

const {
  handleValidationErrors,
  handleServerError,
} = require("../../../helper/handleError");

const controllers = {};

controllers.get_syarat = async (req, res) => {
  if (!(await handleValidationErrors(req, res))) return;
  try {
    const model = new Model_r(req);
    const data = await model.get_syarat();
    return res.status(200).json(data); // pake return
  } catch (error) {
    console.error("_____DDDDD_______");
    console.error(error);
    console.error("_____DDDDD_______");
    return handleServerError(res, error); // kasih full error object
  }
};

controllers.get_kriteria = async (req, res) => {
  if (!(await handleValidationErrors(req, res))) return;
  try {
    const model = new Model_r(req);
    const data = await model.get_kriteria();
    return res.status(200).json(data); // pake return
  } catch (error) {
    console.error("_____DDDDD_______");
    console.error(error);
    console.error("_____DDDDD_______");
    return handleServerError(res, error); // kasih full error object
  }
};

controllers.get_desc = async (req, res) => {
  if (!(await handleValidationErrors(req, res))) return;
  try {
    const model = new Model_r(req);
    const data = await model.get_desc();
    return res.status(200).json(data); // pake return
  } catch (error) {
    console.error("_____DDDDD_______");
    console.error(error);
    console.error("_____DDDDD_______");
    return handleServerError(res, error); // kasih full error object
  }
};

controllers.get_info = async (req, res) => {
  if (!(await handleValidationErrors(req, res))) return;
  try {
    const model = new Model_r(req);
    const data = await model.get_info();
    return res.status(200).json(data); // pake return
  } catch (error) {
    console.error("_____DDDDD_______");
    console.error(error);
    console.error("_____DDDDD_______");
    return handleServerError(res, error); // kasih full error object
  }
};

controllers.get_lokasi = async (req, res) => {
  if (!(await handleValidationErrors(req, res))) return;
  try {
    const model = new Model_r(req);
    const data = await model.get_lokasi();
    return res.status(200).json(data); // pake return
  } catch (error) {
    console.error("_____DDDDD_______");
    console.error(error);
    console.error("_____DDDDD_______");
    return handleServerError(res, error); // kasih full error object
  }
};

controllers.get_info_member = async (req, res) => {
  if (!(await handleValidationErrors(req, res))) return;
  try {
    const model = new Model_r(req);
    const data = await model.get_info_member();
    return res.status(200).json(data); // pake return
  } catch (error) {
    console.error("_____DDDDD_______");
    console.error(error);
    console.error("_____DDDDD_______");
    return handleServerError(res, error); // kasih full error object
  }
};

controllers.list_bank = async (req, res) => {
  if (!(await handleValidationErrors(req, res))) return;

  try {
    const model_r = new Model_r(req);
    const feedBack = await model_r.list_bank();

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

  const model_cud = new Model_cud(req);
  try {
    await model_cud.add();
    const added = await model_cud.response();

    if (added) {
      res.status(200).json({
        error: false,
        error_msg: "Permohonan bantuan berhasil ditambahkan.",
      });
    } else {
      if (model_cud.isUploadCleanupSafe()) {
        await validation.removeUploadedDocuments(req);
      }
      const statusCode =
        model_cud.statusCode >= 400 && model_cud.statusCode <= 599
          ? model_cud.statusCode
          : 500;
      const responseBody = {
        error: true,
        error_msg:
          model_cud.message
            ? model_cud.message
            : "Permohonan bantuan gagal ditambahkan.",
      };
      if (model_cud.transactionOutcome === "commit_unknown") {
        responseBody.code = "COMMIT_OUTCOME_UNKNOWN";
      }
      res.status(statusCode).json(responseBody);
    }
  } catch (error) {
    if (model_cud.isUploadCleanupSafe()) {
      await validation
        .removeUploadedDocuments(req)
        .catch(() => undefined);
    }
    handleServerError(res, error);
  }
};

controllers.list_syarat = async (req, res) => {
  if (!(await handleValidationErrors(req, res))) return;

  try {
    const model_r = new Model_r(req);
    const feedBack = await model_r.daftar_syarat();

    res.status(200).json({
      error: false,
      data: feedBack.data,
      total: feedBack.total,
    });
  } catch (error) {
    handleServerError(res, error);
  }
};

module.exports = controllers;
