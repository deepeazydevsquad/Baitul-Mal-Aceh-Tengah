"use strict";
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const { QueryTypes } = require("sequelize");

const LEGACY_ADMIN_HASH =
  "$2a$10$Zr648UXQwtmNNUqeHhE5oujX.ecj7Kz4xL8Fv9iOQXMOREUf2PVDK";
const LEGACY_MEMBER_HASH =
  "$2a$10$0nIvAjMEhKk2S2T2GbP1ou0OIpItaEtlHqb9Dns1NSQdkVM1r6o82";

module.exports = {
  async up(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    // The replacement is intentionally unknown, invalidating default accounts.
    const disabledHash = await bcrypt.hash(
      crypto.randomBytes(32).toString("hex"),
      12
    );
    const replacements = {
      disabledHash,
      adminHash: LEGACY_ADMIN_HASH,
      memberHash: LEGACY_MEMBER_HASH,
    };

    try {
      const affectedUsers = await queryInterface.sequelize.query(
        "SELECT id FROM `Users` WHERE `password` IN (:adminHash, :memberHash) FOR UPDATE",
        { replacements, transaction, type: QueryTypes.SELECT }
      );
      const affectedMembers = await queryInterface.sequelize.query(
        "SELECT id FROM `Members` WHERE `password` IN (:adminHash, :memberHash) FOR UPDATE",
        { replacements, transaction, type: QueryTypes.SELECT }
      );

      await queryInterface.sequelize.query(
        "UPDATE `Users` SET `password` = :disabledHash, `updatedAt` = NOW() WHERE `password` IN (:adminHash, :memberHash)",
        { replacements, transaction }
      );
      await queryInterface.sequelize.query(
        "UPDATE `Members` SET `password` = :disabledHash, `updatedAt` = NOW() WHERE `password` IN (:adminHash, :memberHash)",
        { replacements, transaction }
      );
      await queryInterface.sequelize.query(
        "UPDATE `Request_members` SET `password` = :disabledHash, `updatedAt` = NOW() WHERE `password` IN (:adminHash, :memberHash)",
        { replacements, transaction }
      );

      if (affectedUsers.length > 0) {
        await queryInterface.sequelize.query(
          "UPDATE `Auth_sessions` SET `revoked_at` = NOW() WHERE `principal_type` = 'administrator' AND `principal_id` IN (:userIds)",
          {
            replacements: { userIds: affectedUsers.map((row) => row.id) },
            transaction,
          }
        );
      }
      if (affectedMembers.length > 0) {
        await queryInterface.sequelize.query(
          "UPDATE `Auth_sessions` SET `revoked_at` = NOW() WHERE `principal_type` = 'member' AND `principal_id` IN (:memberIds)",
          {
            replacements: { memberIds: affectedMembers.map((row) => row.id) },
            transaction,
          }
        );
      }
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down() {
    // Legacy default credentials are intentionally not restored.
  },
};
