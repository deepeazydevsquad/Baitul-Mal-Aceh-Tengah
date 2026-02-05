const { Wakalah, Desa } = require("../models");
const { Op } = require("sequelize");

const validation = {};

validation.check_id = async (value) => {
  const check = await Wakalah.findOne({
    where: {
      id: value,
    },
  });
  if (!check) {
    throw new Error("ID Desa tidak ditemukan");
  }
  return true;
};

validation.check_desa_id = async (value) => {
  const check = await Desa.findOne({
    where: {
      id: value,
    },
  });
  if (!check) {
    throw new Error("ID Desa tidak ditemukan");
  }
  return true;
};

module.exports = validation;
