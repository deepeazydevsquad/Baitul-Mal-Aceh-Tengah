const migration = require(
  "../migrations/20261102160000-enforce-unique-member-nik"
);

describe("member NIK migration", () => {
  test("aborts before creating the unique index when duplicates exist", async () => {
    const queryInterface = {
      sequelize: {
        query: jest.fn().mockResolvedValue([
          { id: 1, nomor_ktp: "1175427237712001" },
          { id: 2, nomor_ktp: "1175-4272-3771-2001" },
        ]),
      },
      addIndex: jest.fn(),
    };

    await expect(migration.up(queryInterface)).rejects.toThrow(
      /NIK duplikat.*1175427237712001.*IDs 1, 2/i
    );
    expect(queryInterface.addIndex).not.toHaveBeenCalled();
  });

  test("normalizes unique NIK values before adding the unique index", async () => {
    const queryInterface = {
      sequelize: {
        query: jest
          .fn()
          .mockResolvedValueOnce([
            { id: 1, nomor_ktp: "1175-4272-3771-2001" },
            { id: 2, nomor_ktp: null },
          ])
          .mockResolvedValue(undefined),
      },
      addIndex: jest.fn().mockResolvedValue(undefined),
    };

    await migration.up(queryInterface);

    expect(queryInterface.sequelize.query).toHaveBeenCalledWith(
      expect.stringContaining("UPDATE `Members`"),
      {
        replacements: {
          nik: "1175427237712001",
          id: 1,
        },
      }
    );
    expect(queryInterface.addIndex).toHaveBeenCalledWith(
      "Members",
      ["nomor_ktp"],
      {
        unique: true,
        name: "members_nomor_ktp_unique",
      }
    );
  });
});
