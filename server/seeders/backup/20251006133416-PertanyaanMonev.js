'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert("Pertanyaan_monevs", [
      // --- EVALUASI KONSUMTIF ---
      {
        jenis_monev: "evaluasi_konsumtif",
        tipe: "evaluasi",
        bagian: "identitas_mustahik",
        pertanyaan: "Siapa nama lengkap Anda?",
        parent_id: null,
        bentuk_pertanyaan: "text",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        jenis_monev: "evaluasi_konsumtif",
        tipe: "evaluasi",
        bagian: "pemanfaatan_bantuan",
        pertanyaan: "Bantuan digunakan untuk keperluan apa saja?",
        parent_id: null,
        bentuk_pertanyaan: "text",
        createdAt: new Date(),
        updatedAt: new Date(),
      },

      // --- MONITORING KONSUMTIF ---
      {
        jenis_monev: "monitoring_konsumtif",
        tipe: "monitoring",
        bagian: "identitas_mustahik",
        pertanyaan: "Apakah alamat tempat tinggal masih sama seperti saat pengajuan bantuan?",
        parent_id: null,
        bentuk_pertanyaan: "checkbox",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        jenis_monev: "monitoring_konsumtif",
        tipe: "monitoring",
        bagian: "pemanfaatan_bantuan",
        pertanyaan: "Apakah bantuan sudah digunakan sepenuhnya?",
        parent_id: null,
        bentuk_pertanyaan: "checkbox",
        createdAt: new Date(),
        updatedAt: new Date(),
      },

      // --- EVALUASI PEMBERDAYAAN EKONOMI ---
      {
        jenis_monev: "evaluasi_pemberdayaan_ekonomi",
        tipe: "evaluasi",
        bagian: "kondisi_ekonomi",
        pertanyaan: "Berapa rata-rata pendapatan bulanan setelah menerima bantuan?",
        parent_id: null,
        bentuk_pertanyaan: "currency",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        jenis_monev: "evaluasi_pemberdayaan_ekonomi",
        tipe: "evaluasi",
        bagian: "pemanfaatan_bantuan",
        pertanyaan: "Apakah bantuan digunakan untuk pengembangan usaha?",
        parent_id: null,
        bentuk_pertanyaan: "checkbox",
        createdAt: new Date(),
        updatedAt: new Date(),
      },

      // --- MONITORING PEMBERDAYAAN EKONOMI ---
      {
        jenis_monev: "monitoring_pemberdayaan_ekonomi",
        tipe: "monitoring",
        bagian: "pendampingan",
        pertanyaan: "Apakah masih mendapatkan pendampingan dari lembaga?",
        parent_id: null,
        bentuk_pertanyaan: "checkbox",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        jenis_monev: "monitoring_pemberdayaan_ekonomi",
        tipe: "monitoring",
        bagian: "identitas_kelompok",
        pertanyaan: "Nama kelompok penerima manfaat?",
        parent_id: null,
        bentuk_pertanyaan: "text",
        createdAt: new Date(),
        updatedAt: new Date(),
      },

      // --- EVALUASI PENDIDIKAN ---
      {
        jenis_monev: "evaluasi_pendidikan",
        tipe: "evaluasi",
        bagian: "info_sekolah_dayah_kampus",
        pertanyaan: "Apakah siswa masih aktif bersekolah?",
        parent_id: null,
        bentuk_pertanyaan: "checkbox",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        jenis_monev: "evaluasi_pendidikan",
        tipe: "evaluasi",
        bagian: "kondisi_ekonomi",
        pertanyaan: "Apakah kondisi ekonomi keluarga meningkat setelah menerima bantuan pendidikan?",
        parent_id: null,
        bentuk_pertanyaan: "checkbox",
        createdAt: new Date(),
        updatedAt: new Date(),
      },

      // --- MONITORING PENDIDIKAN ---
      {
        jenis_monev: "monitoring_pendidikan",
        tipe: "monitoring",
        bagian: "identitas_orang_tua",
        pertanyaan: "Nama wali atau orang tua siswa?",
        parent_id: null,
        bentuk_pertanyaan: "text",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        jenis_monev: "monitoring_pendidikan",
        tipe: "monitoring",
        bagian: "partisipasi_sekolah",
        pertanyaan: "Seberapa aktif siswa dalam kegiatan sekolah?",
        parent_id: null,
        bentuk_pertanyaan: "text",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("Pertanyaan_monevs", null, {});
  },
};

