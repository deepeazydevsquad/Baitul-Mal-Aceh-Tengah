"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert(
      "Kecamatans",
      [
        {
          kode: "BD",
          name: "Bandar",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          kode: "BK",
          name: "Bener Kelipah",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          kode: "BU",
          name: "Bukit",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          kode: "GP",
          name: "Gajah Putih",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          kode: "MS",
          name: "Mesidah",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          kode: "PM",
          name: "Permata",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          kode: "PR",
          name: "Pintu Rime Gayo",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          kode: "SU",
          name: "Syiah Utama",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          kode: "TG",
          name: "Timang Gajah",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          kode: "WP",
          name: "Wih Pesam",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      {},
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("Kecamatans", null, {});
  },
};
