const mockSequences = {
  transactions: [],
};
const mockParent = {
  findOne: jest.fn(),
  findByPk: jest.fn(),
  update: jest.fn(),
};
const mockRealisasi = {
  findOne: jest.fn(),
  findByPk: jest.fn(),
  findAll: jest.fn(),
  update: jest.fn(),
  create: jest.fn(),
};
const mockValidasi = {
  findOne: jest.fn(),
  findAll: jest.fn(),
  create: jest.fn(),
  count: jest.fn(),
};
const mockSurvey = { findOne: jest.fn() };
const mockMonev = { findOne: jest.fn(), create: jest.fn() };
const mockPertanyaanMonev = {};
const mockJawabanMonev = { bulkCreate: jest.fn() };
const mockKegiatan = { findByPk: jest.fn() };
const mockWriteLog = jest.fn();

jest.mock("../models", () => {
  const { Op } = require("sequelize");
  return {
    Op,
    sequelize: {
      transaction: jest.fn(async () => mockSequences.transactions.shift()),
    },
    Permohonan: mockParent,
    Realisasi_permohonan: mockRealisasi,
    Validasi_syarat_permohonan: mockValidasi,
    Survey_permohonan: mockSurvey,
    Monev: mockMonev,
    Pertanyaan_monev: mockPertanyaanMonev,
    Jawaban_monev: mockJawabanMonev,
    Kegiatan: mockKegiatan,
  };
});
jest.mock("../modules/validasi_permohonan_bantuan/models/model_r", () =>
  class Model_r {
    async info_realisasi() {
      return { permohonan_id: 20 };
    }

    async info_permohonan() {
      return { member_id: 7, kegiatan_id: 30 };
    }

    async info_kegiatan() {
      return { id: 30, nama_kegiatan: "Fixture Kegiatan" };
    }

    async info_member() {
      return {
        id: 7,
        fullname: "Fixture Member",
        whatsapp_number: "620000000000",
      };
    }
  }
);
jest.mock("../helper/writeLogHelper", () => ({
  writeLog: mockWriteLog,
}));
jest.mock("../helper/waSenderHelper", () => ({
  sendWhatsApp: jest.fn(),
}));
jest.mock("../helper/currencyHelper", () => ({
  convertToRP: jest.fn(async () => "Rp0"),
}));
jest.mock("../helper/documentCleanupHelper", () => ({
  queueStoredFileCleanup: jest.fn(),
}));

const ValidationModel = require("../modules/validasi_permohonan_bantuan/models/model_cud");
const HistoryModel = require("../modules/riwayat_permohonan_bantuan/models/model_cud");
const MonevModel = require("../modules/monev/models/model_cud");

function createTransaction() {
  return {
    LOCK: { UPDATE: "UPDATE" },
    finished: undefined,
    commit: jest.fn(async function commit() {
      this.finished = "commit";
    }),
    rollback: jest.fn(async function rollback() {
      this.finished = "rollback";
    }),
  };
}

describe("cancellation and file verification share the parent lock", () => {
  let parent;
  let realisasi;
  let validation;

  beforeEach(() => {
    jest.clearAllMocks();
    parent = {
      id: 20,
      member_id: 7,
      kegiatan_id: 30,
      status: "sedang_berlangsung",
    };
    realisasi = {
      id: 10,
      permohonan_id: 20,
      status: "process",
      status_realisasi: "belum_direalisasi",
      biaya_disetujui: null,
    };
    validation = {
      id: 15,
      file_name: "ktp",
      status: "process",
      update: jest.fn(async (values) => {
        Object.assign(validation, values);
        return validation;
      }),
    };
    mockSequences.transactions = [];
    mockParent.findOne.mockImplementation(async () => parent);
    mockParent.findByPk.mockImplementation(async () => parent);
    mockParent.update.mockImplementation(async (values) => {
      Object.assign(parent, values);
      return [1];
    });
    mockRealisasi.findOne.mockResolvedValue({
      id: 10,
      permohonan_id: 20,
      status: "process",
    });
    mockRealisasi.findByPk.mockImplementation(async () => realisasi);
    mockRealisasi.update.mockResolvedValue([1]);
    mockValidasi.findOne.mockImplementation(async (options) => {
      if (options.where.status) {
        return ["approve", "reject"].includes(validation.status)
          ? { id: validation.id }
          : null;
      }
      return validation;
    });
    mockValidasi.count.mockImplementation(async () =>
      ["approve", "reject"].includes(validation.status) ? 1 : 0
    );
    mockSurvey.findOne.mockResolvedValue(null);
    mockMonev.findOne.mockResolvedValue(null);
    mockMonev.create.mockResolvedValue({ id: 70 });
    mockJawabanMonev.bulkCreate.mockResolvedValue([]);
    mockWriteLog.mockResolvedValue(undefined);
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("approval that wins the parent lock makes the later cancellation fail", async () => {
    const approvalTransaction = createTransaction();
    mockSequences.transactions.push(approvalTransaction);
    const approval = new ValidationModel({
      body: { id: 10, validasi_id: 15 },
    });

    await approval.approve_berkas();
    expect(await approval.response()).toBe(true);
    expect(validation.status).toBe("approve");

    const cancellationTransaction = createTransaction();
    mockSequences.transactions.push(cancellationTransaction);
    const cancellation = new HistoryModel({
      body: { id: 20 },
      user: { id: 7, principalType: "member" },
    });

    await cancellation.delete();
    expect(await cancellation.response()).toBe(false);
    expect(cancellation.statusCode).toBe(409);
    expect(parent.status).toBe("sedang_berlangsung");
    expect(mockParent.update).not.toHaveBeenCalled();
  });

  test("cancellation that wins the parent lock blocks the later file decision", async () => {
    const cancellationTransaction = createTransaction();
    mockSequences.transactions.push(cancellationTransaction);
    const cancellation = new HistoryModel({
      body: { id: 20 },
      user: { id: 7, principalType: "member" },
    });

    await cancellation.delete();
    expect(await cancellation.response()).toBe(true);
    expect(parent.status).toBe("terhenti");

    const approvalTransaction = createTransaction();
    mockSequences.transactions.push(approvalTransaction);
    const approval = new ValidationModel({
      body: { id: 10, validasi_id: 15 },
    });

    await approval.approve_berkas();
    expect(await approval.response()).toBe(false);
    expect(approval.statusCode).toBe(409);
    expect(validation.status).toBe("process");
    expect(validation.update).not.toHaveBeenCalled();
  });

  test("monev creation follows the same parent status lock", async () => {
    parent.status = "terhenti";
    const monevTransaction = createTransaction();
    mockSequences.transactions.push(monevTransaction);
    const monev = new MonevModel({
      body: {
        permohonan_id: 20,
        tipe: "monitoring",
        jenis_monev: "monitoring_konsumtif",
        jawaban: [],
      },
    });

    await monev.kirim_jawaban();
    expect(await monev.response()).toBe(false);

    expect(monev.statusCode).toBe(409);
    expect(mockMonev.create).not.toHaveBeenCalled();
    expect(mockParent.findByPk).toHaveBeenCalledWith(
      20,
      expect.objectContaining({ lock: "UPDATE" })
    );
  });
});
