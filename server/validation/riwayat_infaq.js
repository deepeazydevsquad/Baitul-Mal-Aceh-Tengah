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

// Validasi id riwayat infaq apakah sudah ada di database
validation.check_id_riwayat_infaq = async (value) => {
  console.log("ID riwayat infaq", value);
  const check = await Riwayat_pengumpulan.findOne({
    where: {
      id: value,
      tipe: "infaq",
    },
  });

  if (!check) {
    throw new Error("Riwayat infaq tidak terdaftar di pangkalan data");
  }
  return true;
};

// Validasi id Riwayat apakah sudah ada di database dan dalam tipe pembayaran cash atau transfer
validation.check_id_riwayat_infaq_cash_or_transfer = async (value) => {
  const check = await Riwayat_pengumpulan.findOne({
    where: {
      id: value,
      tipe: "infaq",
      tipe_pembayaran: {
        [Op.in]: ["transfer", "cash"],
      },
    },
  });

  if (!check) {
    throw new Error("Riwayat infaq tidak terdaftar di pangkalan data");
  }
};

validation.upload = createProofUpload("infaq");

module.exports = validation;
