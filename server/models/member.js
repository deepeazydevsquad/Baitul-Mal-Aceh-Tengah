"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Member extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Member.belongsTo(models.Desa, {
        foreignKey: "desa_id",
      });
      Member.hasMany(models.Riwayat_donasi, {
        foreignKey: "member_id",
      });
      Member.hasMany(models.Riwayat_pengumpulan, {
        foreignKey: "member_id",
      });
      Member.hasMany(models.Permohonan, {
        foreignKey: "member_id",
      });
    }
  }
  Member.init(
    {
      kode: DataTypes.STRING,
      desa_id: DataTypes.INTEGER,
      tipe: DataTypes.ENUM(["perorangan", "instansi"]),
      fullname: DataTypes.STRING,
      nomor_ktp: {
        type: DataTypes.STRING,
        unique: true,
      },
      nomor_kk: DataTypes.STRING,
      whatsapp_number: DataTypes.STRING,
      birth_date: DataTypes.DATEONLY,
      alamat: DataTypes.TEXT,
      username: {
        type: DataTypes.STRING,
        unique: true,
      },
      password: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "Member",
    }
  );
  return Member;
};
