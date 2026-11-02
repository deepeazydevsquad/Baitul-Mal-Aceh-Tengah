"use strict";

const bcrypt = require("bcryptjs");
const {
  sequelize,
  User,
  Member,
  Auth_session,
} = require("../models");
const { validatePassword } = require("../helper/passwordPolicyHelper");

async function resetAccountPassword({ principal, username, password }) {
  principal = String(principal || "").trim();
  username = String(username || "").trim();
  password = String(password || "");
  if (!["administrator", "member"].includes(principal)) {
    throw new Error("RESET_PRINCIPAL_TYPE harus administrator atau member.");
  }
  if (!username || !password) {
    throw new Error("RESET_USERNAME dan RESET_PASSWORD wajib diisi.");
  }
  validatePassword(password, { minLength: 12 });

  const Account = principal === "administrator" ? User : Member;
  const transaction = await sequelize.transaction();
  try {
    const account = await Account.findOne({
      where: { username },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!account) {
      throw new Error(`Akun ${principal} tidak ditemukan.`);
    }
    const hash = await bcrypt.hash(password, 12);
    await account.update(
      { password: hash, updatedAt: new Date() },
      { transaction }
    );
    await Auth_session.update(
      { revoked_at: new Date() },
      {
        where: {
          principal_type: principal,
          principal_id: account.id,
          revoked_at: null,
        },
        transaction,
      }
    );
    await transaction.commit();
    return { id: account.id, username, principal };
  } catch (error) {
    if (!transaction.finished) await transaction.rollback();
    throw error;
  }
}

async function main() {
  const result = await resetAccountPassword({
    principal: process.env.RESET_PRINCIPAL_TYPE,
    username: process.env.RESET_USERNAME,
    password: process.env.RESET_PASSWORD,
  });
  console.log(`Password akun ${result.principal} berhasil direset.`);
}

if (require.main === module) {
  main()
    .catch((error) => {
      console.error(error.message);
      process.exitCode = 1;
    })
    .finally(async () => {
      await sequelize.close();
    });
}

module.exports = {
  resetAccountPassword,
};
