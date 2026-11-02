"use strict";
const bcrypt = require("bcryptjs");
const { validatePassword } = require("../helper/passwordPolicyHelper");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const adminPassword = process.env.SEED_ADMIN_PASSWORD;
    const bendaharaPassword = process.env.SEED_BENDAHARA_PASSWORD;
    if (!adminPassword || !bendaharaPassword) {
      throw new Error(
        "SEED_ADMIN_PASSWORD dan SEED_BENDAHARA_PASSWORD wajib diisi."
      );
    }
    validatePassword(adminPassword, { minLength: 12 });
    validatePassword(bendaharaPassword, { minLength: 12 });
    const [adminHash, bendaharaHash] = await Promise.all([
      bcrypt.hash(adminPassword, 12),
      bcrypt.hash(bendaharaPassword, 12),
    ]);
    await queryInterface.bulkInsert(
      "Users",
      [
        {
          grup_id: 1,
          name: "Administrator",
          jabatan: "Super Admin",
          kode: "AS1233",
          username: "admin",
          password: adminHash,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          grup_id: 2,
          name: "Bendahara",
          jabatan: "Bendahara",
          kode: "BD1234",
          username: "bendahara",
          password: bendaharaHash,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      {}
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("Users", null, {});
  },
};
