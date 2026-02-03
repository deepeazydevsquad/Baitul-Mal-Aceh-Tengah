"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("Riwayat_pengumpulans", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      member_id: {
        type: Sequelize.INTEGER,
        references: {
          model: "Members",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      wakalah_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "Wakalahs",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      invoice: {
        type: Sequelize.STRING,
      },
      tipe: {
        type: Sequelize.ENUM,
        values: [
          "zakat_harta",
          "zakat_simpanan",
          "zakat_profesi",
          "zakat_perdagangan",
          "zakat_pertanian",
          "infaq",
        ],
        defaultValue: "infaq",
      },
      nominal: {
        type: Sequelize.INTEGER,
      },
      kode: {
        type: Sequelize.INTEGER,
      },
      status: {
        type: Sequelize.ENUM,
        values: ["process", "success", "failed"],
        defaultValue: "process",
      },
      alasan_penolakan: {
        type: Sequelize.STRING,
      },
      tipe_pembayaran: {
        type: Sequelize.ENUM,
        values: ["online", "transfer", "cash"],
        defaultValue: "online",
      },
      nominal_transfer: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      bukti_transfer: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      nominal_setoran: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      bukti_setoran: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      posisi_uang: {
        type: Sequelize.ENUM,
        values: ["kantor_baitulmal", "bank"],
        defaultValue: "bank",
      },
      nama_petugas: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      jabatan_petugas: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      konfirmasi_pembayaran: {
        type: Sequelize.ENUM,
        values: ["sudah_dikirim", "belum_dikirim"],
        defaultValue: "belum_dikirim",
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("Riwayat_pengumpulans");
  },
};
