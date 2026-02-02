"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert("Otps", [
      {
        id: 1,
        whatsapp_number: "085262802141",
        otp: "123456",
        otp_time: new Date(new Date().getTime() + 24 * 60 * 60 * 1000), // 1 hari ke depan
        status: "belum_digunakan",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("Otps", null, {});
  },
};
