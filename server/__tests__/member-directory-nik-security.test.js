const mockMember = {
  findByPk: jest.fn(),
  findOne: jest.fn(),
};
const mockNe = Symbol("ne");

jest.mock("../models", () => ({
  Op: {
    ne: mockNe,
  },
  Member: mockMember,
  Kecamatan: { findByPk: jest.fn() },
  Desa: { findByPk: jest.fn() },
}));

const validation = require("../validation/daftar_keanggotaan");

describe("administrator member NIK validation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("rejects a normalized NIK owned by another member", async () => {
    mockMember.findOne.mockResolvedValue({ id: 99 });

    await expect(
      validation.check_nomor_ktp("1175-4272-3771-2001", {
        req: {
          body: {
            id: 8,
            tipeAkun: "perorangan",
          },
        },
      })
    ).rejects.toThrow(/sudah terdaftar/i);

    expect(mockMember.findOne).toHaveBeenCalledWith({
      where: {
        nomor_ktp: "1175427237712001",
        id: { [mockNe]: 8 },
      },
      attributes: ["id"],
    });
  });

  test("does not apply individual NIK uniqueness to an instansi", async () => {
    await expect(
      validation.check_nomor_ktp("not-an-individual-nik", {
        req: {
          body: {
            tipeAkun: "instansi",
          },
        },
      })
    ).resolves.toBe(true);

    expect(mockMember.findOne).not.toHaveBeenCalled();
  });
});
