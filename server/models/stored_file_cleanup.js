"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Stored_file_cleanup extends Model {}

  Stored_file_cleanup.init(
    {
      file_key: {
        type: DataTypes.STRING(64),
        allowNull: false,
        unique: true,
      },
      directory: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      filename: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      reason: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "Stored_file_cleanup",
    }
  );

  return Stored_file_cleanup;
};
