const { Op, Riwayat_donasi, Member } = require("../models");
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

// Validasi id riwayat donasi apakah sudah ada di database
validation.check_id_riwayat_donasi = async (value) => {
  console.log("ID riwayat donasi", value);
  const check = await Riwayat_donasi.findOne({
    where: {
      id: value,
    },
  });

  if (!check) {
    throw new Error("Riwayat donasi tidak terdaftar di pangkalan data");
  }
  return true;
};

// Validasi id Riwayat apakah sudah ada di database dan dalam tipe pembayaran cash atau transfer
validation.check_id_riwayat_donasi_cash_or_transfer = async (value) => {
  const check = await Riwayat_donasi.findOne({
    where: {
      id: value,
      tipe_pembayaran: {
        [Op.in]: ["transfer", "cash"],
      },
    },
  });

  if (!check) {
    throw new Error("Riwayat donasi tidak terdaftar di pangkalan data");
  }
};

validation.upload = createProofUpload("donasi");

module.exports = validation;
