"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert(
      "System_logs",
      [
        {
          user_id: 1,
          msg: "Login berhasil",
          ip: "192.168.1.10",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          user_id: 1,
          msg: "Menambahkan data donasi",
          ip: "192.168.1.11",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          user_id: 1,
          msg: "Logout",
          ip: "192.168.1.12",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      {}
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("System_logs", null, {});
  },
};
