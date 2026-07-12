"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert(
      "Wakalahs",
      [
        {
          nama: "Budi Santoso",
          nik: "1106012345670001",
          desa_id: 1, // Assuming desa_id 1 exists from early seeds
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          nama: "Siti Aminah",
          nik: "1106012345670002",
          desa_id: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          nama: "Ahmad Rifai",
          nik: "1106012345670003",
          desa_id: 2, // Assuming desa_id 2 exists
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      ],
      {}
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("Wakalahs", null, {});
  },
};
