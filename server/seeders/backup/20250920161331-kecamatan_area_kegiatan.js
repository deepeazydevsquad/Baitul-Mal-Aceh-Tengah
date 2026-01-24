"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();
    await queryInterface.bulkInsert(
      "Kecamatan_area_kegiatans",
      [
        {
          kegiatan_id: 3,
          kecamatan_id: 1,
          kuota: 10,
          createdAt: now,
          updatedAt: now,
        },
        {
          kegiatan_id: 3,
          kecamatan_id: 2,
          kuota: 20,
          createdAt: now,
          updatedAt: now,
        },
        {
          kegiatan_id: 3,
          kecamatan_id: 3,
          kuota: 15,
          createdAt: now,
          updatedAt: now,
        },
        {
          kegiatan_id: 3,
          kecamatan_id: 4,
          kuota: 25,
          createdAt: now,
          updatedAt: now,
        },
        {
          kegiatan_id: 3,
          kecamatan_id: 5,
          kuota: 30,
          createdAt: now,
          updatedAt: now,
        },
        {
          kegiatan_id: 3,
          kecamatan_id: 6,
          kuota: 40,
          createdAt: now,
          updatedAt: now,
        },
      ],
      {}
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete(
      "Kecamatan_area_kegiatans",
      { kegiatan_id: 2 },
      {}
    );
  },
};
