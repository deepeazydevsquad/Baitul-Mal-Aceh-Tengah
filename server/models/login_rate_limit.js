"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Login_rate_limit extends Model {
    static associate() {}
  }

  Login_rate_limit.init(
    {
      key_hash: {
        type: DataTypes.STRING(64),
        allowNull: false,
        unique: true,
      },
      attempt_count: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      reset_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "Login_rate_limit",
      tableName: "login_rate_limits",
      createdAt: "created_at",
      updatedAt: "updated_at",
      indexes: [{ fields: ["reset_at"] }],
    }
  );

  return Login_rate_limit;
};
