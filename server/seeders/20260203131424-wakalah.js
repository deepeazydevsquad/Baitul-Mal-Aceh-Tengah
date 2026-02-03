"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert("Wakalahs", [
      {
        id: 1,
        kode: "AABBCC",
        desa_id: 1,
        fullname: "Muslim",
        jabatan: "Imem",
        whatsapp_number: "085262802141",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("Wakalahs", null, {});
  },
};
