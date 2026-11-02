const { Op, Riwayat_pengumpulan, Member, Wakalah } = require("../models");
const { createProofUpload } = require("../helper/proofUploadHelper");

const validation = {};

// Validasi id member apakah sudah ada di database
validation.check_id_member = async (value) => {
  const check = await Member.findByPk(value);
  if (!check) {
    throw new Error("Member tidak terdaftar di pangkalan data");
  }
  return true;
};

// Validasi id wakalah opsional
validation.check_id_wakalah_optional = async (value) => {
  if (value === null || value === undefined || value === "") return true;
  const check = await Wakalah.findByPk(value);
  if (!check) {
    throw new Error("Wakalah tidak terdaftar di pangkalan data");
  }
  return true;
};

// Validasi id riwayat apakah sudah ada di database
validation.check_id_riwayat_zakat = async (value) => {
  const check = await Riwayat_pengumpulan.findOne({
    where: {
      id: value,
      tipe: {
        [Op.in]: [
          "zakat_harta",
          "zakat_simpanan",
          "zakat_profesi",
          "zakat_perdagangan",
          "zakat_pertanian",
        ],
      },
    },
  });

  if (!check) {
    throw new Error("Riwayat zakat tidak terdaftar di pangkalan data");
  }
  return true;
};

// Validasi id Riwayat apakah sudah ada di database dan dalam tipe pembayaran cash atau transfer
validation.check_id_riwayat_zakat_cash_or_transfer = async (value) => {
  const check = await Riwayat_pengumpulan.findOne({
    where: {
      id: value,
      tipe: {
        [Op.in]: [
          "zakat_harta",
          "zakat_simpanan",
          "zakat_profesi",
          "zakat_perdagangan",
          "zakat_pertanian",
        ],
      },
      tipe_pembayaran: {
        [Op.in]: ["transfer", "cash"],
      },
    },
  });

  if (!check) {
    throw new Error("Riwayat zakat tidak terdaftar di pangkalan data");
  }
};

validation.upload = createProofUpload("zakat");

module.exports = validation;
