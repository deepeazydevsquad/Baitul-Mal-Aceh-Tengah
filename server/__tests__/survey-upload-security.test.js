const fs = require("fs");
const os = require("os");
const path = require("path");
const express = require("express");
const request = require("supertest");
const { body, validationResult } = require("express-validator");

const mockTransaction = {
  LOCK: { UPDATE: "UPDATE" },
  commit: jest.fn(),
  rollback: jest.fn(),
  finished: undefined,
};
const mockPermohonan = {
  findOne: jest.fn(),
  findByPk: jest.fn(),
};
const mockSurveyPermohonan = {
  create: jest.fn(),
  findOne: jest.fn(),
};
const mockSurveyorKegiatan = {
  findOne: jest.fn(),
};
const mockMember = {
  findOne: jest.fn(),
};
const mockRealisasiPermohonan = {
  findOne: jest.fn(),
};
const mockRemoveUploadedFiles = jest.fn();
const mockInfoSurveyKegiatan = jest.fn();

jest.mock("../models", () => ({
  sequelize: {
    transaction: jest.fn(async () => mockTransaction),
  },
  Permohonan: mockPermohonan,
  Survey_permohonan: mockSurveyPermohonan,
  Surveyor_kegiatan: mockSurveyorKegiatan,
  Member: mockMember,
  Realisasi_permohonan: mockRealisasiPermohonan,
}));

jest.mock(
  "../modules/survey_lapangan/models/model_r",
  () =>
    class Model_r {
      constructor() {
        this.info_survey_kegiatan = mockInfoSurveyKegiatan;
      }
    }
);

jest.mock("../helper/uploadedFileHelper", () => {
  const actual = jest.requireActual("../helper/uploadedFileHelper");
  return {
    ...actual,
    removeUploadedFiles: mockRemoveUploadedFiles,
  };
});

const {
  collectSurveyUploads,
  cleanupRequestUploads,
  removeUploadedFiles,
  resolveSafeUploadPath,
} = require("../helper/uploadedFileHelper");
const {
  removeUntrustedUploadMetadata,
} = require("../validation/survey_lapangan");
const validation = require("../validation/survey_lapangan");
const validationHelper = require("../helper/handleErrorFile");

const SYNTHETIC_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAADUlEQVQImWNgYGBgAAAABQABh6FO1AAAAABJRU5ErkJggg==",
  "base64"
);
const Model_cud = require("../modules/survey_lapangan/models/model_cud");
const controllers = require("../modules/survey_lapangan/controllers/index");
const surveyRouter = require("../router/router_survey_lapangan");
const surveyApp = express();
surveyApp.use(require("cookie-parser")());
surveyApp.use(surveyRouter);
const {
  createCapabilityToken,
} = require("../helper/surveyCapabilityHelper");

function writeFile(filePath, contents = "synthetic") {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, contents);
}

function validSurveyBody(extra = {}) {
  return {
    member_id: 20,
    status: "approve",
    kesimpulan: "Fixture",
    tanggal_penilaian: "2026-11-02",
    nomor_ktp: "1234567890123456",
    tempat_lahir: "Fixture",
    tanggal_lahir: "1990-01-01",
    nama_suami_istri: "Fixture",
    pekerjaan_suami_istri: "Fixture",
    jumlah_tanggungan: 1,
    alamat: "Fixture",
    jenis_kelamin: "perempuan",
    status_pernikahan: "kawin",
    usia_25_60: "iya",
    penduduk_tetap: "iya",
    penghasilan_kepala_keluarga: "tidak",
    kondisi_fisik: "baik",
    atap: "layak",
    rangka_rumah: "layak",
    dinding_rumah: "layak",
    lantai: "layak",
    mck: "layak",
    luas_rumah: "kecil",
    aset: "tidak ada",
    kendaraan: "tidak ada",
    keterangan_kondisi_calon: "Fixture",
    keterangan_pilih_mustahik: "Fixture",
    ...extra,
  };
}

function surveyFile(fieldname, filename, directory) {
  return {
    fieldname,
    filename,
    path: path.resolve(directory, filename),
  };
}

function createMultipartMetadataApp(isolatedUploadDirectory) {
  const app = express();
  const uploadMiddleware = validation.createSurveyUploadMiddleware(
    isolatedUploadDirectory
  );
  app.post(
    "/multipart-metadata",
    (req, res, next) => {
      req.surveyUploadPath = isolatedUploadDirectory;
      next();
    },
    uploadMiddleware,
    removeUntrustedUploadMetadata,
    (req, res) => {
      const uploads = collectSurveyUploads(
        req.files,
        isolatedUploadDirectory
      );
      res.status(200).json({
        body_uploaded_files: req.body.uploaded_files || null,
        form_survey: uploads.form_survey,
      });
    }
  );
  return app;
}

describe("survey upload metadata and cleanup", () => {
  let temporaryRoot;
  let uploadDirectory;

  beforeEach(() => {
    temporaryRoot = fs.mkdtempSync(
      path.join(os.tmpdir(), "baitulmal-survey-upload-")
    );
    uploadDirectory = path.join(temporaryRoot, "survey_lapangan");
    fs.mkdirSync(uploadDirectory, { recursive: true });
  });

  afterEach(() => {
    const resolvedTemporaryRoot = path.resolve(temporaryRoot);
    const resolvedTempBase = path.resolve(os.tmpdir());
    if (
      resolvedTemporaryRoot.startsWith(`${resolvedTempBase}${path.sep}`) &&
      path.basename(resolvedTemporaryRoot).startsWith(
        "baitulmal-survey-upload-"
      )
    ) {
      fs.rmSync(resolvedTemporaryRoot, { recursive: true, force: true });
    }
  });

  test("removes only valid files from the current request", () => {
    const newFile = surveyFile(
      "form_survey",
      "form_survey_server.png",
      uploadDirectory
    );
    const existingFile = path.join(uploadDirectory, "existing_old.png");
    writeFile(newFile.path);
    writeFile(existingFile);

    const result = cleanupRequestUploads(
      {
        files: { form_survey: [newFile] },
        body: {
          uploaded_files: {
            form_survey: "existing_old.png",
          },
        },
      },
      uploadDirectory
    );

    expect(result.removed).toBe(1);
    expect(fs.existsSync(newFile.path)).toBe(false);
    expect(fs.existsSync(existingFile)).toBe(true);
  });

  test("retains safe cleanup for other Multer upload helpers", () => {
    const otherUploadDirectory = path.join(temporaryRoot, "other_upload");
    const genericFile = {
      fieldname: "berkas",
      filename: "server_generated.pdf",
      destination: otherUploadDirectory,
      path: path.join(otherUploadDirectory, "server_generated.pdf"),
    };
    writeFile(genericFile.path);

    const result = cleanupRequestUploads({ file: genericFile });

    expect(result.removed).toBe(1);
    expect(fs.existsSync(genericFile.path)).toBe(false);
  });

  test.each([
    "../outside.txt",
    "..\\outside.txt",
    "/absolute-outside.txt",
    "survey_lapangan_evil/outside.txt",
  ])("rejects traversal-like filename %s", (filename) => {
    const outside = path.join(temporaryRoot, "outside.txt");
    writeFile(outside);
    const fake = {
      fieldname: "form_survey",
      filename,
      path: outside,
    };

    removeUploadedFiles({ form_survey: [fake] }, uploadDirectory);

    expect(resolveSafeUploadPath(uploadDirectory, filename)).toBeNull();
    expect(fs.existsSync(outside)).toBe(true);
  });

  test("rejects a target in a directory with a similar prefix", () => {
    const siblingDirectory = `${uploadDirectory}_evil`;
    const target = path.join(siblingDirectory, "outside.txt");
    writeFile(target);

    const result = cleanupRequestUploads(
      {
        files: {
          form_survey: [
            {
              fieldname: "form_survey",
              filename: "outside.txt",
              path: target,
            },
          ],
        },
      },
      uploadDirectory
    );

    expect(result.skipped).toBe(1);
    expect(fs.existsSync(target)).toBe(true);
  });

  test("rejects a symlink whose canonical target escapes the upload folder", () => {
    const outside = path.join(temporaryRoot, "symlink-target.txt");
    const link = path.join(uploadDirectory, "symlink.png");
    writeFile(outside);

    try {
      fs.symlinkSync(outside, link, "file");
    } catch (error) {
      if (["EPERM", "EACCES", "ENOSYS"].includes(error.code)) {
        return;
      }
      throw error;
    }

    expect(resolveSafeUploadPath(uploadDirectory, "symlink.png")).toBeNull();
    removeUploadedFiles(
      {
        form_survey: [
          surveyFile("form_survey", "symlink.png", uploadDirectory),
        ],
      },
      uploadDirectory
    );
    expect(fs.existsSync(outside)).toBe(true);
  });

  test("derives metadata only from server-controlled request files", () => {
    const form = surveyFile(
      "form_survey",
      "form_survey_server.png",
      uploadDirectory
    );
    const agenda = surveyFile(
      "berita_acara",
      "berita_acara_server.png",
      uploadDirectory
    );
    const documentation = surveyFile(
      "dokumentasi",
      "dokumentasi_server.png",
      uploadDirectory
    );

    const uploads = collectSurveyUploads(
      { form_survey: [form], berita_acara: [agenda], dokumentasi: [documentation] },
      uploadDirectory
    );

    expect(uploads.valid).toBe(true);
    expect(uploads.form_survey).toBe("form_survey_server.png");
    expect(uploads.berita_acara).toBe("berita_acara_server.png");
    expect(uploads.dokumentasi).toEqual(["dokumentasi_server.png"]);
  });

  test("removes internal upload metadata supplied through the body", () => {
    const req = {
      body: {
        uploaded_files: {
          form_survey: "../../outside.png",
        },
        access_code: "synthetic",
      },
    };
    const next = jest.fn();

    removeUntrustedUploadMetadata(req, {}, next);

    expect(req.body.uploaded_files).toBeUndefined();
    expect(req.body.access_code).toBeUndefined();
    expect(next).toHaveBeenCalledTimes(1);
  });

  test("cleans request files when later validation fails", async () => {
    const app = express();
    const uploadMiddleware = validation.createSurveyUploadMiddleware(
      uploadDirectory
    );
    app.post(
      "/upload",
      (req, res, next) => {
        req.surveyUploadPath = uploadDirectory;
        next();
      },
      uploadMiddleware,
      removeUntrustedUploadMetadata,
      body("access_code").notEmpty(),
      validationHelper.handleFileErrors,
      (req, res) => {
        const errors = validationResult(req);
        res.status(errors.isEmpty() ? 200 : 400).json({
          error: !errors.isEmpty(),
        });
      }
    );
    const response = await request(app)
      .post("/upload")
      .attach("form_survey", SYNTHETIC_PNG, {
        filename: "fixture.png",
        contentType: "image/png",
      });

    expect(response.status).toBe(400);
    expect(fs.readdirSync(uploadDirectory)).toEqual([]);
  });

  test.each(["before", "after"])(
    "ignores an uploaded_files multipart field placed %s the file",
    async (position) => {
      const app = createMultipartMetadataApp(uploadDirectory);
      let multipart = request(app).post("/multipart-metadata");
      if (position === "before") {
        multipart = multipart.field(
          "uploaded_files",
          JSON.stringify({
            form_survey: "../../SIMULATED_TARGET.txt",
          })
        );
      }
      multipart = multipart.attach(
        "form_survey",
        SYNTHETIC_PNG,
        {
          filename: "fixture.png",
          contentType: "image/png",
        }
      );
      if (position === "after") {
        multipart = multipart.field(
          "uploaded_files",
          JSON.stringify({
            form_survey: "../../SIMULATED_TARGET.txt",
          })
        );
      }

      const response = await multipart;
      expect(response.status).toBe(200);
      expect(response.body.body_uploaded_files).toBeNull();
      expect(response.body.form_survey).toMatch(
        /^form_survey_\d+_[a-f0-9]+\.png$/
      );
      expect(fs.readdirSync(uploadDirectory)).toEqual([
        response.body.form_survey,
      ]);
    }
  );
});

describe("survey transaction ownership", () => {
  const uploadDirectory = path.resolve(
    __dirname,
    "../uploads/dokumen/survey_lapangan"
  );

  beforeEach(() => {
    jest.clearAllMocks();
    mockTransaction.finished = undefined;
    mockTransaction.commit.mockImplementation(async () => {
      if (mockTransaction.finished) {
        throw new Error(
          `Transaction cannot be committed because it has been finished with state: ${mockTransaction.finished}`
        );
      }
      mockTransaction.finished = "commit";
    });
    mockTransaction.rollback.mockImplementation(async () => {
      if (mockTransaction.finished) {
        throw new Error(
          `Transaction cannot be rolled back because it has been finished with state: ${mockTransaction.finished}`
        );
      }
      mockTransaction.finished = "rollback";
    });
    mockInfoSurveyKegiatan.mockResolvedValue({
      id: 5,
      kegiatan_id: 6,
    });
    mockPermohonan.findOne.mockResolvedValue({
      id: 7,
      member_id: 20,
      kegiatan_id: 6,
    });
    mockPermohonan.findByPk.mockResolvedValue({
      id: 7,
      member_id: 20,
      kegiatan_id: 6,
      status: "sedang_berlangsung",
    });
    mockRealisasiPermohonan.findOne.mockResolvedValue({
      id: 8,
      status: "process_lapangan",
    });
    mockSurveyPermohonan.findOne.mockResolvedValue(null);
  });

  test("ignores body metadata and cleans only new request files after a database failure", async () => {
    const form = surveyFile(
      "form_survey",
      "form_survey_server.png",
      uploadDirectory
    );
    mockSurveyPermohonan.create.mockRejectedValueOnce(
      new Error("synthetic database failure")
    );
    const model = new Model_cud({
      body: validSurveyBody({
        uploaded_files: {
          form_survey: "../../SIMULATED_TARGET.txt",
          dokumentasi: ["../../SIMULATED_TARGET.txt"],
        },
      }),
      files: { form_survey: [form] },
      surveyCapability: { id: 5, kegiatan_id: 6 },
    });

    const submitted = await model.submit();
    const responded = await model.response();

    expect(submitted).toBe(false);
    expect(responded).toBe(false);
    expect(mockTransaction.rollback).toHaveBeenCalledTimes(1);
    expect(mockRemoveUploadedFiles).toHaveBeenCalledTimes(1);
    expect(mockRemoveUploadedFiles).toHaveBeenCalledWith(
      { form_survey: [form] },
      model.uploadDirectory
    );
    expect(mockSurveyPermohonan.create).toHaveBeenCalledTimes(1);
  });

  test("stores only filenames provided by Multer after a successful insert", async () => {
    const form = surveyFile(
      "form_survey",
      "form_survey_server.png",
      uploadDirectory
    );
    const agenda = surveyFile(
      "berita_acara",
      "berita_acara_server.png",
      uploadDirectory
    );
    const documentation = surveyFile(
      "dokumentasi",
      "dokumentasi_server.png",
      uploadDirectory
    );
    mockSurveyPermohonan.create.mockResolvedValueOnce({ id: 8 });
    const model = new Model_cud({
      body: validSurveyBody({
        uploaded_files: {
          form_survey: "../../SIMULATED_TARGET.txt",
          berita_acara: "/absolute.png",
          dokumentasi: ["../../SIMULATED_TARGET.txt"],
        },
      }),
      files: {
        form_survey: [form],
        berita_acara: [agenda],
        dokumentasi: [documentation],
      },
      surveyCapability: { id: 5, kegiatan_id: 6 },
    });

    expect(await model.submit()).toBe(true);
    expect(await model.response()).toBe(true);

    const saved = mockSurveyPermohonan.create.mock.calls[0][0];
    expect(saved.form_survey).toBe("form_survey_server.png");
    expect(saved.berita_acara).toBe("berita_acara_server.png");
    expect(JSON.parse(saved.dokumentasi)).toEqual([
      "dokumentasi_server.png",
    ]);
    expect(mockTransaction.commit).toHaveBeenCalledTimes(1);
    expect(mockTransaction.rollback).not.toHaveBeenCalled();
    expect(mockRemoveUploadedFiles).not.toHaveBeenCalled();
  });

  test("preserves files when rollback before commit is also uncertain", async () => {
    const form = surveyFile(
      "form_survey",
      "form_survey_server.png",
      uploadDirectory
    );
    mockSurveyPermohonan.create.mockRejectedValueOnce(
      new Error("synthetic insert failure")
    );
    mockTransaction.rollback.mockImplementationOnce(async () => {
      mockTransaction.finished = "rollback";
      throw new Error("synthetic uncertain rollback");
    });
    const model = new Model_cud({
      body: validSurveyBody(),
      files: { form_survey: [form] },
      surveyCapability: { id: 5, kegiatan_id: 6 },
    });

    expect(await model.submit()).toBe(false);
    expect(await model.response()).toBe(false);

    expect(mockTransaction.rollback).toHaveBeenCalledTimes(1);
    expect(mockRemoveUploadedFiles).not.toHaveBeenCalled();
    expect(model.errorCode).toBe("SURVEY_ROLLBACK_UNCERTAIN");
    expect(model.statusCode).toBe(503);
  });

  test("preserves files when the commit outcome is uncertain", async () => {
    const form = surveyFile(
      "form_survey",
      "form_survey_server.png",
      uploadDirectory
    );
    mockSurveyPermohonan.create.mockResolvedValueOnce({ id: 9 });
    mockTransaction.commit.mockImplementationOnce(async () => {
      mockTransaction.finished = "commit";
      throw new Error("synthetic uncertain commit");
    });
    const model = new Model_cud({
      body: validSurveyBody(),
      files: { form_survey: [form] },
      surveyCapability: { id: 5, kegiatan_id: 6 },
    });

    expect(await model.submit()).toBe(true);
    expect(await model.response()).toBe(false);

    expect(mockTransaction.finished).toBe("commit");
    expect(mockTransaction.rollback).not.toHaveBeenCalled();
    expect(mockRemoveUploadedFiles).not.toHaveBeenCalled();
    expect(model.errorCode).toBe("SURVEY_COMMIT_UNCERTAIN");
    expect(model.statusCode).toBe(503);
  });

  test("returns a controlled 503 without deleting files after uncertain commit", async () => {
    const form = surveyFile(
      "form_survey",
      "form_survey_server.png",
      uploadDirectory
    );
    mockSurveyPermohonan.create.mockResolvedValueOnce({ id: 10 });
    mockTransaction.commit.mockImplementationOnce(async () => {
      mockTransaction.finished = "commit";
      throw new Error("synthetic uncertain commit");
    });
    const response = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await controllers.submit(
      {
        body: validSurveyBody(),
        files: { form_survey: [form] },
        surveyCapability: { id: 5, kegiatan_id: 6 },
      },
      response
    );

    expect(response.status).toHaveBeenCalledWith(503);
    expect(response.json).toHaveBeenCalledWith({
      error: true,
      error_msg:
        "Status penyimpanan survei belum pasti. Periksa data sebelum mengunggah ulang.",
      code: "SURVEY_COMMIT_UNCERTAIN",
    });
    expect(mockTransaction.rollback).not.toHaveBeenCalled();
    expect(mockRemoveUploadedFiles).not.toHaveBeenCalled();
  });

  test("rejects invalid internal file metadata without opening a transaction", async () => {
    const invalidFile = {
      fieldname: "form_survey",
      filename: "../SIMULATED_TARGET.txt",
      path: path.join(uploadDirectory, "../SIMULATED_TARGET.txt"),
    };
    const model = new Model_cud({
      body: validSurveyBody(),
      files: { form_survey: [invalidFile] },
      surveyCapability: { id: 5, kegiatan_id: 6 },
    });

    expect(await model.submit()).toBe(false);
    expect(await model.response()).toBe(false);
    expect(mockRemoveUploadedFiles).toHaveBeenCalledTimes(1);
    expect(mockSurveyPermohonan.create).not.toHaveBeenCalled();
    expect(mockTransaction.rollback).not.toHaveBeenCalled();
  });

  test("rejects survey creation when the member cancellation locked the parent first", async () => {
    const form = surveyFile(
      "form_survey",
      "form_survey_server.png",
      uploadDirectory
    );
    mockPermohonan.findByPk.mockResolvedValueOnce({
      id: 7,
      member_id: 20,
      kegiatan_id: 6,
      status: "terhenti",
    });
    const model = new Model_cud({
      body: validSurveyBody(),
      files: { form_survey: [form] },
      surveyCapability: { id: 5, kegiatan_id: 6 },
    });

    expect(await model.submit()).toBe(false);
    expect(await model.response()).toBe(false);
    expect(mockSurveyPermohonan.create).not.toHaveBeenCalled();
    expect(mockPermohonan.findByPk).toHaveBeenCalledWith(
      7,
      expect.objectContaining({ lock: "UPDATE" })
    );
  });
});

describe("survey capability scope", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("rejects an inactive or unknown access code", async () => {
    mockSurveyorKegiatan.findOne.mockResolvedValueOnce(null);

    await expect(
      validation.check_access_code("inactive-synthetic-code")
    ).rejects.toThrow(/tidak aktif/i);
  });

  test("rejects a member outside the access-code activity scope", async () => {
    mockSurveyorKegiatan.findOne.mockResolvedValueOnce({
      id: 5,
      kegiatan_id: 6,
    });
    mockMember.findOne.mockResolvedValueOnce({
      id: 20,
      fullname: "Fixture Member",
    });
    mockRealisasiPermohonan.findOne.mockResolvedValueOnce(null);

    await expect(
      validation.check_member_in_capability(20, { id: 5 })
    ).rejects.toThrow(/tidak eligible/i);
  });

  test("accepts a member in the active activity scope", async () => {
    mockSurveyorKegiatan.findOne.mockResolvedValueOnce({
      id: 5,
      kegiatan_id: 6,
    });
    mockMember.findOne.mockResolvedValueOnce({
      id: 20,
      fullname: "Fixture Member",
    });
    mockRealisasiPermohonan.findOne.mockResolvedValueOnce({
      id: 8,
    });

    await expect(
      validation.check_member_in_capability(20, { id: 5 })
    ).resolves.toBe(true);
  });
});

describe("survey multipart limits and trusted router scope", () => {
  const originalSecret = process.env.OTP_HASH_SECRET;
  const defaultUploadDirectory = validation.uploadPath;
  let existingFiles;

  beforeAll(() => {
    process.env.OTP_HASH_SECRET =
      "synthetic-survey-router-secret-at-least-32-characters";
  });

  beforeEach(() => {
    jest.clearAllMocks();
    existingFiles = new Set(
      fs.existsSync(defaultUploadDirectory)
        ? fs.readdirSync(defaultUploadDirectory)
        : []
    );
    mockTransaction.finished = undefined;
    mockTransaction.commit.mockResolvedValue(undefined);
    mockTransaction.rollback.mockResolvedValue(undefined);
    mockSurveyorKegiatan.findOne.mockResolvedValue({
      id: 5,
      kegiatan_id: 6,
      access_code: "server-only-code",
      status: "active",
    });
    mockMember.findOne.mockResolvedValue({ id: 20, fullname: "Fixture" });
    mockSurveyPermohonan.findOne.mockResolvedValue(null);
    mockSurveyPermohonan.create.mockResolvedValue({ id: 99 });
    mockRealisasiPermohonan.findOne.mockResolvedValue({ id: 8 });
    mockPermohonan.findOne.mockResolvedValue({
      id: 7,
      member_id: 20,
      kegiatan_id: 6,
    });
    mockPermohonan.findByPk.mockResolvedValue({
      id: 7,
      member_id: 20,
      kegiatan_id: 6,
      status: "sedang_berlangsung",
    });
    mockInfoSurveyKegiatan.mockResolvedValue({
      id: 5,
      kegiatan_id: 6,
      status: "active",
    });
  });

  afterEach(() => {
    if (fs.existsSync(defaultUploadDirectory)) {
      for (const filename of fs.readdirSync(defaultUploadDirectory)) {
        if (!existingFiles.has(filename)) {
          fs.rmSync(path.join(defaultUploadDirectory, filename), {
            force: true,
          });
        }
      }
    }
  });

  afterAll(() => {
    if (originalSecret === undefined) {
      delete process.env.OTP_HASH_SECRET;
    } else {
      process.env.OTP_HASH_SECRET = originalSecret;
    }
  });

  function capabilityRequest() {
    const token = createCapabilityToken({
      id: 5,
      access_code: "server-only-code",
    });
    return `survey_capability=${token}`;
  }

  test("accepts a normal maximum form with 12 files without access_code", async () => {
    let multipart = request(surveyApp)
      .post("/survey_lapangan/submit")
      .set("Cookie", capabilityRequest());
    for (const [key, value] of Object.entries(validSurveyBody())) {
      multipart = multipart.field(key, String(value));
    }
    multipart = multipart
      .attach("form_survey", SYNTHETIC_PNG, {
        filename: "form.png",
        contentType: "image/png",
      })
      .attach("berita_acara", SYNTHETIC_PNG, {
        filename: "agenda.png",
        contentType: "image/png",
      });
    for (let index = 0; index < 10; index += 1) {
      multipart = multipart.attach("dokumentasi", SYNTHETIC_PNG, {
        filename: `documentation-${index}.png`,
        contentType: "image/png",
      });
    }

    const response = await multipart;

    expect(response.status).toBe(200);
    expect(mockInfoSurveyKegiatan).toHaveBeenCalledWith(5);
    expect(mockPermohonan.findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { kegiatan_id: 6, member_id: "20" },
      })
    );
    expect(mockSurveyPermohonan.create).toHaveBeenCalledTimes(1);
    expect(mockTransaction.commit).toHaveBeenCalledTimes(1);
  });

  test("ignores a multipart code that requests another activity", async () => {
    let multipart = request(surveyApp)
      .post("/survey_lapangan/submit")
      .set("Cookie", capabilityRequest())
      .field("access_code", "other-activity-code");
    for (const [key, value] of Object.entries(validSurveyBody())) {
      multipart = multipart.field(key, String(value));
    }
    multipart = multipart
      .attach("form_survey", SYNTHETIC_PNG, {
        filename: "form.png",
        contentType: "image/png",
      })
      .attach("berita_acara", SYNTHETIC_PNG, {
        filename: "agenda.png",
        contentType: "image/png",
      })
      .attach("dokumentasi", SYNTHETIC_PNG, {
        filename: "documentation.png",
        contentType: "image/png",
      });

    const response = await multipart;

    expect(response.status).toBe(200);
    expect(mockInfoSurveyKegiatan).toHaveBeenCalledWith(5);
    expect(mockPermohonan.findOne.mock.calls[0][0].where.kegiatan_id).toBe(6);
  });

  test("rejects too many text fields before the model runs", async () => {
    let multipart = request(surveyApp)
      .post("/survey_lapangan/submit")
      .set("Cookie", capabilityRequest());
    for (let index = 0; index < 33; index += 1) {
      multipart = multipart.field(`field_${index}`, "x");
    }

    const response = await multipart;

    expect(response.status).toBe(400);
    expect(mockSurveyPermohonan.create).not.toHaveBeenCalled();
  });

  test("rejects an oversized text field before the model runs", async () => {
    const response = await request(surveyApp)
      .post("/survey_lapangan/submit")
      .set("Cookie", capabilityRequest())
      .field("member_id", "20")
      .field("alamat", "x".repeat(16 * 1024 + 1));

    expect(response.status).toBe(400);
    expect(mockSurveyPermohonan.create).not.toHaveBeenCalled();
  });
});
