"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert(
      "Program_donasis",
      [
        {
          name: "Bantu Renovasi Masjid Raya",
          slug: "bantu-renovasi-masjid-raya",
          banner: "banners/program_donasi_masjid.jpg",
          tahun: 2025,
          deskripsi:
            "Program penggalangan dana untuk membantu renovasi Masjid Raya yang merupakan ikon kebanggaan kita bersama.",
          target_donasi_terkumpul: 500000000,
          status: "sedang_berlangsung",
          waktu_donasi: 120, // dalam hari
          createdAt: new Date(),
          updatedAt: new Date(),
        },

        {
          name: "Donasi Kemanusiaan untuk Korban Bencana",
          slug: "donasi-kemanusiaan-untuk-korban-bencana",
          banner: "banners/program_donasi_bencana.jpg",
          tahun: 2025,
          deskripsi:
            "Penggalangan dana cepat untuk membantu saudara-saudara kita yang terdampak bencana alam.",
          target_donasi_terkumpul: 150000000,
          status: "ditutup",
          waktu_donasi: 30,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      {}
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("Program_donasis", null, {});
  },
};
