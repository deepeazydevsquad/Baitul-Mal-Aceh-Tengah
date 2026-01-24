'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert('Jawaban_monevs', [
      {
        monev_id: 1,
        pertanyaan_id: 1,
        jawaban: 'Nama saya Ahmad Fauzi',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        monev_id: 1,
        pertanyaan_id: 2,
        jawaban: 'Usaha kecil menengah (warung sembako)',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        monev_id: 1,
        pertanyaan_id: 3,
        jawaban: 'Pendapatan rata-rata 3 juta per bulan',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        monev_id: 2,
        pertanyaan_id: 1,
        jawaban: 'Nama saya Nur Aisyah',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        monev_id: 2,
        pertanyaan_id: 2,
        jawaban: 'Pedagang makanan ringan',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        monev_id: 2,
        pertanyaan_id: 3,
        jawaban: 'Pendapatan belum stabil, sekitar 1.5 juta per bulan',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        monev_id: 3,
        pertanyaan_id: 1,
        jawaban: 'Nama saya Rahmat Hidayat',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        monev_id: 3,
        pertanyaan_id: 2,
        jawaban: 'Petani padi',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        monev_id: 3,
        pertanyaan_id: 3,
        jawaban: 'Pendapatan musiman tergantung panen',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ])
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Jawaban_monevs', null, {});
  }
};
