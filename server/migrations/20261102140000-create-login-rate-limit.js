"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("login_rate_limits", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      key_hash: {
        type: Sequelize.STRING(64),
        allowNull: false,
        unique: true,
      },
      attempt_count: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      reset_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
    await queryInterface.addIndex("login_rate_limits", ["reset_at"], {
      name: "login_rate_limits_reset_at",
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("login_rate_limits");
  },
};
