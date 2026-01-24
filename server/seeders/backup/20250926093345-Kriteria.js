"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert(
      "Kriteria",
      [
        {
          kegiatan_id: 1,
          name: "Berada di Desa terancam bencana alam",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          kegiatan_id: 1,
          name: "Mampu membayar biaya kegiatan pemberdayaan ekonomi",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          kegiatan_id: 1,
          name: "Diutamakan Rumah yang terdekat",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          kegiatan_id: 1,
          name: "Diutamakan Mushalla atau Masjid yang terdekat",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          kegiatan_id: 1,
          name: "Diutamakan Puskesmas atau Rumah Sakit yang terdekat",
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
