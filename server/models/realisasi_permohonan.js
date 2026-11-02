'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Realisasi_permohonan extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Realisasi_permohonan.belongsTo(models.Permohonan, {
        foreignKey: "permohonan_id",
      });
      Realisasi_permohonan.hasMany(models.Validasi_syarat_permohonan, {
        foreignKey: "realisasi_permohonan_id",
        onDelete: "CASCADE",
      });
    }
  }
  Realisasi_permohonan.init({
    permohonan_id: DataTypes.INTEGER,
    status: DataTypes.ENUM(["process", "process_lapangan", "approve", "reject_berkas", "reject_tidak_layak", "reject_sudah_pernah", "reject_unkriteria", "reject_administrasi","ditunda"]),
    biaya_disetujui: DataTypes.INTEGER,
    status_realisasi: DataTypes.ENUM(["belum_direalisasi", "sudah_direalisasi"]),
    tanggal_realisasi: DataTypes.DATE,
    berita_acara: DataTypes.STRING,
    tipe: DataTypes.ENUM(["transfer", "bantuan_langsung"]),
    nominal_realisasi: DataTypes.INTEGER,
    bukti_transfer: DataTypes.STRING,
    mou: DataTypes.STRING,
    bulan: DataTypes.INTEGER,
    periode_key: DataTypes.STRING,
  }, {
    sequelize,
    modelName: 'Realisasi_permohonan',
  });
  return Realisasi_permohonan;
};
