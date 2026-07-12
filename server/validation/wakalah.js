const { Wakalah, Desa } = require("../models");
const { Op } = require("sequelize");

const validation = {};

validation.check_id_wakalah = async (value) => {
  const check = await Wakalah.findByPk(value);
  if (!check) {
    throw new Error("Wakalah tidak terdaftar di pangkalan data");
  }
  return true;
};

validation.check_desa = async (value) => {
  const check = await Desa.findByPk(value);
  if (!check) {
    throw new Error("Desa tidak ditemukan");
  }
  return true;
};

validation.check_nik = async (value, { req }) => {
  const id = req.body.id;
  
  if (id) {
    const check = await Wakalah.findOne({
      where: { id: { [Op.ne]: id }, nik: value },
    });
    if (check) throw new Error("NIK sudah terdaftar di pangkalan data");
  } else {
    const check = await Wakalah.findOne({
      where: { nik: value },
    });
    if (check) throw new Error("NIK sudah terdaftar di pangkalan data");
  }
  return true;
};

module.exports = validation;
