"use strict";
const { QueryTypes } = require("sequelize");
const { normalizeNik } = require("../helper/nikHelper");

module.exports = {
  async up(queryInterface) {
    const members = await queryInterface.sequelize.query(
      "SELECT id, nomor_ktp FROM `Members` ORDER BY id ASC",
      { type: QueryTypes.SELECT }
    );
    const seen = new Map();
    const duplicates = [];

    for (const member of members) {
      const nik = normalizeNik(member.nomor_ktp);
      if (!nik) continue;
      if (seen.has(nik)) {
        duplicates.push({
          nik,
          ids: [seen.get(nik), member.id],
        });
      } else {
        seen.set(nik, member.id);
      }
    }
    if (duplicates.length > 0) {
      throw new Error(
        `NIK duplikat harus diperbaiki sebelum migration: ${duplicates
          .map((item) => `${item.nik} (IDs ${item.ids.join(", ")})`)
          .join("; ")}`
      );
    }

    for (const [nik, id] of seen.entries()) {
      await queryInterface.sequelize.query(
        "UPDATE `Members` SET `nomor_ktp` = :nik WHERE `id` = :id",
        { replacements: { nik, id } }
      );
    }
    await queryInterface.addIndex("Members", ["nomor_ktp"], {
      unique: true,
      name: "members_nomor_ktp_unique",
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex(
      "Members",
      "members_nomor_ktp_unique"
    );
  },
};
