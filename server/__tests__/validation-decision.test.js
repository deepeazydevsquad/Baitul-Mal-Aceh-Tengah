const { Op } = require("sequelize");

const mockTransaction = {
  LOCK: { UPDATE: "UPDATE" },
  commit: jest.fn(),
  rollback: jest.fn(),
  finished: undefined,
};

const mockRealisasiPermohonan = {
  findOne: jest.fn(),
  findByPk: jest.fn(),
  findAll: jest.fn(),
  update: jest.fn(),
  create: jest.fn(),
};
const mockValidasiSyaratPermohonan = {
  count: jest.fn(),
  findOne: jest.fn(),
  findAll: jest.fn(),
  create: jest.fn(),
};
const mockPermohonan = {
  findByPk: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  destroy: jest.fn(),
};
const mockKegiatan = {
  findByPk: jest.fn(),
};
const mockSendWhatsApp = jest.fn();
const mockWriteLog = jest.fn();
const eventOrder = [];

jest.mock("../models", () => {
  const { Op } = require("sequelize");
  return {
    sequelize: {
      transaction: jest.fn(async () => mockTransaction),
    },
    Realisasi_permohonan: mockRealisasiPermohonan,
    Validasi_syarat_permohonan: mockValidasiSyaratPermohonan,
    Permohonan: mockPermohonan,
    Kegiatan: mockKegiatan,
    Op,
  };
});

jest.mock("../modules/validasi_permohonan_bantuan/models/model_r", () =>
  class Model_r {
    async info_member() {
      return {
        id: 7,
        fullname: "Fixture Member",
        whatsapp_number: "620000000000",
      };
    }
  }
);
jest.mock("../helper/waSenderHelper", () => ({
  sendWhatsApp: mockSendWhatsApp,
}));
jest.mock("../helper/writeLogHelper", () => ({
  writeLog: mockWriteLog,
}));
jest.mock("../helper/currencyHelper", () => ({
  convertToRP: jest.fn(async (value) => `Rp${value}`),
}));
jest.mock("../helper/documentCleanupHelper", () => ({
  queueStoredFileCleanup: jest.fn(),
}));

const Model_cud = require("../modules/validasi_permohonan_bantuan/models/model_cud");

function setTarget({
  status = "process",
  bulan = null,
  periode = "tahunan",
  validations = [
    {
      file_name: "ktp",
      path: "ktp.pdf",
      status: "approve",
    },
  ],
  existingMonths = [],
} = {}) {
  mockRealisasiPermohonan.findOne.mockResolvedValue({
    id: 10,
    permohonan_id: 20,
  });
  mockPermohonan.findByPk.mockResolvedValue({
    id: 20,
    member_id: 7,
    kegiatan_id: 30,
    bank_id: 4,
    nomor_akun_bank: "123",
    nama_akun_bank: "Fixture",
    status: "sedang_berlangsung",
  });
  mockKegiatan.findByPk.mockResolvedValue({
    id: 30,
    nama_kegiatan: "Fixture Kegiatan",
    periode_bantuan: periode,
    tahun: 2026,
  });
  mockRealisasiPermohonan.findByPk.mockResolvedValue({
    id: 10,
    permohonan_id: 20,
    status,
    status_realisasi: "belum_direalisasi",
    bulan,
  });
  mockValidasiSyaratPermohonan.findAll.mockResolvedValue(validations);
  mockRealisasiPermohonan.findAll.mockResolvedValue(
    existingMonths.map((value) => ({ bulan: value }))
  );
}

function approvalRequest(overrides = {}) {
  return {
    body: {
      id: 10,
      biaya_disetujui: 100000,
      send_wa: true,
      catatan: "Fixture",
      ...overrides,
    },
    user: { id: 1, name: "Fixture Admin", jabatan: "Admin" },
  };
}

describe("transactional assistance decisions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    eventOrder.length = 0;
    mockTransaction.finished = undefined;
    mockTransaction.commit.mockImplementation(async () => {
      eventOrder.push("commit");
      mockTransaction.finished = "commit";
    });
    mockTransaction.rollback.mockImplementation(async () => {
      eventOrder.push("rollback");
      mockTransaction.finished = "rollback";
    });
    mockWriteLog.mockImplementation(async () => eventOrder.push("log"));
    mockSendWhatsApp.mockImplementation(async () => {
      eventOrder.push("whatsapp");
    });
    mockRealisasiPermohonan.update.mockResolvedValue([1]);
    mockPermohonan.update.mockResolvedValue([1]);
    mockPermohonan.create.mockImplementation(async (data) => ({
      ...data,
      id: 100 + mockPermohonan.create.mock.calls.length,
    }));
    mockRealisasiPermohonan.create.mockImplementation(async (data) => ({
      ...data,
      id: 200 + mockRealisasiPermohonan.create.mock.calls.length,
    }));
    mockValidasiSyaratPermohonan.create.mockResolvedValue({});
    jest.spyOn(console, "error").mockImplementation(() => {});
    setTarget();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("does not approve or notify twice after a decision exists", async () => {
    setTarget({ status: "approve" });
    const model = new Model_cud(approvalRequest());

    await model.approve_permohonan();
    const response = await model.response();

    expect(response).toBe(false);
    expect(model.statusCode).toBe(409);
    expect(mockRealisasiPermohonan.update).not.toHaveBeenCalled();
    expect(mockSendWhatsApp).not.toHaveBeenCalled();
    expect(mockTransaction.rollback).toHaveBeenCalledTimes(1);
  });

  test("does not reject a request that is already final", async () => {
    setTarget({ status: "reject_berkas" });
    const model = new Model_cud({
      body: {
        id: 10,
        alasan_penolakan: "Fixture",
        send_wa: true,
      },
      user: { id: 1, name: "Fixture Admin", jabatan: "Admin" },
    });

    await model.reject_permohonan();
    const response = await model.response();

    expect(response).toBe(false);
    expect(mockPermohonan.update).not.toHaveBeenCalled();
    expect(mockSendWhatsApp).not.toHaveBeenCalled();
  });

  test("approves a normal request, generates only missing months, then notifies", async () => {
    setTarget({ bulan: 1, periode: "bulanan", existingMonths: [2, 3] });
    const model = new Model_cud(approvalRequest());

    await model.approve_permohonan();
    const response = await model.response();

    expect(response).toBe(true);
    expect(mockRealisasiPermohonan.update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "approve",
        biaya_disetujui: 100000,
      }),
      expect.objectContaining({
        where: { id: 10, status: "process" },
        transaction: mockTransaction,
      })
    );
    expect(mockRealisasiPermohonan.create).toHaveBeenCalledTimes(9);
    const generatedMonths = mockRealisasiPermohonan.create.mock.calls.map(
      ([data]) => data.bulan
    );
    expect(generatedMonths).toEqual([4, 5, 6, 7, 8, 9, 10, 11, 12]);
    expect(eventOrder).toEqual(["log", "commit", "whatsapp"]);
    expect(mockKegiatan.findByPk).toHaveBeenCalledWith(
      30,
      expect.objectContaining({ lock: "UPDATE" })
    );
  });

  test("rejects a normal request and keeps its final history", async () => {
    const model = new Model_cud({
      body: {
        id: 10,
        alasan_penolakan: "Tidak memenuhi syarat",
        send_wa: true,
      },
      user: { id: 1, name: "Fixture Admin", jabatan: "Admin" },
    });

    await model.reject_permohonan();
    const response = await model.response();

    expect(response).toBe(true);
    expect(mockRealisasiPermohonan.update).toHaveBeenCalledWith(
      expect.objectContaining({ status: "reject_berkas" }),
      expect.objectContaining({
        where: {
          id: 10,
          status: { [Op.in]: ["process", "process_lapangan"] },
        },
      })
    );
    expect(mockPermohonan.update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "terhenti",
        alasan_penolakan: "Tidak memenuhi syarat",
      }),
      expect.anything()
    );
    expect(mockPermohonan.destroy).not.toHaveBeenCalled();
    expect(eventOrder).toEqual(["log", "commit", "whatsapp"]);
  });

  test("blocks approval when a file has not been approved", async () => {
    setTarget({
      validations: [
        { file_name: "ktp", path: "ktp.pdf", status: "process" },
      ],
    });
    const model = new Model_cud(approvalRequest());

    await model.approve_permohonan();
    const response = await model.response();

    expect(response).toBe(false);
    expect(model.statusCode).toBe(409);
    expect(mockRealisasiPermohonan.update).not.toHaveBeenCalled();
    expect(mockSendWhatsApp).not.toHaveBeenCalled();
  });

  test("blocks approval when no supporting file exists", async () => {
    setTarget({ validations: [] });
    const model = new Model_cud(approvalRequest());

    await model.approve_permohonan();
    const response = await model.response();

    expect(response).toBe(false);
    expect(model.message).toMatch(/belum ada berkas/i);
    expect(mockRealisasiPermohonan.update).not.toHaveBeenCalled();
  });

  test("does not create any month that already exists in the series", async () => {
    setTarget({
      bulan: 1,
      periode: "bulanan",
      existingMonths: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    });
    const model = new Model_cud(approvalRequest());

    await model.approve_permohonan();
    expect(await model.response()).toBe(true);

    expect(mockRealisasiPermohonan.create).not.toHaveBeenCalled();
    expect(mockPermohonan.create).not.toHaveBeenCalled();
  });

  test("uses current locking reads after waiting so stale snapshots cannot duplicate months", async () => {
    const currentMonths = new Set([1, 2]);
    const staleSnapshotMonths = new Set([1, 2]);
    mockRealisasiPermohonan.findAll.mockImplementation(async (options) => {
      const months =
        options.lock === "UPDATE" ? currentMonths : staleSnapshotMonths;
      return [...months].map((bulan) => ({ bulan }));
    });
    mockRealisasiPermohonan.create.mockImplementation(async (data) => {
      currentMonths.add(Number(data.bulan));
      return { ...data, id: 200 + currentMonths.size };
    });
    mockValidasiSyaratPermohonan.findAll.mockResolvedValue([
      { file_name: "ktp", path: "ktp.pdf", status: "approve" },
    ]);
    setTarget({ bulan: 1, periode: "bulanan" });
    mockRealisasiPermohonan.findAll.mockImplementation(async (options) => {
      const months =
        options.lock === "UPDATE" ? currentMonths : staleSnapshotMonths;
      return [...months].map((bulan) => ({ bulan }));
    });

    const first = new Model_cud(approvalRequest());
    await first.approve_permohonan();
    expect(await first.response()).toBe(true);

    mockTransaction.finished = undefined;
    setTarget({ bulan: 2, periode: "bulanan" });
    mockRealisasiPermohonan.findAll.mockImplementation(async (options) => {
      const months =
        options.lock === "UPDATE" ? currentMonths : staleSnapshotMonths;
      return [...months].map((bulan) => ({ bulan }));
    });
    const second = new Model_cud(approvalRequest());
    await second.approve_permohonan();
    expect(await second.response()).toBe(true);

    const generatedMonths = mockRealisasiPermohonan.create.mock.calls.map(
      ([data]) => data.bulan
    );
    expect(generatedMonths).toHaveLength(10);
    expect(new Set(generatedMonths).size).toBe(10);
    const generatedKeys = mockRealisasiPermohonan.create.mock.calls.map(
      ([data]) => data.periode_key
    );
    expect(new Set(generatedKeys).size).toBe(10);
    expect(mockRealisasiPermohonan.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ lock: "UPDATE" })
    );
    expect(mockValidasiSyaratPermohonan.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ lock: "UPDATE" })
    );
  });

  test("reads current file statuses after the parent locks are acquired", async () => {
    mockValidasiSyaratPermohonan.findAll.mockImplementation(async (options) =>
      options.lock === "UPDATE"
        ? [{ file_name: "ktp", path: "ktp.pdf", status: "approve" }]
        : [{ file_name: "ktp", path: "ktp.pdf", status: "process" }]
    );
    const model = new Model_cud(approvalRequest());

    await model.approve_permohonan();
    expect(await model.response()).toBe(true);

    expect(mockValidasiSyaratPermohonan.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ lock: "UPDATE" })
    );
    expect(mockRealisasiPermohonan.update).toHaveBeenCalledTimes(1);
  });

  test("does not approve or reject a file after its parent was cancelled", async () => {
    mockPermohonan.findByPk.mockResolvedValue({
      id: 20,
      member_id: 7,
      kegiatan_id: 30,
      status: "terhenti",
    });
    const dataValidasi = {
      id: 15,
      file_name: "ktp",
      status: "process",
      update: jest.fn(),
    };
    mockValidasiSyaratPermohonan.findOne.mockResolvedValue(dataValidasi);

    for (const action of ["approve_berkas", "reject_berkas"]) {
      mockTransaction.finished = undefined;
      const model = new Model_cud({
        body: {
          id: 10,
          validasi_id: 15,
          alasan_penolakan: "Fixture",
        },
      });

      await model[action]();
      expect(await model.response()).toBe(false);
      expect(model.statusCode).toBe(409);
    }

    expect(dataValidasi.update).not.toHaveBeenCalled();
    expect(mockPermohonan.findByPk).toHaveBeenCalledWith(
      20,
      expect.objectContaining({ lock: "UPDATE" })
    );
  });

  test("rechecks file status inside the locked transaction", async () => {
    const dataValidasi = {
      id: 15,
      file_name: "ktp",
      status: "approve",
      update: jest.fn(),
    };
    mockValidasiSyaratPermohonan.findOne.mockResolvedValue(dataValidasi);
    const model = new Model_cud({
      body: { id: 10, validasi_id: 15 },
    });

    await model.approve_berkas();
    expect(await model.response()).toBe(false);

    expect(model.statusCode).toBe(409);
    expect(dataValidasi.update).not.toHaveBeenCalled();
    expect(mockValidasiSyaratPermohonan.findOne).toHaveBeenCalledWith(
      expect.objectContaining({ lock: "UPDATE" })
    );
  });

  test("keeps the decision committed when WhatsApp delivery fails", async () => {
    mockSendWhatsApp.mockImplementationOnce(async () => {
      eventOrder.push("whatsapp");
      throw new Error("synthetic WhatsApp outage");
    });
    const model = new Model_cud(approvalRequest());

    await model.approve_permohonan();
    const response = await model.response();

    expect(response).toBe(true);
    expect(mockTransaction.rollback).not.toHaveBeenCalled();
    expect(model.notificationError).toBeInstanceOf(Error);
    expect(eventOrder).toEqual(["log", "commit", "whatsapp"]);
  });

  test("does not notify or report success when decision commit is uncertain", async () => {
    mockTransaction.commit.mockImplementationOnce(async () => {
      mockTransaction.finished = "commit";
      throw new Error("synthetic lost commit acknowledgement");
    });
    const model = new Model_cud(approvalRequest());

    await model.approve_permohonan();
    const response = await model.response();

    expect(response).toBe(false);
    expect(model.statusCode).toBe(503);
    expect(model.transactionOutcome).toBe("commit_unknown");
    expect(mockSendWhatsApp).not.toHaveBeenCalled();
  });
});

