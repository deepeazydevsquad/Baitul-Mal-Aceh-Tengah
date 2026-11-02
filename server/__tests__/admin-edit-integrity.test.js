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
};
const mockPermohonan = {
  findByPk: jest.fn(),
  update: jest.fn(),
};
const mockValidasi = {
  findAll: jest.fn(),
  update: jest.fn(),
  destroy: jest.fn(),
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
    Bank: {},
    Kegiatan: {},
    Realisasi_permohonan: mockRealisasi,
    Permohonan: mockPermohonan,
    Validasi_syarat_permohonan: mockValidasi,
  };
});
jest.mock("../modules/permohonan_bantuan/models/model_r", () =>
  class Model_r {
    async info_kegiatan() {
      return { id: 30, nama_kegiatan: "Fixture Kegiatan", tahun: 2026 };
    }

    async info_member() {
      return { id: 7, fullname: "Fixture Member" };
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
  writeLog: jest.fn(async () => undefined),
}));

const Model_cud = require("../modules/permohonan_bantuan/models/model_cud");

function editRequest(dokumenMap, uploads = []) {
  return {
    body: {
      id: 10,
      member_id: 7,
      kegiatan_id: 30,
      bank_id: 4,
      nomor_rekening: "1234567890",
      atas_nama: "Fixture",
      dokumenMap,
    },
    adminPermohonanUploads: uploads,
  };
}

describe("admin application edit integrity", () => {
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
      id: 10,
      permohonan_id: 20,
    });
    mockPermohonan.findByPk.mockResolvedValue({
      id: 20,
      member_id: 7,
      kegiatan_id: 30,
    });
    mockRealisasi.findByPk.mockResolvedValue({
      id: 10,
      permohonan_id: 20,
    });
    mockPermohonan.update.mockResolvedValue([1]);
    mockValidasi.findAll.mockResolvedValue([
      { id: 15, path: "shared.pdf" },
    ]);
    mockValidasi.update.mockResolvedValue([1]);
    mockValidasi.destroy.mockResolvedValue(1);
    mockQueueCleanup.mockResolvedValue(undefined);
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("queues replacement of a shared document and keeps the other month reference", async () => {
    const aprilRecord = { id: 16, path: "shared.pdf" };
    const model = new Model_cud(
      editRequest(
        {
          dokumen_ktp_meta: {
            id: 15,
            status: "replace",
            file_name: "ktp",
          },
          dokumen_ktp: {
            file: "replacement.pdf",
            file_name: "ktp",
          },
        },
        [{ path: "replacement.pdf", file_name: "ktp" }]
      )
    );

    await model.edit();
    expect(await model.response()).toBe(true);

    expect(mockQueueCleanup).toHaveBeenCalledWith(
      expect.stringContaining("permohonan_bantuan"),
      "shared.pdf",
      "admin-permohonan-document-replaced",
      mockTransaction
    );
    expect(mockPermohonan.update).toHaveBeenCalledWith(
      expect.objectContaining({
        member_id: 7,
        kegiatan_id: 30,
      }),
      expect.anything()
    );
    expect(mockRemoveStoredFile).not.toHaveBeenCalled();
    expect(aprilRecord.path).toBe("shared.pdf");
  });

  test("queues removal of a shared document instead of unlinking it", async () => {
    const model = new Model_cud(
      editRequest({
        dokumen_ktp_meta: {
          id: 15,
          status: "remove",
          file_name: "ktp",
        },
      })
    );

    await model.edit();
    expect(await model.response()).toBe(true);

    expect(mockValidasi.destroy).toHaveBeenCalledWith(
      expect.objectContaining({ transaction: mockTransaction })
    );
    expect(mockQueueCleanup).toHaveBeenCalledWith(
      expect.stringContaining("permohonan_bantuan"),
      "shared.pdf",
      "admin-permohonan-document-removed",
      mockTransaction
    );
    expect(mockRemoveStoredFile).not.toHaveBeenCalled();
  });

  test("rejects a member or activity change before any partial update", async () => {
    const model = new Model_cud(
      editRequest({
        dokumen_ktp_meta: {
          id: 15,
          status: "keep",
          file_name: "ktp",
        },
      })
    );
    model.req.body.member_id = 8;

    await model.edit();
    expect(await model.response()).toBe(false);

    expect(model.statusCode).toBe(409);
    expect(mockPermohonan.update).not.toHaveBeenCalled();
    expect(mockValidasi.update).not.toHaveBeenCalled();
    expect(mockValidasi.destroy).not.toHaveBeenCalled();
  });

  test("retains new upload when commit acknowledgement is lost", async () => {
    mockTransaction.commit.mockImplementationOnce(async () => {
      mockTransaction.finished = "commit";
      throw new Error("synthetic lost commit acknowledgement");
    });
    const model = new Model_cud(
      editRequest(
        {
          dokumen_ktp_meta: {
            id: 15,
            status: "replace",
            file_name: "ktp",
          },
          dokumen_ktp: {
            file: "replacement.pdf",
            file_name: "ktp",
          },
        },
        [{ path: "replacement.pdf", file_name: "ktp" }]
      )
    );

    await model.edit();
    expect(await model.response()).toBe(false);

    expect(model.statusCode).toBe(503);
    expect(mockRemoveStoredFile).not.toHaveBeenCalled();
  });

  test("queues a new upload that is not referenced by the edit", async () => {
    const model = new Model_cud(
      editRequest(
        {
          dokumen_ktp_meta: {
            id: 15,
            status: "keep",
            file_name: "ktp",
          },
        },
        [{ path: "unused.pdf", file_name: "ktp" }]
      )
    );

    await model.edit();
    expect(await model.response()).toBe(true);

    expect(mockQueueCleanup).toHaveBeenCalledWith(
      expect.stringContaining("permohonan_bantuan"),
      "unused.pdf",
      "admin-permohonan-unused-upload",
      mockTransaction
    );
    expect(mockRemoveStoredFile).not.toHaveBeenCalled();
  });
});
