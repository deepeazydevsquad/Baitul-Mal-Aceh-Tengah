"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert(
      "Kegiatan_keseketariatans",
      [
        {
          kode: "SEK-001",
          nama_kegiatan: "Bantuan Operasional Dayah Modern",
          sumber_dana: "operasional_apbk",
          penerima: "Dayah Modern Misbahul Ulum",
          jenis_penerima: "instansi",
          nominal_kegiatan: 25000000,
          area_penyaluran: "kabupaten",
          desa_id: null,
          alamat: "Jl. Elak, Meunasah Mee, Muara Dua, Kota Lhokseumawe",
          tanggal_penyaluran: "2025-08-17",
          upload_bukti: "bukti/kegiatan_sek_001.pdf",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      {}
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("Kegiatan_keseketariatans", null, {});
  },
};
