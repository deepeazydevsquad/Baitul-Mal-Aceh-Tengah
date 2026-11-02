'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Otp extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Otp.init({
    whatsapp_number: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    purpose: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "registration",
    },
    otp: {
      type: DataTypes.STRING(64),
      allowNull: false,
    },
    otp_salt: {
      type: DataTypes.STRING(64),
      allowNull: false,
    },
    otp_time: DataTypes.DATE,
    status: {
      type: DataTypes.ENUM(["digunakan", "belum_digunakan"]),
      defaultValue: "belum_digunakan",
    },
    attempts: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
  }, {
    sequelize,
    modelName: 'Otp',
  });
  return Otp;
};
