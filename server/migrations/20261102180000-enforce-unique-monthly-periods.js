"use strict";

const { QueryTypes } = require("sequelize");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const duplicates = await queryInterface.sequelize.query(
      `
        SELECT
          p.member_id,
          p.kegiatan_id,
          k.tahun,
          rp.bulan,
          COUNT(*) AS duplicate_count
        FROM Realisasi_permohonans rp
        JOIN Permohonans p ON p.id = rp.permohonan_id
        JOIN Kegiatans k ON k.id = p.kegiatan_id
        WHERE rp.bulan BETWEEN 1 AND 12
        GROUP BY p.member_id, p.kegiatan_id, k.tahun, rp.bulan
        HAVING COUNT(*) > 1
        ORDER BY p.member_id, p.kegiatan_id, k.tahun, rp.bulan
        LIMIT 20
      `,
      { type: QueryTypes.SELECT }
    );
    if (duplicates.length > 0) {
      const preview = duplicates
        .map(
          (row) =>
            `${row.member_id}/${row.kegiatan_id}/${row.tahun}/${row.bulan} (${row.duplicate_count})`
        )
        .join(", ");
      throw new Error(
        `Periode bulanan duplikat harus direkonsiliasi sebelum unique constraint dipasang: ${preview}`
      );
    }

    await queryInterface.addColumn(
      "Realisasi_permohonans",
      "periode_key",
      {
        type: Sequelize.STRING(64),
        allowNull: true,
      }
    );
    await queryInterface.sequelize.query(`
      UPDATE Realisasi_permohonans rp
      JOIN Permohonans p ON p.id = rp.permohonan_id
      JOIN Kegiatans k ON k.id = p.kegiatan_id
      SET rp.periode_key = CASE
        WHEN rp.bulan BETWEEN 1 AND 12
          THEN CONCAT(p.member_id, ':', p.kegiatan_id, ':', k.tahun, ':', rp.bulan)
        ELSE NULL
      END
    `);
    await queryInterface.addIndex(
      "Realisasi_permohonans",
      ["periode_key"],
      {
        unique: true,
        name: "realisasi_periode_bulanan_unique",
      }
    );
  },

  async down(queryInterface) {
    await queryInterface.removeIndex(
      "Realisasi_permohonans",
      "realisasi_periode_bulanan_unique"
    );
    await queryInterface.removeColumn(
      "Realisasi_permohonans",
      "periode_key"
    );
  },
};
