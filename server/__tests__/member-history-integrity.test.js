const mockTransaction = {
  LOCK: { UPDATE: "UPDATE" },
  commit: jest.fn(),
  rollback: jest.fn(),
  finished: undefined,
};

const mockPermohonan = {
  findOne: jest.fn(),
  update: jest.fn(),
  destroy: jest.fn(),
};
const mockRealisasi = {
  findOne: jest.fn(),
};
const mockValidasi = {
  count: jest.fn(),
  findOne: jest.fn(),
};
const mockSurvey = {
  count: jest.fn(),
  findOne: jest.fn(),
};
const mockMonev = {
  count: jest.fn(),
  findOne: jest.fn(),
};

jest.mock("../models", () => ({
  Op: {
    in: jest.fn(),
  },
  sequelize: {
    transaction: jest.fn(async () => mockTransaction),
  },
  Permohonan: mockPermohonan,
  Realisasi_permohonan: mockRealisasi,
  Validasi_syarat_permohonan: mockValidasi,
  Survey_permohonan: mockSurvey,
  Monev: mockMonev,
}));
jest.mock("../helper/writeLogHelper", () => ({
  writeLog: jest.fn(),
}));

const Model_cud = require("../modules/riwayat_permohonan_bantuan/models/model_cud");

function activeParent(overrides = {}) {
  return {
    id: 41,
    member_id: 7,
    status: "sedang_berlangsung",
    ...overrides,
  };
}

function initialRealisasi(overrides = {}) {
  return {
    id: 51,
    status: "process",
    status_realisasi: "belum_direalisasi",
    biaya_disetujui: null,
    ...overrides,
  };
}

function request(id = 41, memberId = 7) {
  return {
    body: { id },
    user: { id: memberId, principalType: "member" },
  };
}

describe("member application history integrity", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockTransaction.finished = undefined;
    mockTransaction.commit.mockImplementation(async () => {
      mockTransaction.finished = "commit";
    });
    mockTransaction.rollback.mockImplementation(async () => {
      mockTransaction.finished = "rollback";
    });
    mockPermohonan.findOne.mockResolvedValue(activeParent());
    mockRealisasi.findOne.mockResolvedValue(initialRealisasi());
    mockValidasi.findOne.mockResolvedValue(null);
    mockSurvey.findOne.mockResolvedValue(null);
    mockMonev.findOne.mockResolvedValue(null);
    mockPermohonan.update.mockResolvedValue([1]);
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("does not reveal or cancel another member's application", async () => {
    mockPermohonan.findOne.mockResolvedValue(null);
    const model = new Model_cud(request(41, 8));

    await model.delete();
    const responded = await model.response();

    expect(responded).toBe(false);
    expect(model.statusCode).toBe(404);
    expect(mockPermohonan.findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 41, member_id: 8 },
        lock: "UPDATE",
      })
    );
    expect(mockPermohonan.update).not.toHaveBeenCalled();
    expect(mockPermohonan.destroy).not.toHaveBeenCalled();
  });

  test.each([
    ["approved", initialRealisasi({ status: "approve", biaya_disetujui: 100 })],
    [
      "realized without survey",
      initialRealisasi({
        status: "approve",
        status_realisasi: "sudah_direalisasi",
        biaya_disetujui: 100,
      }),
    ],
    ["finally rejected", initialRealisasi({ status: "reject_berkas" })],
  ])("preserves a %s application", async (_label, realisasi) => {
    mockRealisasi.findOne.mockResolvedValue(realisasi);
    const model = new Model_cud(request());

    await model.delete();
    const responded = await model.response();

    expect(responded).toBe(false);
    expect(model.statusCode).toBe(409);
    expect(mockPermohonan.update).not.toHaveBeenCalled();
    expect(mockPermohonan.destroy).not.toHaveBeenCalled();
    expect(mockTransaction.rollback).toHaveBeenCalledTimes(1);
  });

  test("keeps surveyed or validated history even when realization is initial", async () => {
    mockSurvey.findOne.mockResolvedValue({ id: 61 });
    mockValidasi.findOne.mockResolvedValue({ id: 62 });
    const model = new Model_cud(request());

    await model.delete();
    const responded = await model.response();

    expect(responded).toBe(false);
    expect(model.statusCode).toBe(409);
    expect(mockPermohonan.update).not.toHaveBeenCalled();
    expect(mockSurvey.findOne).toHaveBeenCalledWith(
      expect.objectContaining({ lock: "UPDATE" })
    );
    expect(mockValidasi.findOne).toHaveBeenCalledWith(
      expect.objectContaining({ lock: "UPDATE" })
    );
  });

  test("cancels an initial application without deleting its row", async () => {
    const model = new Model_cud(request());

    await model.delete();
    const responded = await model.response();

    expect(responded).toBe(true);
    expect(mockPermohonan.findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        transaction: mockTransaction,
        lock: "UPDATE",
      })
    );
    expect(mockPermohonan.update).toHaveBeenCalledWith(
      {
        status: "terhenti",
        alasan_penolakan: "Dibatalkan oleh member.",
      },
      expect.objectContaining({
        where: {
          id: 41,
          member_id: 7,
          status: "sedang_berlangsung",
        },
        transaction: mockTransaction,
      })
    );
    expect(mockPermohonan.destroy).not.toHaveBeenCalled();
  });

  test("returns a conflict if state changes between check and cancel", async () => {
    mockPermohonan.update.mockResolvedValue([0]);
    const model = new Model_cud(request());

    await model.delete();
    const responded = await model.response();

    expect(responded).toBe(false);
    expect(model.statusCode).toBe(409);
    expect(mockTransaction.rollback).toHaveBeenCalledTimes(1);
  });
});
