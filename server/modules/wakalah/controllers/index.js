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
    console.log("xxx");
    console.log(error);
    console.log("xxx");
    handleServerError(res, error);
  }
};

module.exports = controllers;
