"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert("Syarat_kegiatans", [
      {
        kegiatan_id: 1,
        syarat_id: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        kegiatan_id: 1,
        syarat_id: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        kegiatan_id: 2,
        syarat_id: 3,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        kegiatan_id: 3,
        syarat_id: 4,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("Syarat_kegiatans", null, {});
  },
};
