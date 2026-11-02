const express = require("express");
const fs = require("fs");
const os = require("os");
const path = require("path");
const request = require("supertest");

const mockTransaction = {
  LOCK: { UPDATE: "UPDATE" },
  commit: jest.fn(),
  rollback: jest.fn(),
  finished: false,
};

const mockMember = {
  findByPk: jest.fn(),
};
const mockPermohonan = {
  findOne: jest.fn(),
  create: jest.fn(),
};
const mockRealisasiPermohonan = {
  findOne: jest.fn(),
  create: jest.fn(),
};
const mockValidasiSyaratPermohonan = {
  bulkCreate: jest.fn(),
};
const mockKegiatan = {
  findByPk: jest.fn(),
};
const mockBank = {
  findByPk: jest.fn(),
};
const mockSyarat = {};
const mockSyaratKegiatan = {
  findAll: jest.fn(),
};

jest.mock("../models", () => ({
  sequelize: {
    transaction: jest.fn(async () => mockTransaction),
  },
  Member: mockMember,
  Permohonan: mockPermohonan,
  Realisasi_permohonan: mockRealisasiPermohonan,
  Validasi_syarat_permohonan: mockValidasiSyaratPermohonan,
  Kegiatan: mockKegiatan,
  Bank: mockBank,
  Syarat: mockSyarat,
  Syarat_kegiatan: mockSyaratKegiatan,
}));

jest.mock(
  "../modules/permohonan_bantuan_member/controllers/index",
  () => ({
    get_desc: jest.fn((req, res) => res.status(200).json({})),
    get_syarat: jest.fn((req, res) => res.status(200).json({})),
    get_kriteria: jest.fn((req, res) => res.status(200).json({})),
    get_info: jest.fn((req, res) => res.status(200).json({})),
    get_lokasi: jest.fn((req, res) => res.status(200).json({})),
    list_syarat: jest.fn((req, res) => res.status(200).json({})),
    get_info_member: jest.fn((req, res) => res.status(200).json({})),
    list_bank: jest.fn((req, res) => res.status(200).json({})),
    add: jest.fn((req, res) =>
      res.status(200).json({
        uploads: req.permohonanUploads,
        arr_path: req.body.arr_path,
      })
    ),
  })
);

jest.mock("../middleware/authenticateToken", () => ({
  authenticateTokenMember(req, res, next) {
    const memberId = Number(req.get("x-test-member"));
    if (!memberId) {
      return res.status(401).json({ code: "MEMBER_REQUIRED" });
    }
    req.user = { id: memberId, principalType: "member" };
    return next();
  },
  authenticateTokenAdministrator(req, res, next) {
    return next();
  },
}));

const validation = require("../validation/permohonan_member");
const Model_cud = require(
  "../modules/permohonan_bantuan_member/models/model_cud"
);
const router = require("../router/router_permohonan_bantuan_member");
const controllers = require(
  "../modules/permohonan_bantuan_member/controllers/index"
);

function resetTransaction() {
  mockTransaction.finished = false;
  mockTransaction.commit.mockReset();
  mockTransaction.rollback.mockReset();
}

function createUploadApp(directory) {
  const app = express();
  app.post(
    "/upload",
    validation.createPermohonanUploadMiddleware(directory),
    validation.persistUploads,
    (req, res) => {
      res.status(200).json({
        uploads: req.permohonanUploads,
        arr_path: req.body.arr_path,
      });
    }
  );
  return app;
}

function validMemberRequest(overrides = {}) {
  return {
    body: {
      kegiatan_id: 7,
      member_id: 11,
      bank_id: 2,
      nomor_rekening: "0000000000",
      atas_nama: "Fixture Member",
      ...overrides.body,
    },
    user: { id: 11, principalType: "member" },
    permohonanUploads: overrides.permohonanUploads || [],
  };
}

describe("member assistance application security", () => {
  let temporaryRoot;

  beforeEach(() => {
    jest.clearAllMocks();
    resetTransaction();
    mockMember.findByPk.mockResolvedValue({
      id: 11,
      fullname: "Fixture Member",
    });
    mockPermohonan.findOne.mockResolvedValue(null);
    mockPermohonan.create.mockResolvedValue({ id: 30 });
    mockRealisasiPermohonan.create.mockResolvedValue({ id: 40 });
    mockValidasiSyaratPermohonan.bulkCreate.mockResolvedValue([]);
    mockKegiatan.findByPk.mockResolvedValue({
      id: 7,
      nama_kegiatan: "Fixture Kegiatan",
      periode_bantuan: "tahunan",
      status_kegiatan: "sedang_berlangsung",
      tahun: new Date().getFullYear(),
      start_date: null,
      end_date: null,
    });
    mockSyaratKegiatan.findAll.mockResolvedValue([
      { Syarat: { name: "KTP", path: "kartu_tanda_penduduk" } },
    ]);
  });

  afterEach(() => {
    if (temporaryRoot) {
      fs.rmSync(temporaryRoot, { recursive: true, force: true });
      temporaryRoot = undefined;
    }
  });

  test("checks the multipart member ID after parsing", async () => {
    const app = express().use(router);
    const response = await request(app)
      .post("/permohonan_member/add")
      .set("x-test-member", "11")
      .field("kegiatan_id", "7")
      .field("member_id", "22")
      .field("bank_id", "2")
      .field("nomor_rekening", "0000000000")
      .field("atas_nama", "Fixture Member");

    expect(response.status).toBe(403);
    expect(response.body.code).toBe("MEMBER_SCOPE_VIOLATION");
    expect(controllers.add).not.toHaveBeenCalled();
  });

  test("ignores body.arr_path when no server upload exists", async () => {
    const req = validMemberRequest({
      body: {
        arr_path: [
          {
            basename: "ktp",
            path: "../../uploads/img/program_donasi/other-member.pdf",
          },
        ],
      },
    });
    const model = new Model_cud(req);

    await model.add();
    const response = await model.response();

    expect(response).toBe(true);
    expect(mockPermohonan.create).toHaveBeenCalledWith(
      expect.objectContaining({ member_id: 11 }),
      expect.any(Object)
    );
    expect(mockValidasiSyaratPermohonan.bulkCreate).not.toHaveBeenCalled();
  });

  test("rejects a model request whose body targets another member", async () => {
    const model = new Model_cud(
      validMemberRequest({
        body: { member_id: 22 },
      })
    );

    await model.add();
    const response = await model.response();

    expect(response).toBe(false);
    expect(model.statusCode).toBe(403);
    expect(mockPermohonan.create).not.toHaveBeenCalled();
    expect(mockTransaction.rollback).toHaveBeenCalledTimes(1);
  });

  test("ignores a supplied id during the add duplicate check", async () => {
    mockPermohonan.findOne.mockResolvedValue({ id: 99 });

    await expect(
      validation.check_member_can_add_permohonan(11, {
        req: { body: { id: 999 } },
      })
    ).rejects.toThrow("Member sudah mempunyai permohonan");
  });

  test("enforces the duplicate check atomically in the transaction", async () => {
    mockPermohonan.findOne.mockResolvedValue({ id: 99 });
    const model = new Model_cud(validMemberRequest());

    await model.add();
    const response = await model.response();

    expect(response).toBe(false);
    expect(model.statusCode).toBe(409);
    expect(mockMember.findByPk).toHaveBeenCalledWith(
      11,
      expect.objectContaining({
        transaction: mockTransaction,
        lock: mockTransaction.LOCK.UPDATE,
      })
    );
    expect(mockPermohonan.create).not.toHaveBeenCalled();
    expect(mockTransaction.rollback).toHaveBeenCalledTimes(1);
  });

  test.each([
    {
      label: "completed",
      kegiatan: {
        id: 7,
        nama_kegiatan: "Synthetic completed activity",
        periode_bantuan: "tahunan",
        status_kegiatan: "selesai",
        tahun: new Date().getFullYear(),
      },
    },
    {
      label: "previous-year",
      kegiatan: {
        id: 7,
        nama_kegiatan: "Synthetic previous-year activity",
        periode_bantuan: "tahunan",
        status_kegiatan: "sedang_berlangsung",
        tahun: new Date().getFullYear() - 1,
      },
    },
  ])(
    "rejects a $label activity before creating an application",
    async ({ kegiatan }) => {
      mockKegiatan.findByPk.mockResolvedValue(kegiatan);
      const model = new Model_cud(validMemberRequest());

      await model.add();
      const response = await model.response();

      expect(response).toBe(false);
      expect(model.statusCode).toBe(409);
      expect(mockPermohonan.findOne).not.toHaveBeenCalled();
      expect(mockPermohonan.create).not.toHaveBeenCalled();
      expect(mockTransaction.rollback).toHaveBeenCalledTimes(1);
    }
  );

  test.each([
    {
      label: "completed",
      status: "selesai",
      year: new Date().getFullYear(),
    },
    {
      label: "previous-year",
      status: "sedang_berlangsung",
      year: new Date().getFullYear() - 1,
    },
  ])(
    "rejects a $label activity in request validation",
    async ({ status, year }) => {
      mockKegiatan.findByPk.mockResolvedValue({
        id: 7,
        status_kegiatan: status,
        tahun: year,
        start_date: null,
        end_date: null,
      });

      await expect(
        validation.check_id_kegiatan(7)
      ).rejects.toThrow();
    }
  );

  test("aligns duplicate checks with the current eligible activity period", async () => {
    await validation.check_member_can_add_permohonan(11);

    expect(mockPermohonan.findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { member_id: 11 },
        include: [
          expect.objectContaining({
            model: mockKegiatan,
            where: {
              tahun: new Date().getFullYear(),
            },
          }),
        ],
      })
    );
  });

  test("preserves uploads when the commit outcome is unknown", async () => {
    mockTransaction.commit.mockRejectedValueOnce(
      new Error("Synthetic connection loss")
    );
    const model = new Model_cud(validMemberRequest());

    await model.add();
    const response = await model.response();

    expect(response).toBe(false);
    expect(model.transactionOutcome).toBe("commit_unknown");
    expect(model.statusCode).toBe(503);
    expect(model.isUploadCleanupSafe()).toBe(false);
    expect(mockTransaction.rollback).not.toHaveBeenCalled();
  });

  test("rejects HTML content that claims to be a PDF", async () => {
    temporaryRoot = fs.mkdtempSync(
      path.join(os.tmpdir(), "baitulmal-member-upload-")
    );
    const uploadDirectory = path.join(temporaryRoot, "documents");

    const response = await request(createUploadApp(uploadDirectory))
      .post("/upload")
      .field("kegiatan_id", "7")
      .attach("dokumen_ktp", Buffer.from("<html>active</html>"), {
        filename: "identity.pdf",
        contentType: "application/pdf",
      });

    expect(response.status).toBe(400);
    expect(response.body.code).toBe("UPLOAD_REJECTED");
    expect(fs.existsSync(uploadDirectory)).toBe(false);
  });

  test("rejects a content/extension mismatch with a traversal-like name", async () => {
    temporaryRoot = fs.mkdtempSync(
      path.join(os.tmpdir(), "baitulmal-member-upload-")
    );
    const uploadDirectory = path.join(temporaryRoot, "documents");

    const response = await request(createUploadApp(uploadDirectory))
      .post("/upload")
      .field("kegiatan_id", "7")
      .attach("dokumen_ktp", Buffer.from("%PDF-1.7\nfixture"), {
        filename: "../../uploads/img/program_donasi/active.html",
        contentType: "application/pdf",
      });

    expect(response.status).toBe(400);
    expect(response.body.code).toBe("UPLOAD_REJECTED");
    expect(fs.existsSync(uploadDirectory)).toBe(false);
  });

  test("stores only a random server filename inside the document folder", async () => {
    temporaryRoot = fs.mkdtempSync(
      path.join(os.tmpdir(), "baitulmal-member-upload-")
    );
    const uploadDirectory = path.join(temporaryRoot, "documents");

    const response = await request(createUploadApp(uploadDirectory))
      .post("/upload")
      .field("kegiatan_id", "7")
      .field("arr_path", JSON.stringify([{ path: "forged.pdf" }]))
      .attach("dokumen_ktp", Buffer.from("%PDF-1.7\nfixture"), {
        filename: "identity.pdf",
        contentType: "application/pdf",
      });

    expect(response.status).toBe(200);
    expect(response.body.arr_path).toBeUndefined();
    expect(response.body.uploads).toHaveLength(1);

    const stored = response.body.uploads[0];
    expect(stored.file_name).toBe("ktp");
    expect(stored.path).toMatch(/^\d+_[a-f0-9]{36}\.pdf$/);
    expect(stored.path).not.toContain("identity");
    expect(fs.realpathSync(path.join(uploadDirectory, stored.path))).toBe(
      path.join(fs.realpathSync(uploadDirectory), stored.path)
    );
  });

  test("rejects upload fields that do not match the activity requirements", async () => {
    temporaryRoot = fs.mkdtempSync(
      path.join(os.tmpdir(), "baitulmal-member-upload-")
    );
    const uploadDirectory = path.join(temporaryRoot, "documents");

    const response = await request(createUploadApp(uploadDirectory))
      .post("/upload")
      .field("kegiatan_id", "7")
      .attach("dokumen_unrequested", Buffer.from("%PDF-1.7\nfixture"), {
        filename: "unrequested.pdf",
        contentType: "application/pdf",
      });

    expect(response.status).toBe(400);
    expect(response.body.code).toBe("UPLOAD_FAILED");
    expect(
      fs.existsSync(uploadDirectory)
        ? fs.readdirSync(uploadDirectory)
        : []
    ).toEqual([]);
  });
});
