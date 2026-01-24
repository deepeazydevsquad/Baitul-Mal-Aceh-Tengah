'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('Monevs', [
      // --- Permohonan 1: Konsumtif ---
      {
        permohonan_id: 1,
        jenis_monev: 'evaluasi_konsumtif',
        tipe: 'evaluasi',
        nama_petugas_monev: 'John Doe',
        tim_monev_1: 'John Doe',
        tim_monev_2: 'Jane Doe',
        tim_monev_3: 'Bob Smith',
        rekomendasi_tim: 'Evaluasi menunjukkan bantuan dimanfaatkan dengan baik.',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        permohonan_id: 1,
        jenis_monev: 'monitoring_konsumtif',
        tipe: 'monitoring',
        nama_petugas_monev: 'John Doe',
        tim_monev_1: 'John Doe',
        tim_monev_2: 'Jane Doe',
        tim_monev_3: 'Bob Smith',
        rekomendasi_tim: 'Monitoring awal menunjukkan proses pencairan berjalan lancar.',
        createdAt: new Date(),
        updatedAt: new Date(),
      },

      // --- Permohonan 2: Pemberdayaan Ekonomi ---
      {
        permohonan_id: 2,
        jenis_monev: 'evaluasi_pemberdayaan_ekonomi',
        tipe: 'evaluasi',
        nama_petugas_monev: 'Andi Pratama',
        tim_monev_1: 'Andi Pratama',
        tim_monev_2: 'Dewi Lestari',
        tim_monev_3: 'Rudi Hartono',
        rekomendasi_tim: 'Usaha mustahik berkembang signifikan, lanjutkan program dukungan.',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        permohonan_id: 2,
        jenis_monev: 'monitoring_pemberdayaan_ekonomi',
        tipe: 'monitoring',
        nama_petugas_monev: 'Andi Pratama',
        tim_monev_1: 'Andi Pratama',
        tim_monev_2: 'Dewi Lestari',
        tim_monev_3: 'Rudi Hartono',
        rekomendasi_tim: 'Monitoring menunjukkan penggunaan modal usaha tepat sasaran.',
        createdAt: new Date(),
        updatedAt: new Date(),
      },

      // --- Permohonan 3: Pendidikan ---
      {
        permohonan_id: 3,
        jenis_monev: 'evaluasi_pendidikan',
        tipe: 'evaluasi',
        nama_petugas_monev: 'Rina Marlina',
        tim_monev_1: 'Rina Marlina',
        tim_monev_2: 'Ahmad Fauzan',
        tim_monev_3: 'Lina Sari',
        rekomendasi_tim: 'Siswa penerima bantuan menunjukkan peningkatan prestasi akademik.',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        permohonan_id: 3,
        jenis_monev: 'monitoring_pendidikan',
        tipe: 'monitoring',
        nama_petugas_monev: 'Rina Marlina',
        tim_monev_1: 'Rina Marlina',
        tim_monev_2: 'Ahmad Fauzan',
        tim_monev_3: 'Lina Sari',
        rekomendasi_tim: 'Monitoring menunjukkan bantuan diterima tepat waktu oleh penerima.',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Monevs', null, {});
  },
};
