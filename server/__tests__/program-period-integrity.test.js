const mockTransaction = {
  LOCK: { UPDATE: "UPDATE" },
  commit: jest.fn(),
  rollback: jest.fn(),
  finished: undefined,
};
const mockKegiatan = {
  findByPk: jest.fn(),
  update: jest.fn(),
  create: jest.fn(),
};
const mockRealisasi = {
  findOne: jest.fn(),
};
const mockRemoveBanner = jest.fn();

jest.mock("../models", () => {
  const { Op } = require("sequelize");
  return {
    sequelize: {
      transaction: jest.fn(async () => mockTransaction),
    },
    Op,
    Kegiatan: mockKegiatan,
    Realisasi_permohonan: mockRealisasi,
    Permohonan: {},
    Desa_area_kegiatan: {},
    Kecamatan_area_kegiatan: {},
    Asnaf: {},
    Program: {},
  };
});
jest.mock("../modules/program_kegiatan_bantuan/models/model_r", () =>
  class Model_r {
    async info_program_kegiatan_bantuan() {
      return {
        id: 30,
        tahun: 2026,
        banner: null,
        status_kegiatan: "sedang_berlangsung",
      };
    }
  }
);
jest.mock("../helper/uploadStorageHelper", () => ({
  resolveStoredPath: () => null,
  removeStoredFile: mockRemoveBanner,
}));
jest.mock("../helper/writeLogHelper", () => ({
  writeLog: jest.fn(),
}));

const Model_cud = require("../modules/program_kegiatan_bantuan/models/model_cud");

describe("activity year integrity", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockTransaction.finished = undefined;
    mockTransaction.commit.mockImplementation(async () => {
      mockTransaction.finished = "commit";
    });
    mockTransaction.rollback.mockImplementation(async () => {
      mockTransaction.finished = "rollback";
    });
    mockKegiatan.findByPk.mockResolvedValue({
      id: 30,
      tahun: 2026,
    });
    mockRealisasi.findOne.mockResolvedValue({ id: 10 });
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("rejects changing the year of an activity that already has realisasi", async () => {
    const model = new Model_cud({
      body: {
        id: 30,
        tahun: 2027,
        nama_kegiatan: "Fixture",
        sumber_dana: "zakat",
        asnaf_id: 1,
        program_id: 1,
        jumlah_dana: 1000000,
        jumlah_maksimal_nominal_bantuan: 100000,
        jumlah_target_penerima: 10,
        status_tampil: "true",
        area_penyaluran: "kabupaten",
        jenis_penyaluran: "langsung",
        start_date: "2027-01-01",
        end_date: "2027-12-31",
        name: "Fixture",
        desc: "Fixture",
      },
    });

    await model.edit();
    expect(await model.response()).toBe(false);

    expect(model.statusCode).toBe(409);
    expect(mockKegiatan.update).not.toHaveBeenCalled();
    expect(mockRealisasi.findOne).toHaveBeenCalledWith(
      expect.objectContaining({ lock: "UPDATE" })
    );
  });
});
