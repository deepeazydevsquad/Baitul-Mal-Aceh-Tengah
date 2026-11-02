const Model_r = require("../models/model_r");
const Model_cud = require("../models/model_cud");
const {
  issueSurveyCapability,
} = require("../../../helper/surveyCapabilityHelper");
const {
  handleValidationErrors,
  handleServerError,
} = require("../../../helper/handleError");

const controllers = {};

controllers.create_session = async (req, res, next) => {
  if (!(await handleValidationErrors(req, res))) return;
  try {
    return await issueSurveyCapability(req, res);
  } catch (error) {
    return next(error);
  }
};

controllers.survey_lapangan = async (req, res) => {
  if (!(await handleValidationErrors(req, res))) return;

  try {
    const model_r = new Model_r(req);
    const feedBack = await model_r.survey_lapangan();

    console.log("=====>");
    console.log(feedBack);
    console.log("=====>");

    res.status(200).json({
      error: false,
      data: feedBack.data,
      total: feedBack.total,
    });
  } catch (error) {
    console.log("xxx");
    console.log(error);
    console.log("xxx");
    handleServerError(res, error);
  }
};

controllers.get_info_member = async (req, res) => {
  if (!(await handleValidationErrors(req, res))) return;

  try {
    const model_r = new Model_r(req);
    const feedBack = await model_r.get_info_member();

    res.status(200).json({
      error: false,
      data: feedBack,
      total: 1,
    });
  } catch (error) {
    handleServerError(res, error);
  }
};

controllers.submit = async (req, res) => {
  if (!(await handleValidationErrors(req, res))) return;

  try {
    const model_cud = new Model_cud(req);
    await model_cud.submit();

    if (await model_cud.response()) {
      res.status(200).json({
        error: false,
        error_msg: "Survey berhasil disimpan.",
      });
    } else {
      res.status(model_cud.statusCode || 400).json({
        error: true,
        error_msg: model_cud.message || "Survey gagal disimpan.",
        code: model_cud.errorCode || "SURVEY_NOT_SAVED",
      });
    }
  } catch (error) {
    handleServerError(res, error);
  }
};

module.exports = controllers;
