"use strict";

async function renameDuplicates(queryInterface, tableName) {
  const [rows] = await queryInterface.sequelize.query(
    `SELECT id, username FROM \`${tableName}\` ORDER BY id ASC`
  );
  const seen = new Set();

  for (const row of rows) {
    const username = String(row.username || "").trim();
    if (!username) {
      await queryInterface.sequelize.query(
        `UPDATE \`${tableName}\` SET username = NULL WHERE id = :id`,
        { replacements: { id: row.id } }
      );
      continue;
    }

    const normalized = username.toLowerCase();
    if (!seen.has(normalized)) {
      seen.add(normalized);
      continue;
    }

    const suffix = `_dup_${row.id}`;
    const replacement = `${username.slice(0, 90 - suffix.length)}${suffix}`;
    await queryInterface.sequelize.query(
      `UPDATE \`${tableName}\` SET username = :username WHERE id = :id`,
      { replacements: { username: replacement, id: row.id } }
    );
    seen.add(replacement.toLowerCase());
  }
}

module.exports = {
  async up(queryInterface) {
    await renameDuplicates(queryInterface, "Users");
    await renameDuplicates(queryInterface, "Members");
    await queryInterface.addIndex("Users", ["username"], {
      unique: true,
      name: "users_username_unique",
    });
    await queryInterface.addIndex("Members", ["username"], {
      unique: true,
      name: "members_username_unique",
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex("Users", "users_username_unique");
    await queryInterface.removeIndex("Members", "members_username_unique");
  },
};
