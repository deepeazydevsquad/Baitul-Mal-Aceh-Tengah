"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert(
      "Kriteria",
      [
        {
          kegiatan_id: 1,
          name: "Kurang Mampu",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          kegiatan_id: 1,
          name: "Sakit Keras",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          kegiatan_id: 2,
          name: "Miskin",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          kegiatan_id: 3,
          name: "Yatim Piatu",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      {}
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("Kriteria", null, {});
  },
};
