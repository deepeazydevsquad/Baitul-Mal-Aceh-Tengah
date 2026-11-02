const express = require("express");
const fs = require("fs");
const path = require("path");
const request = require("supertest");
const { body } = require("express-validator");

const mockSyaratKegiatan = {
  findAll: jest.fn(),
};

jest.mock("../models", () => ({
  Op: {},
  sequelize: {},
  Realisasi_permohonan: {},
  Permohonan: {},
  Kegiatan: {},
  Bank: {},
  Member: {},
  Syarat: {},
  Syarat_kegiatan: mockSyaratKegiatan,
}));

const validation = require("../validation/permohonan_bantuan");

function createUploadApp() {
  const app = express();
  app.post(
    "/permohonan_bantuan/add",
    validation.upload,
    [body("kegiatan_id").notEmpty()],
    validation.persistValidatedUploads,
    (req, res) => {
      res.status(200).json({
        uploads: req.adminPermohonanUploads,
        arr_path: req.body.arr_path,
      });
    }
  );
  return app;
}

describe("admin assistance document upload security", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSyaratKegiatan.findAll.mockResolvedValue([
      {
        Syarat: {
          name: "KTP",
          path: "ktp",
        },
      },
    ]);
  });

  test("rejects HTML content that claims to be a PDF", async () => {
    const before = new Set(fs.readdirSync(validation.uploadPath));
    const response = await request(createUploadApp())
      .post("/permohonan_bantuan/add")
      .field("kegiatan_id", "7")
      .attach("dokumen_ktp", Buffer.from("<html>active</html>"), {
        filename: "identity.pdf",
        contentType: "application/pdf",
      });

    expect(response.status).toBe(400);
    expect(response.body.code).toBe("UPLOAD_REJECTED");
    const after = fs.readdirSync(validation.uploadPath);
    expect(after.filter((file) => !before.has(file))).toEqual([]);
  });

  test("rejects an allowed-looking field with a traversal name", async () => {
    const response = await request(createUploadApp())
      .post("/permohonan_bantuan/add")
      .field("kegiatan_id", "7")
      .attach("dokumen_../../active", Buffer.from("%PDF-1.7\nfixture"), {
        filename: "identity.pdf",
        contentType: "application/pdf",
      });

    expect(response.status).toBe(400);
    expect(response.body.code).toBe("UPLOAD_REJECTED");
  });

  test("stores a random server filename and ignores forged arr_path", async () => {
    const response = await request(createUploadApp())
      .post("/permohonan_bantuan/add")
      .field("kegiatan_id", "7")
      .field(
        "arr_path",
        JSON.stringify([
          {
            basename: "active",
            path: "../../uploads/img/bank/active.html",
          },
        ])
      )
      .attach("dokumen_ktp", Buffer.from("%PDF-1.7\nfixture"), {
        filename: "../../identity.pdf",
        contentType: "application/pdf",
      });

    expect(response.status).toBe(200);
    expect(response.body.arr_path).toBeUndefined();
    expect(response.body.uploads).toHaveLength(1);
    expect(response.body.uploads[0].path).toMatch(
      /^dokumen-\d+-[a-f0-9]{36}\.pdf$/
    );
    expect(response.body.uploads[0].path).not.toContain("active");
    const storedPath = path.join(
      validation.uploadPath,
      response.body.uploads[0].path
    );
    expect(fs.existsSync(storedPath)).toBe(true);
    fs.rmSync(storedPath, { force: true });
  });
});
