"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Ambil semua menu dari tabel Menus
    const menus = await queryInterface.sequelize.query(
      "SELECT id FROM Menus;",
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (menus.length === 0) return;

    // Ambil semua tab dari tabel Tabs
    const tabs = await queryInterface.sequelize.query("SELECT id FROM Tabs;", {
      type: Sequelize.QueryTypes.SELECT,
    });

    if (tabs.length === 0) return;

    await queryInterface.bulkInsert(
      "Submenus",
      [
        {
          menu_id: menus[1].id,
          name: "Pengumpulan",
          path: "pengumpulan",
          tab: `[{"id":"${tabs[1].id}"},{"id":"${tabs[2].id}"},{"id":"${tabs[3].id}"},{"id":"${tabs[4].id}"}]`,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          menu_id: menus[1].id,
          name: "Perencanaan",
          path: "perencanaan",
          tab: `[{"id":"${tabs[5].id}"},{"id":"${tabs[6].id}"},{"id":"${tabs[7].id}"},{"id":"${tabs[8].id}"},{"id":"${tabs[52].id}"},{"id":"${tabs[53].id}"}]`,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          menu_id: menus[1].id,
          name: "Pendistribusian",
          path: "pendistribusian",
          tab: `[{"id":"${tabs[9].id}"},{"id":"${tabs[41].id}"},{"id":"${tabs[40].id}"},{"id":"${tabs[10].id}"},{"id":"${tabs[11].id}"},{"id":"${tabs[12].id}"},{"id":"${tabs[13].id}"}]`,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          menu_id: menus[1].id,
          name: "Kesekretariatan",
          path: "kesekretariatan",
          tab: `[{"id":"${tabs[14].id}"}]`,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          menu_id: menus[2].id,
          name: "Keanggotaan",
          path: "keanggotaan",
          tab: `[{"id":"${tabs[15].id}"},{"id":"${tabs[54].id}"}]`,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          menu_id: menus[3].id,
          name: "Asnaf",
          path: "asnaf",
          tab: `[{"id":"${tabs[16].id}"}]`,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          menu_id: menus[3].id,
          name: "Program",
          path: "program",
          tab: `[{"id":"${tabs[17].id}"}]`,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          menu_id: menus[3].id,
          name: "Kecamatan & Desa",
          path: "kecamatan_desa",
          tab: `[{"id":"${tabs[19].id}"},{"id":"${tabs[18].id}"}]`,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          menu_id: menus[3].id,
          name: "Bank",
          path: "bank",
          tab: `[{"id":"${tabs[20].id}"},{"id":"${tabs[21].id}"}]`,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          menu_id: menus[4].id,
          name: "Laporan Umum",
          path: "laporan_umum",
          tab: `[{"id":"${tabs[31].id}"},{"id":"${tabs[42].id}"}]`,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          menu_id: menus[4].id,
          name: "Laporan Pengumpulan",
          path: "laporan_pengumpulan",
          tab: `[{"id":"${tabs[43].id}"}]`,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          menu_id: menus[4].id,
          name: "Laporan Perencanaan",
          path: "laporan_perencanaan",
          tab: `[{"id":"${tabs[45].id}"}]`,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          menu_id: menus[4].id,
          name: "Laporan Pendistribusian",
          path: "laporan_pendistribusian",
          tab: `[{"id":"${tabs[32].id}"},{"id":"${tabs[33].id}"},{"id":"${tabs[34].id}"},{"id":"${tabs[35].id}"},{"id":"${tabs[36].id}"},{"id":"${tabs[37].id}"}]`,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          menu_id: menus[4].id,
          name: "Laporan Kesekretariatan",
          path: "laporan_kesekretariatan",
          tab: `[{"id":"${tabs[46].id}"}]`,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          menu_id: menus[4].id,
          name: "Rekap",
          path: "rekap",
          tab: `[{"id":"${tabs[47].id}"},{"id":"${tabs[48].id}"},{"id":"${tabs[49].id}"},{"id":"${tabs[50].id}"},{"id":"${tabs[51].id}"}]`,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          menu_id: menus[5].id,
          name: "Pengaturan Umum",
          path: "pengaturan_umum",
          tab: `[{"id":"${tabs[22].id}"},{"id":"${tabs[23].id}"}]`,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          menu_id: menus[5].id,
          name: "Grup Akses",
          path: "grup_akses",
          tab: `[{"id":"${tabs[24].id}"}]`,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          menu_id: menus[5].id,
          name: "Daftar Pengguna",
          path: "daftar_pengguna",
          tab: `[{"id":"${tabs[25].id}"}]`,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          menu_id: menus[5].id,
          name: "Konten Publik",
          path: "konten_publik",
          tab: `[{"id":"${tabs[30].id}"}]`,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          menu_id: menus[5].id,
          name: "Whatsapp",
          path: "whatsapp",
          tab: `[{"id":"${tabs[27].id}"},{"id":"${tabs[39].id}"},{"id":"${tabs[26].id}"}]`,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          menu_id: menus[5].id,
          name: "System Log",
          path: "system_log",
          tab: `[{"id":"${tabs[28].id}"},{"id":"${tabs[29].id}"}]`,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      {}
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("Submenus", null, {});
  },
};
