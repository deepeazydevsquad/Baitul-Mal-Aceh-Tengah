const { Desa, Kecamatan } = require("../models");

helper = {};

helper.get_info_lokasi = async (id) => {
  const desa = await Desa.findOne({
    attributes: ["id", "name", "kecamatan_id"],
    where: { id },
    include: [
      {
        model: Kecamatan,
        attributes: ["id", "name"],
      },
    ],
  });

  if (!desa) {
    return {};
  }

  return {
    id: desa.id,
    desa_name: desa.name,
    kecamatan_id: desa.kecamatan_id,
    kecamatan_name: desa.Kecamatan.name,
  };
};

helper.get_info_lokasi_list = async (ids) => {
  const desaList = await Desa.findAll({
    attributes: ["id", "name", "kecamatan_id"],
    where: { id: ids }, // Sequelize auto IN
    include: [
      {
        model: Kecamatan,
        attributes: ["id", "name"],
      },
    ],
  });

  return desaList.map((desa) => ({
    id: desa.id,
    desa_name: desa.name,
    kecamatan_id: desa.kecamatan_id,
    kecamatan_name: desa.Kecamatan.name,
  }));
};

helper.kabupatenKota = () => {
  return "Kabupaten Bener Meriah";
};

module.exports = helper;
