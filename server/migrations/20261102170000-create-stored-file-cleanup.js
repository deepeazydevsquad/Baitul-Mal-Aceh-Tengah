"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("Stored_file_cleanups", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      file_key: {
        allowNull: false,
        unique: true,
        type: Sequelize.STRING(64),
      },
      directory: {
        allowNull: false,
        type: Sequelize.TEXT,
      },
      filename: {
        allowNull: false,
        type: Sequelize.STRING,
      },
      reason: {
        allowNull: false,
        type: Sequelize.STRING,
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
  },

  async down(queryInterface) {
    await queryInterface.dropTable("Stored_file_cleanups");
  },
};
