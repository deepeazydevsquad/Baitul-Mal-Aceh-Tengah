'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Asnafs', 'tipe', {
      type: Sequelize.ENUM('zakat', 'infaq'),
      defaultValue: 'zakat',
      allowNull: false,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Asnafs', 'tipe');
    // Hapus juga ENUM type-nya agar bersih (penting untuk PostgreSQL)
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_Asnafs_tipe";');
  },
};
