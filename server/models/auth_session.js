"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Auth_session extends Model {
    static associate() {}
  }

  Auth_session.init(
    {
      sid: {
        type: DataTypes.STRING(64),
        allowNull: false,
        unique: true,
      },
      principal_type: {
        type: DataTypes.ENUM("administrator", "member"),
        allowNull: false,
      },
      principal_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      refresh_jti: {
        type: DataTypes.STRING(64),
        allowNull: false,
      },
      expires_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      revoked_at: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: "Auth_session",
      indexes: [
        { fields: ["principal_type", "principal_id"] },
        { fields: ["expires_at"] },
      ],
    }
  );

  return Auth_session;
};
