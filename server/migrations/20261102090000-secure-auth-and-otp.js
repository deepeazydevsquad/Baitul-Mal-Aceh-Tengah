"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("Auth_sessions", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      sid: {
        type: Sequelize.STRING(64),
        allowNull: false,
        unique: true,
      },
      principal_type: {
        type: Sequelize.ENUM("administrator", "member"),
        allowNull: false,
      },
      principal_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      refresh_jti: {
        type: Sequelize.STRING(64),
        allowNull: false,
      },
      expires_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      revoked_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
    await queryInterface.addIndex("Auth_sessions", [
      "principal_type",
      "principal_id",
    ]);
    await queryInterface.addIndex("Auth_sessions", ["expires_at"]);

    await queryInterface.changeColumn("Otps", "otp", {
      type: Sequelize.STRING(64),
      allowNull: true,
    });
    await queryInterface.addColumn("Otps", "otp_salt", {
      type: Sequelize.STRING(64),
      allowNull: true,
    });
    await queryInterface.addColumn("Otps", "purpose", {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: "registration",
    });
    await queryInterface.addColumn("Otps", "attempts", {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    });
    await queryInterface.addIndex("Otps", ["whatsapp_number", "createdAt"]);

    // OTP lama tidak memiliki verifier HMAC yang valid dan tidak boleh dipakai.
    await queryInterface.sequelize.query(
      'UPDATE `Otps` SET `status` = \'digunakan\''
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex("Otps", ["whatsapp_number", "createdAt"]);
    await queryInterface.removeColumn("Otps", "attempts");
    await queryInterface.removeColumn("Otps", "purpose");
    await queryInterface.removeColumn("Otps", "otp_salt");
    await queryInterface.changeColumn("Otps", "otp", {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
    await queryInterface.dropTable("Auth_sessions");
  },
};
