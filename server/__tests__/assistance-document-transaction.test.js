const mockTransaction = {
  LOCK: { UPDATE: "UPDATE" },
  commit: jest.fn(),
  rollback: jest.fn(),
  finished: undefined,
};

const mockRealisasi = {
  findOne: jest.fn(),
  findByPk: jest.fn(),
  findAll: jest.fn(),
  update: jest.fn(),
};
const mockPermohonan = {
  findByPk: jest.fn(),
  findAll: jest.fn(),
};
const mockQueueCleanup = jest.fn();
const mockRemoveStoredFile = jest.fn();
const mockSendWhatsApp = jest.fn();
const eventOrder = [];

jest.mock("../models", () => ({
  Op: {
    in: jest.fn((values) => values),
  },
  sequelize: {
    transaction: jest.fn(async () => mockTransaction),
  },
  Realisasi_permohonan: mockRealisasi,
  Permohonan: mockPermohonan,
}));
jest.mock("../helper/documentCleanupHelper", () => ({
  queueStoredFileCleanup: mockQueueCleanup,
}));
jest.mock("../helper/uploadStorageHelper", () => {
  const actual = jest.requireActual("../helper/uploadStorageHelper");
  return {
    ...actual,
    resolveStoredPath: (directory, filename) =>
      filename ? `${directory}/${filename}` : null,
    removeStoredFile: mockRemoveStoredFile,
  };
});
jest.mock("../helper/waSenderHelper", () => ({
  sendWhatsApp: mockSendWhatsApp,
}));
jest.mock("../helper/currencyHelper", () => ({
  convertToRP: jest.fn(async (value) => `Rp${value}`),
}));
jest.mock("../helper/writeLogHelper", () => ({
  writeLog: jest.fn(async () => eventOrder.push("log")),
}));
jest.mock("../modules/bakal_penerima_bantuan/models/model_r", () =>
  class Model_r {
    async info_kegiatan() {
      return { id: 10, nama_kegiatan: "Fixture kegiatan" };
    }

    async info_member() {
      return {
        id: 7,
        fullname: "Fixture member",
        whatsapp_number: "620000000000",
      };
    }
  }
);

const Model_cud = require("../modules/bakal_penerima_bantuan/models/model_cud");
const controllers = require("../modules/bakal_penerima_bantuan/controllers");
const uploadValidation = require("../validation/bakal_penerima_bantuan");

function activeParent(overrides = {}) {
  return {
    id: 21,
    member_id: 7,
    kegiatan_id: 10,
    status: "sedang_berlangsung",
    ...overrides,
  };
}

function approvedRealisasi(overrides = {}) {
  return {
    id: 31,
    permohonan_id: 21,
    status: "approve",
    status_realisasi: "belum_direalisasi",
    biaya_disetujui: 100000,
    berita_acara: null,
    bukti_transfer: null,
    mou: null,
    ...overrides,
  };
}

function realisasiRequest(overrides = {}) {
  return {
    body: {
      id: 31,
      tanggal_realisasi: "2026-11-02",
      nominal_realisasi: 50000,
      tipe: "transfer",
      send_wa: true,
      ...overrides,
    },
    buktiRealisasiDocument: { filename: "proof-new.pdf" },
  };
}

function initializeState() {
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
  mockRealisasi.findOne.mockResolvedValue({
    id: 31,
    permohonan_id: 21,
  });
  mockPermohonan.findByPk.mockResolvedValue(activeParent());
  mockPermohonan.findAll.mockResolvedValue([
    { id: 21, status: "sedang_berlangsung" },
  ]);
  mockRealisasi.findByPk.mockResolvedValue(approvedRealisasi());
  mockRealisasi.update.mockResolvedValue([1]);
  mockRealisasi.findAll.mockResolvedValue([]);
  mockQueueCleanup.mockResolvedValue(undefined);
  mockSendWhatsApp.mockImplementation(async () => {
    eventOrder.push("whatsapp");
  });
  jest.spyOn(console, "error").mockImplementation(() => {});
}

describe("shared document cleanup and realisasi transaction outcomes", () => {
  beforeEach(initializeState);
  afterEach(() => jest.restoreAllMocks());

  test("mass upload then replacing one row queues the shared file instead of unlinking it", async () => {
    const massModel = new Model_cud({
      body: { selected_ids: "[31,32]" },
      beritaAcaraDocument: { filename: "shared.pdf" },
    });
    mockRealisasi.findAll
      .mockResolvedValueOnce([
        { id: 31, permohonan_id: 21 },
        { id: 32, permohonan_id: 22 },
      ])
      .mockResolvedValueOnce([{ id: 31 }, { id: 32 }]);
    mockPermohonan.findAll.mockResolvedValueOnce([
      { id: 21, status: "sedang_berlangsung" },
      { id: 22, status: "sedang_berlangsung" },
    ]);
    mockRealisasi.update.mockResolvedValueOnce([2]);

    await massModel.upload_berita_acara_massal();
    expect(await massModel.response()).toBe(true);

    mockTransaction.finished = undefined;
    mockRealisasi.findByPk.mockResolvedValue(
      approvedRealisasi({ berita_acara: "shared.pdf" })
    );
    const replacement = new Model_cud({
      body: { id: 31 },
      beritaAcaraDocument: { filename: "replacement.pdf" },
    });

    await replacement.upload_berita_acara();
    expect(await replacement.response()).toBe(true);

    expect(mockQueueCleanup).toHaveBeenCalledWith(
      expect.stringContaining("berita_acara"),
      "shared.pdf",
      "berita-acara-replaced",
      mockTransaction
    );
    expect(mockRemoveStoredFile).not.toHaveBeenCalledWith(
      expect.anything(),
      "shared.pdf",
      expect.anything()
    );
  });

  test("cancelling one realisasi queues every old document across activities", async () => {
    mockRealisasi.findByPk.mockResolvedValue(
      approvedRealisasi({
        status_realisasi: "sudah_direalisasi",
        berita_acara: "shared-agenda.pdf",
        bukti_transfer: "proof.pdf",
        mou: "mou.pdf",
      })
    );
    const model = new Model_cud({ body: { id: 31 } });

    await model.batal_realisasi();
    expect(await model.response()).toBe(true);

    expect(mockQueueCleanup).toHaveBeenCalledWith(
      expect.stringContaining("bukti_realisasi"),
      "proof.pdf",
      "realisasi-cancelled-proof",
      mockTransaction
    );
    expect(mockQueueCleanup).toHaveBeenCalledWith(
      expect.stringContaining("bukti_realisasi"),
      "mou.pdf",
      "realisasi-cancelled-mou",
      mockTransaction
    );
    expect(mockQueueCleanup).toHaveBeenCalledWith(
      expect.stringContaining("berita_acara"),
      "shared-agenda.pdf",
      "realisasi-cancelled-agenda",
      mockTransaction
    );
    expect(mockRemoveStoredFile).not.toHaveBeenCalled();
  });

  test("notifies only after commit and keeps proof when WhatsApp fails", async () => {
    mockSendWhatsApp.mockImplementation(async () => {
      eventOrder.push("whatsapp");
      throw new Error("synthetic WhatsApp outage");
    });
    const model = new Model_cud(realisasiRequest());

    await model.realisasi_bantuan();
    const responded = await model.response();

    expect(responded).toBe(true);
    expect(eventOrder).toEqual(["log", "commit", "whatsapp"]);
    expect(model.notificationError).toBeInstanceOf(Error);
    expect(mockRealisasi.update).toHaveBeenCalledWith(
      expect.objectContaining({
        bukti_transfer: "proof-new.pdf",
        status_realisasi: "sudah_direalisasi",
      }),
      expect.objectContaining({
        where: {
          id: 31,
          status: "approve",
          status_realisasi: "belum_direalisasi",
        },
      })
    );
    expect(mockRemoveStoredFile).not.toHaveBeenCalled();
  });

  test("keeps a new file when COMMIT was applied but acknowledgement was lost", async () => {
    mockTransaction.commit.mockImplementation(async () => {
      eventOrder.push("commit-applied");
      mockTransaction.finished = "commit";
      throw new Error("synthetic lost commit acknowledgement");
    });
    const model = new Model_cud(realisasiRequest());

    await model.realisasi_bantuan();
    const responded = await model.response();

    expect(responded).toBe(false);
    expect(model.statusCode).toBe(503);
    expect(model.transactionOutcome).toBe("commit_unknown");
    expect(mockTransaction.rollback).not.toHaveBeenCalled();
    expect(mockSendWhatsApp).not.toHaveBeenCalled();
    expect(mockRemoveStoredFile).not.toHaveBeenCalled();
  });

  test("cleans a new file only after rollback is known to succeed", async () => {
    mockRealisasi.update.mockRejectedValueOnce(
      new Error("synthetic update failure")
    );
    const model = new Model_cud(realisasiRequest());

    await model.realisasi_bantuan();
    const responded = await model.response();

    expect(responded).toBe(false);
    expect(model.transactionOutcome).toBe("rolled_back");
    expect(mockTransaction.rollback).toHaveBeenCalledTimes(1);
    expect(mockRemoveStoredFile).toHaveBeenCalledWith(
      expect.stringContaining("bukti_realisasi"),
      "proof-new.pdf",
      expect.anything()
    );
  });

  test("retains a new file when rollback itself is uncertain", async () => {
    mockRealisasi.update.mockRejectedValueOnce(
      new Error("synthetic update failure")
    );
    mockTransaction.rollback.mockImplementationOnce(async () => {
      eventOrder.push("rollback-attempt");
      throw new Error("synthetic lost rollback acknowledgement");
    });
    const model = new Model_cud(realisasiRequest());

    await model.realisasi_bantuan();
    const responded = await model.response();

    expect(responded).toBe(false);
    expect(model.statusCode).toBe(503);
    expect(model.transactionOutcome).toBe("rollback_unknown");
    expect(mockRemoveStoredFile).not.toHaveBeenCalled();
  });

  test("does not open a transaction for preflight validation failure", async () => {
    const model = new Model_cud(realisasiRequest({ tanggal_realisasi: "" }));

    await model.realisasi_bantuan();
    const responded = await model.response();

    expect(responded).toBe(false);
    expect(model.transactionOutcome).toBe("not_started");
    expect(mockRemoveStoredFile).toHaveBeenCalledWith(
      expect.stringContaining("bukti_realisasi"),
      "proof-new.pdf",
      expect.anything()
    );
  });

  test("second stale realisasi request loses the conditional transition", async () => {
    mockRealisasi.update
      .mockResolvedValueOnce([1])
      .mockResolvedValueOnce([0]);
    const first = new Model_cud(realisasiRequest());
    await first.realisasi_bantuan();
    expect(await first.response()).toBe(true);

    mockTransaction.finished = undefined;
    const staleSecond = new Model_cud(realisasiRequest());
    await staleSecond.realisasi_bantuan();
    const responded = await staleSecond.response();

    expect(responded).toBe(false);
    expect(staleSecond.statusCode).toBe(409);
    expect(mockRealisasi.update).toHaveBeenLastCalledWith(
      expect.anything(),
      expect.objectContaining({
        where: {
          id: 31,
          status: "approve",
          status_realisasi: "belum_direalisasi",
        },
      })
    );
  });

  test("controller propagates uncertain commit without deleting the upload", async () => {
    mockTransaction.commit.mockImplementationOnce(async () => {
      mockTransaction.finished = "commit";
      throw new Error("synthetic lost commit acknowledgement");
    });
    const response = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await controllers.realisasi_bantuan(realisasiRequest(), response);

    expect(response.status).toHaveBeenCalledWith(503);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: true,
        code: "COMMIT_OUTCOME_UNKNOWN",
      })
    );
    expect(mockRemoveStoredFile).not.toHaveBeenCalled();
  });

  test("an HTTP error finish event no longer deletes a request upload", async () => {
    const { EventEmitter } = require("node:events");
    const req = {};
    const res = new EventEmitter();
    res.status = jest.fn((code) => {
      res.statusCode = code;
      return res;
    });
    res.json = jest.fn(() => res.emit("finish"));

    await new Promise((resolve) => {
      res.once("finish", resolve);
      uploadValidation.single.upload("untrusted-field")(req, res, resolve);
    });

    expect(res.statusCode).toBe(400);
    expect(mockRemoveStoredFile).not.toHaveBeenCalled();
  });
});
