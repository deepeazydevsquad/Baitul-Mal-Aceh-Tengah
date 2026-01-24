"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const year = 2025; // biar jelas tahun 2025 semua

    function getEndOfMonth(year, month) {
      return new Date(year, month + 1, 0);
    }

    await queryInterface.bulkInsert(
      "Realisasi_permohonans",
      [
        {
          permohonan_id: 1,
          status: "approve",
          biaya_disetujui: 5000000,
          status_realisasi: "sudah_direalisasi",
          tanggal_realisasi: getEndOfMonth(year, 8), // September 2025
          berita_acara: "path/to/berita_acara_1.pdf",
          tipe: "transfer",
          nominal_realisasi: 5000000,
          bukti_transfer: "path/to/bukti_transfer_1.jpg",
          mou: "path/to/mou_1.pdf",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          permohonan_id: 2,
          status: "approve",
          biaya_disetujui: 5000000,
          status_realisasi: "belum_direalisasi",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          permohonan_id: 3,
          status: "approve",
          biaya_disetujui: 5000000,
          status_realisasi: "belum_direalisasi",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          permohonan_id: 4,
          status: "approve",
          biaya_disetujui: 5000000,
          status_realisasi: "sudah_direalisasi",
          tanggal_realisasi: new Date(),
          berita_acara: "path/to/berita_acara_1.pdf",
          tipe: "transfer",
          nominal_realisasi: 5000000,
          bukti_transfer: "path/to/bukti_transfer_1.jpg",
          mou: "path/to/mou_1.pdf",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          permohonan_id: 5,
          status: "approve",
          biaya_disetujui: 5000000,
          status_realisasi: "belum_direalisasi",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          permohonan_id: 6,
          status: "approve",
          biaya_disetujui: 5000000,
          status_realisasi: "sudah_direalisasi",
          tanggal_realisasi: new Date(),
          berita_acara: "path/to/berita_acara_1.pdf",
          tipe: "transfer",
          nominal_realisasi: 5000000,
          bukti_transfer: "path/to/bukti_transfer_1.jpg",
          mou: "path/to/mou_1.pdf",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          permohonan_id: 7,
          status: "approve",
          biaya_disetujui: 5000000,
          status_realisasi: "belum_direalisasi",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      {}
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("Realisasi_permohonans", null, {});
  },
};
