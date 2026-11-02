const {
  buildMonthlyPeriodKey,
} = require("../helper/monthlyPeriodHelper");
const migration = require("../migrations/20261102180000-enforce-unique-monthly-periods");

describe("monthly period business key", () => {
  test("builds the member-activity-year-month key", () => {
    expect(buildMonthlyPeriodKey(7, 30, 2026, 3)).toBe("7:30:2026:3");
  });

  test.each([
    [0, 30, 2026, 3],
    [7, 0, 2026, 3],
    [7, 30, 1900, 3],
    [7, 30, 2026, 0],
    [7, 30, 2026, 13],
  ])("returns null for an invalid key %#", (...values) => {
    expect(buildMonthlyPeriodKey(...values)).toBeNull();
  });
});

describe("monthly period migration preflight", () => {
  function queryInterface() {
    return {
      sequelize: {
        query: jest.fn(),
      },
      addColumn: jest.fn(),
      addIndex: jest.fn(),
    };
  }

  test("stops before schema changes when duplicate periods exist", async () => {
    const queryInterfaceMock = queryInterface();
    queryInterfaceMock.sequelize.query.mockResolvedValueOnce([
      {
        member_id: 7,
        kegiatan_id: 30,
        tahun: 2026,
        bulan: 3,
        duplicate_count: 2,
      },
    ]);

    await expect(
      migration.up(queryInterfaceMock, {
        STRING: (length) => ({ type: "STRING", length }),
      })
    ).rejects.toThrow(/duplikat/i);

    expect(queryInterfaceMock.addColumn).not.toHaveBeenCalled();
    expect(queryInterfaceMock.addIndex).not.toHaveBeenCalled();
  });

  test("adds the nullable key and unique index when data is clean", async () => {
    const queryInterfaceMock = queryInterface();
    queryInterfaceMock.sequelize.query
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([1]);

    await migration.up(queryInterfaceMock, {
      STRING: (length) => ({ type: "STRING", length }),
    });

    expect(queryInterfaceMock.addColumn).toHaveBeenCalledWith(
      "Realisasi_permohonans",
      "periode_key",
      expect.objectContaining({ allowNull: true })
    );
    expect(queryInterfaceMock.addIndex).toHaveBeenCalledWith(
      "Realisasi_permohonans",
      ["periode_key"],
      expect.objectContaining({
        unique: true,
        name: "realisasi_periode_bulanan_unique",
      })
    );
  });
});
