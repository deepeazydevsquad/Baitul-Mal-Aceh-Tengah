"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Desa extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Desa.belongsTo(models.Kecamatan, {
        foreignKey: "kecamatan_id",
      });
      Desa.hasMany(models.Member, {
        foreignKey: "desa_id",
        onDelete: "CASCADE",
      });
      Desa.hasMany(models.Request_member, {
        foreignKey: "desa_id",
        onDelete: "CASCADE",
      });
      Desa.hasMany(models.Desa_area_kegiatan, {
        foreignKey: "desa_id",
        onDelete: "CASCADE",
      });
      Desa.hasMany(models.Kegiatan_keseketariatan, {
        foreignKey: "desa_id",
        onDelete: "CASCADE",
      });
      Desa.hasMany(models.Wakalah, {
        foreignKey: "desa_id",
        onDelete: "CASCADE",
      });
    }
  }
  Desa.init(
    {
      kecamatan_id: DataTypes.INTEGER,
      name: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "Desa",
    },
  );
  return Desa;
};
