const express = require("express");
const fs = require("fs");
const os = require("os");
const path = require("path");
const request = require("supertest");
const sharp = require("sharp");

const mockTransaction = {
  LOCK: { UPDATE: "UPDATE" },
  commit: jest.fn(),
  rollback: jest.fn(),
  finished: false,
};
const mockProgramDonasi = {
  create: jest.fn(),
  findByPk: jest.fn(),
};
const mockWriteLog = jest.fn();

jest.mock("../models", () => ({
  sequelize: {
    transaction: jest.fn(async () => mockTransaction),
  },
  Program_donasi: mockProgramDonasi,
  Riwayat_donasi: {},
  Bank: {},
}));
jest.mock("../helper/writeLogHelper", () => ({
  writeLog: mockWriteLog,
}));

const validation = require("../validation/program_donasi");
const Model_cud = require(
  "../modules/program_donasi/models/model_cud"
);
const {
  restrictPublicImageType,
} = require("../helper/publicAssetHelper");

function createUploadApp(directory) {
  const app = express();
  app.post(
    "/upload",
    validation.createProgramDonasiUploadMiddleware(directory),
    (req, res) => {
      res.status(200).json({
        banner: req.programDonasiBanner,
        photoPath: req.body.photoPath,
      });
    }
  );
  return app;
}

describe("program donation banner security", () => {
  let temporaryRoot;

  beforeEach(() => {
    jest.clearAllMocks();
    mockTransaction.finished = false;
    mockTransaction.commit.mockResolvedValue(undefined);
    mockTransaction.rollback.mockResolvedValue(undefined);
    mockProgramDonasi.create.mockResolvedValue({ id: 1 });
  });

  afterEach(() => {
    if (temporaryRoot) {
      fs.rmSync(temporaryRoot, { recursive: true, force: true });
      temporaryRoot = undefined;
    }
  });

  test("rejects traversal and absolute paths before deletion", () => {
    temporaryRoot = fs.mkdtempSync(
      path.join(os.tmpdir(), "baitulmal-program-banner-")
    );
    const bannerDirectory = path.join(temporaryRoot, "banners");
    const syntheticTarget = path.join(
      temporaryRoot,
      "SYNTHETIC_TARGET.txt"
    );
    fs.mkdirSync(bannerDirectory);
    fs.writeFileSync(syntheticTarget, "must remain");

    expect(
      Model_cud.resolveBannerPath(
        "../SYNTHETIC_TARGET.txt",
        bannerDirectory
      )
    ).toBeNull();
    expect(
      Model_cud.resolveBannerPath(syntheticTarget, bannerDirectory)
    ).toBeNull();
    expect(
      Model_cud.removeBannerFile(
        "../SYNTHETIC_TARGET.txt",
        bannerDirectory
      )
    ).toBe(false);
    expect(fs.existsSync(syntheticTarget)).toBe(true);
  });

  test("stores only server upload metadata when the body forges photoPath", async () => {
    const model = new Model_cud({
      body: {
        name: "Synthetic Program",
        photoPath: "../../SYNTHETIC_TARGET.txt",
        tahun: new Date().getFullYear(),
        deskripsi: "Synthetic",
        target_donasi_terkumpul: 1000,
        waktu_donasi: "2026-12-31",
      },
      programDonasiBanner: "server-banner.jpg",
    });

    await model.add();

    expect(mockProgramDonasi.create).toHaveBeenCalledWith(
      expect.objectContaining({
        banner: "server-banner.jpg",
      }),
      expect.any(Object)
    );
    expect(
      mockProgramDonasi.create.mock.calls[0][0].banner
    ).not.toContain("SYNTHETIC_TARGET");
  });

  test("does not use body.photoPath when no banner was uploaded", async () => {
    const model = new Model_cud({
      body: {
        name: "Synthetic Program",
        photoPath: "../../SYNTHETIC_TARGET.txt",
        tahun: new Date().getFullYear(),
        deskripsi: "Synthetic",
        target_donasi_terkumpul: 1000,
        waktu_donasi: "2026-12-31",
      },
    });

    await model.add();

    expect(mockProgramDonasi.create).toHaveBeenCalledWith(
      expect.objectContaining({ banner: null }),
      expect.any(Object)
    );
  });

  test("never deletes a forged database banner outside the upload folder", async () => {
    const destroy = jest.fn().mockResolvedValue(undefined);
    mockProgramDonasi.findByPk.mockResolvedValue({
      id: 8,
      banner: "../SYNTHETIC_TARGET.txt",
      destroy,
    });
    const unlinkSpy = jest.spyOn(fs, "unlinkSync");
    const model = new Model_cud({ body: { id: 8 } });

    await model.delete();
    const response = await model.response();

    expect(response).toBe(true);
    expect(destroy).toHaveBeenCalledTimes(1);
    expect(unlinkSpy).not.toHaveBeenCalled();
    unlinkSpy.mockRestore();
  });

  test("rejects HTML disguised as a PNG and writes no file", async () => {
    temporaryRoot = fs.mkdtempSync(
      path.join(os.tmpdir(), "baitulmal-program-banner-")
    );
    const bannerDirectory = path.join(temporaryRoot, "banners");

    const response = await request(createUploadApp(bannerDirectory))
      .post("/upload")
      .field("name", "Synthetic")
      .attach("banner", Buffer.from("<html>active</html>"), {
        filename: "fixture.html",
        contentType: "image/png",
      });

    expect(response.status).toBe(400);
    expect(response.body.code).toBe("UPLOAD_REJECTED");
    expect(fs.existsSync(bannerDirectory)).toBe(false);
  });

  test("re-encodes a valid image and chooses a server-generated JPEG name", async () => {
    temporaryRoot = fs.mkdtempSync(
      path.join(os.tmpdir(), "baitulmal-program-banner-")
    );
    const bannerDirectory = path.join(temporaryRoot, "banners");
    const png = await sharp({
      create: {
        width: 2,
        height: 2,
        channels: 3,
        background: { r: 20, g: 40, b: 60 },
      },
    })
      .png()
      .toBuffer();

    const response = await request(createUploadApp(bannerDirectory))
      .post("/upload")
      .field("name", "Synthetic")
      .attach("banner", png, {
        filename: "fixture.html",
        contentType: "image/png",
      });

    expect(response.status).toBe(200);
    expect(response.body.photoPath).toBeUndefined();
    expect(response.body.banner).toMatch(
      /^synthetic-\d+-[a-f0-9]{36}\.jpg$/
    );
    const storedPath = path.join(bannerDirectory, response.body.banner);
    expect(fs.existsSync(storedPath)).toBe(true);
    expect((await sharp(storedPath).metadata()).format).toBe("jpeg");
  });

  test("serves only allowlisted public image extensions", () => {
    const next = jest.fn();
    const htmlResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    restrictPublicImageType(
      { path: "/active.html" },
      htmlResponse,
      next
    );

    expect(htmlResponse.status).toHaveBeenCalledWith(404);
    expect(next).not.toHaveBeenCalled();

    restrictPublicImageType(
      { path: "/banner.JPG" },
      { status: jest.fn() },
      next
    );
    expect(next).toHaveBeenCalledTimes(1);
  });
});
