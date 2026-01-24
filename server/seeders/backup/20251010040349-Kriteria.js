"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert(
      "Kriteria",
      [
        {
          kegiatan_id: 1,
          name: "Penerima termasuk golongan mustahik (fakir, miskin, amil, muallaf, riqab, gharimin, fisabilillah, ibnus sabil)",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          kegiatan_id: 1,
          name: "Memiliki surat keterangan tidak mampu dari kelurahan/desa",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          kegiatan_id: 1,
          name: "Domisili berada dalam wilayah kerja Baitulmal",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          kegiatan_id: 1,
          name: "Belum pernah menerima bantuan serupa dalam periode 12 bulan terakhir",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          kegiatan_id: 1,
          name: "Memiliki kebutuhan mendesak yang sesuai dengan jenis bantuan (contoh: bantuan pendidikan, kesehatan, modal usaha, dan lain-lain)",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          kegiatan_id: 1,
          name: "Bersedia mengikuti proses verifikasi dan survei lapangan oleh tim Baitulmal",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          kegiatan_id: 1,
          name: "Menandatangani surat pernyataan penggunaan dana sesuai peruntukan",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          kegiatan_id: 1,
          name: "Memiliki rekening aktif untuk penyaluran dana bantuan (jika diperlukan)",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          kegiatan_id: 1,
          name: "Tidak sedang menerima bantuan dari lembaga zakat lain pada waktu yang sama",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          kegiatan_id: 1,
          name: "Bersedia memberikan laporan atau bukti penggunaan dana bantuan sesuai ketentuan Baitulmal",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      {}
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete(
      "Kriteria",
      {
        tahun: 2025,
      },
      {}
    );
  },
};
