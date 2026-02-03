"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Riwayat_pengumpulan extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Riwayat_pengumpulan.belongsTo(models.Member, {
        foreignKey: "member_id",
      });
      Riwayat_pengumpulan.belongsTo(models.Wakalah, {
        foreignKey: "wakalah_id",
      });
    }
  }
  Riwayat_pengumpulan.init(
    {
      member_id: DataTypes.INTEGER,
      wakalah_id: DataTypes.INTEGER,
      invoice: DataTypes.STRING,
      tipe: DataTypes.ENUM([
        "zakat_harta",
        "zakat_simpanan",
        "zakat_profesi",
        "zakat_perdagangan",
        "zakat_pertanian",
        "infaq",
      ]),
      nominal: DataTypes.INTEGER,
      kode: DataTypes.INTEGER,
      status: DataTypes.ENUM(["process", "success", "failed"]),
      alasan_penolakan: DataTypes.STRING,
      tipe_pembayaran: DataTypes.ENUM(["online", "transfer", "cash"]),
      nominal_transfer: DataTypes.INTEGER,
      bukti_transfer: DataTypes.STRING,
      nominal_setoran: DataTypes.INTEGER,
      bukti_setoran: DataTypes.STRING,
      posisi_uang: DataTypes.ENUM(["kantor_baitulmal", "bank"]),
      nama_petugas: DataTypes.STRING,
      jabatan_petugas: DataTypes.STRING,
      konfirmasi_pembayaran: DataTypes.ENUM(["sudah_dikirim", "belum_dikirim"]),
    },
    {
      sequelize,
      modelName: "Riwayat_pengumpulan",
    },
  );
  return Riwayat_pengumpulan;
};
