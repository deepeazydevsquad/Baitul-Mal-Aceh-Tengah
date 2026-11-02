const mockTransaction = {
  LOCK: { UPDATE: "UPDATE" },
  commit: jest.fn(),
  rollback: jest.fn(),
  finished: undefined,
};
const mockRealisasi = {
  findOne: jest.fn(),
  findByPk: jest.fn(),
};
const mockPermohonan = {
  findByPk: jest.fn(),
};
const mockValidasi = {
  findOne: jest.fn(),
};
const mockQueueCleanup = jest.fn();
const mockRemoveStoredFile = jest.fn();

jest.mock("../models", () => {
  const { Op } = require("sequelize");
  return {
    Op,
    sequelize: {
      transaction: jest.fn(async () => mockTransaction),
    },
    Realisasi_permohonan: mockRealisasi,
    Validasi_syarat_permohonan: mockValidasi,
    Permohonan: mockPermohonan,
    Kegiatan: {},
  };
});
jest.mock("../modules/validasi_permohonan_bantuan/models/model_r", () =>
  class Model_r {
    async info_realisasi() {
      return { permohonan_id: 20 };
    }

    async info_permohonan() {
      return { member_id: 7 };
    }

    async info_member() {
      return { fullname: "Fixture Member" };
    }
  }
);
jest.mock("../helper/documentCleanupHelper", () => ({
  queueStoredFileCleanup: mockQueueCleanup,
}));
jest.mock("../helper/uploadStorageHelper", () => ({
  resolveStoredPath: (directory, filename) =>
    filename ? `${directory}/${filename}` : null,
  removeStoredFile: mockRemoveStoredFile,
}));
jest.mock("../helper/writeLogHelper", () => ({
  writeLog: jest.fn(),
}));
jest.mock("../helper/waSenderHelper", () => ({
  sendWhatsApp: jest.fn(),
}));
jest.mock("../helper/currencyHelper", () => ({
  convertToRP: jest.fn(async () => "Rp0"),
}));

const Model_cud = require("../modules/validasi_permohonan_bantuan/models/model_cud");

function request() {
  return {
    body: { id: 10, validasi_id: 15 },
    validationReplacementUpload: {
      filename: "replacement.pdf",
      file_name: "ktp",
    },
  };
}

describe("validation document reference integrity", () => {
  let currentValidation;

  beforeEach(() => {
    jest.clearAllMocks();
    mockTransaction.finished = undefined;
    mockTransaction.commit.mockImplementation(async () => {
      mockTransaction.finished = "commit";
    });
    mockTransaction.rollback.mockImplementation(async () => {
      mockTransaction.finished = "rollback";
    });
    mockRealisasi.findOne.mockResolvedValue({
      permohonan_id: 20,
    });
    mockPermohonan.findByPk.mockResolvedValue({
      id: 20,
      status: "sedang_berlangsung",
    });
    mockRealisasi.findByPk.mockResolvedValue({
      id: 10,
      permohonan_id: 20,
      status: "process",
    });
    currentValidation = {
      id: 15,
      path: "shared.pdf",
      update: jest.fn(async () => ({ id: 15 })),
    };
    mockValidasi.findOne.mockResolvedValue(currentValidation);
    mockQueueCleanup.mockResolvedValue(undefined);
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("queues a shared old validation file without unlinking it after commit", async () => {
    const model = new Model_cud(request());

    await model.edit_file();
    expect(await model.response()).toBe(true);

    expect(mockQueueCleanup).toHaveBeenCalledWith(
      expect.stringContaining("permohonan_bantuan"),
      "shared.pdf",
      "validation-document-replaced",
      mockTransaction
    );
    expect(currentValidation.update).toHaveBeenCalledWith(
      expect.objectContaining({
        path: "replacement.pdf",
        status: "process",
      }),
      { transaction: mockTransaction }
    );
    expect(mockRemoveStoredFile).not.toHaveBeenCalled();
  });

  test("retains replacement when commit acknowledgement is lost", async () => {
    mockTransaction.commit.mockImplementationOnce(async () => {
      mockTransaction.finished = "commit";
      throw new Error("synthetic lost commit acknowledgement");
    });
    const model = new Model_cud(request());

    await model.edit_file();
    expect(await model.response()).toBe(false);

    expect(model.statusCode).toBe(503);
    expect(model.transactionOutcome).toBe("commit_unknown");
    expect(mockRemoveStoredFile).not.toHaveBeenCalled();
  });

  test("removes replacement only after a known rollback", async () => {
    currentValidation.update.mockRejectedValueOnce(
      new Error("synthetic update failure")
    );
    const model = new Model_cud(request());

    await model.edit_file();
    expect(await model.response()).toBe(false);

    expect(model.transactionOutcome).toBe("rolled_back");
    expect(mockRemoveStoredFile).toHaveBeenCalledWith(
      expect.stringContaining("permohonan_bantuan"),
      "replacement.pdf",
      expect.anything()
    );
  });

  test("retains replacement when rollback acknowledgement is lost", async () => {
    currentValidation.update.mockRejectedValueOnce(
      new Error("synthetic update failure")
    );
    mockTransaction.rollback.mockImplementationOnce(async () => {
      throw new Error("synthetic lost rollback acknowledgement");
    });
    const model = new Model_cud(request());

    await model.edit_file();
    expect(await model.response()).toBe(false);

    expect(model.statusCode).toBe(503);
    expect(model.transactionOutcome).toBe("rollback_unknown");
    expect(mockRemoveStoredFile).not.toHaveBeenCalled();
  });
});
