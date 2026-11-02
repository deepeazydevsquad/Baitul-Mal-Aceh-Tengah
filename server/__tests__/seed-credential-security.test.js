jest.mock("bcryptjs", () => ({
  hash: jest.fn(async () => "$2b$12$synthetic-non-default-hash"),
}));

const userSeeder = require("../seeders/20250908052706-User");
const memberSeeder = require("../seeders/20250908082711-Member");
const disableDefaults = require(
  "../migrations/20261102150000-disable-legacy-default-passwords"
);

describe("seed credential safety", () => {
  beforeEach(() => {
    delete process.env.SEED_ADMIN_PASSWORD;
    delete process.env.SEED_BENDAHARA_PASSWORD;
    delete process.env.SEED_MEMBER_PASSWORDS;
  });

  test("refuses administrator seeding without explicit passwords", async () => {
    const queryInterface = {
      bulkInsert: jest.fn(),
      sequelize: { query: jest.fn() },
    };
    await expect(
      userSeeder.up(queryInterface)
    ).rejects.toThrow(/SEED_ADMIN_PASSWORD/);
    expect(queryInterface.bulkInsert).not.toHaveBeenCalled();
  });

  test("refuses member seeding without an explicit password", async () => {
    const queryInterface = {
      bulkInsert: jest.fn(),
      sequelize: { query: jest.fn() },
    };
    await expect(
      memberSeeder.up(queryInterface)
    ).rejects.toThrow(/SEED_MEMBER_PASSWORDS/);
    expect(queryInterface.bulkInsert).not.toHaveBeenCalled();
  });

  test("rejects common administrator seed passwords", async () => {
    process.env.SEED_ADMIN_PASSWORD = "password1234";
    process.env.SEED_BENDAHARA_PASSWORD =
      "Synthetic-Bendahara-Password-42";
    const queryInterface = {
      bulkInsert: jest.fn(),
      sequelize: { query: jest.fn() },
    };

    await expect(userSeeder.up(queryInterface)).rejects.toThrow(/umum/i);
    expect(queryInterface.bulkInsert).not.toHaveBeenCalled();
  });

  test("rejects common member seed passwords", async () => {
    process.env.SEED_MEMBER_PASSWORDS = JSON.stringify({
      member_admin: "password1234",
      member_mita: "Synthetic-Mita-Password-42",
      member_instansi: "Synthetic-Instansi-Password-42",
      member_dummy_3: "Synthetic-Dummy-3-Password-42",
      member_dummy_4: "Synthetic-Dummy-4-Password-42",
      member_dummy_5: "Synthetic-Dummy-5-Password-42",
      member_dummy_6: "Synthetic-Dummy-6-Password-42",
      member_dummy_7: "Synthetic-Dummy-7-Password-42",
      member_dummy_8: "Synthetic-Dummy-8-Password-42",
      member_dummy_9: "Synthetic-Dummy-9-Password-42",
      member_dummy_10: "Synthetic-Dummy-10-Password-42",
      member_dummy_11: "Synthetic-Dummy-11-Password-42",
      member_dummy_12: "Synthetic-Dummy-12-Password-42",
      member_dummy_13: "Synthetic-Dummy-13-Password-42",
      member_abdillah: "Synthetic-Abdillah-Password-42",
    });
    const queryInterface = {
      bulkInsert: jest.fn(),
      sequelize: { query: jest.fn() },
    };

    await expect(memberSeeder.up(queryInterface)).rejects.toThrow(/umum/i);
    expect(queryInterface.bulkInsert).not.toHaveBeenCalled();
  });

  test("invalidates accounts that still use legacy default hashes", async () => {
    const transaction = {
      commit: jest.fn().mockResolvedValue(undefined),
      rollback: jest.fn().mockResolvedValue(undefined),
    };
    const queryInterface = {
      sequelize: {
        transaction: jest.fn().mockResolvedValue(transaction),
        query: jest
          .fn()
          .mockResolvedValueOnce([{ id: 11 }])
          .mockResolvedValueOnce([{ id: 22 }])
          .mockResolvedValue([0]),
      },
    };

    await disableDefaults.up(queryInterface);

    expect(queryInterface.sequelize.query).toHaveBeenCalledTimes(7);
    const calls = queryInterface.sequelize.query.mock.calls;
    const passwordUpdates = calls.filter(([sql]) =>
      sql.includes("SET `password`")
    );
    expect(passwordUpdates).toHaveLength(3);
    for (const [sql, options] of passwordUpdates) {
      expect(sql).not.toContain("$2a$10$");
      expect(options.replacements.disabledHash).toBe(
        "$2b$12$synthetic-non-default-hash"
      );
    }
    expect(
      calls.some(([sql, options]) =>
        sql.includes("Auth_sessions") &&
        Array.isArray(options.replacements.userIds)
      )
    ).toBe(true);
    expect(
      calls.some(([sql, options]) =>
        sql.includes("Auth_sessions") &&
        Array.isArray(options.replacements.memberIds)
      )
    ).toBe(true);
    expect(transaction.commit).toHaveBeenCalledTimes(1);
  });
});
