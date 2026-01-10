"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert(
      "Settings",
      [
        {
          name: "api_key",
          value: "EEC67097-6D17-4767-A3D5-D9D5B3420533",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          name: "device_key",
          value: "VFAURD",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          name: "whatsapp_number",
          value: "62895330275849",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          name: "icon",
          value: "site_icon.ico",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          name: "logo",
          value: "site_logo.png",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          name: "logo_tanpa_teks",
          value: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          name: "hero_logo",
          value: "hero_logo.png",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          name: "nama_kabupaten_kota",
          value: "Kab. Bener Meriah",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          name: "alamat",
          value:
            "Jl. Lebe Kader No.2, Asir Asir Asia, Kec. Lut Tawar, Kabupaten Bener Meriah, Provinsi Aceh 24519",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          name: "quote",
          value: "Sucikan Harta dengan Zakat",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          name: "harga_emas_per_gram",
          value: 2561879, // 1 gram emas = 2.561.879 rupiah per tanggal 02 November 2025
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          name: "nama_jabatan1",
          value: "Jetua",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          name: "nama_jabatan2",
          value: "Sekretaris",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          name: "nama_jabatan3",
          value: "Bendahara",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          name: "nama_pejabat1",
          value: "Naufal",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          name: "nama_pejabat2",
          value: "Pitra",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          name: "nama_pejabat3",
          value: "Yudis",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      {}
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("Settings", null, {});
  },
};
