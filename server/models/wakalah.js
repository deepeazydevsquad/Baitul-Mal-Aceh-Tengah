'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Wakalah extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Wakalah.belongsTo(models.Desa, {
        foreignKey: "desa_id",
      });
      Wakalah.hasMany(models.Riwayat_pengumpulan, {
        foreignKey: "wakalah_id",
      });
    }
  }
  Wakalah.init({
    nama: DataTypes.STRING,
    nik: DataTypes.STRING,
    desa_id: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'Wakalah',
  });
  return Wakalah;
};
