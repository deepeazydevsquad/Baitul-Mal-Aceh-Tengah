"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("Members", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      kode: {
        type: Sequelize.STRING,
      },
      desa_id: {
        type: Sequelize.INTEGER,
        references: {
          model: "Desas",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      tipe: {
        type: Sequelize.ENUM,
        values: ["perorangan", "instansi"],
        defaultValue: "perorangan",
      },
      fullname: {
        type: Sequelize.STRING,
      },
      nomor_ktp: {
        type: Sequelize.STRING,
      },
      nomor_kk: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      whatsapp_number: {
        type: Sequelize.STRING,
      },
      birth_date: {
        type: Sequelize.DATEONLY,
      },
      alamat: {
        type: Sequelize.TEXT,
      },
      username: {
        type: Sequelize.STRING,
      },
      password: {
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
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("Members");
  },
};
