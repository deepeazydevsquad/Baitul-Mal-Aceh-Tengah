const express = require("express");
const fs = require("fs");
const path = require("path");
const request = require("supertest");
const sharp = require("sharp");

const mockTransaction = {
  LOCK: { UPDATE: "UPDATE" },
  commit: jest.fn(),
  rollback: jest.fn(),
};
const mockBank = {
  findByPk: jest.fn(),
  destroy: jest.fn(),
};

jest.mock("../models", () => ({
  sequelize: {
    transaction: jest.fn(async () => mockTransaction),
  },
  Bank: mockBank,
  Op: {},
}));
jest.mock("../helper/writeLogHelper", () => ({
  writeLog: jest.fn(),
}));

const validation = require("../validation/bank");
const Model_cud = require("../modules/bank/models/model_cud");

function createUploadApp() {
  const app = express();
  app.post(
    "/upload",
    validation.upload.single("img"),
    validation.check_dimensions(true),
    (req, res) => {
      res.status(200).json({
        logo: req.bankLogo,
        photoPath: req.body.photoPath,
      });
    }
  );
  return app;
}

describe("bank logo upload security", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockTransaction.commit.mockResolvedValue(undefined);
    mockTransaction.rollback.mockResolvedValue(undefined);
  });

  test("does not write HTML that claims to be a PNG", async () => {
    const before = new Set(fs.readdirSync(validation.uploadPath));
    const response = await request(createUploadApp())
      .post("/upload")
      .field("photoPath", "../../SYNTHETIC_TARGET.txt")
      .attach("img", Buffer.from("<html>active</html>"), {
        filename: "synthetic.html",
        contentType: "image/png",
      });

    expect(response.status).toBe(400);
    expect(response.body.code).toBe("UPLOAD_REJECTED");
    const after = fs.readdirSync(validation.uploadPath);
    expect(after.filter((file) => !before.has(file))).toEqual([]);
  });

  test("re-encodes a valid logo under a server-generated PNG name", async () => {
    const image = await sharp({
      create: {
        width: 100,
        height: 33,
        channels: 3,
        background: { r: 10, g: 20, b: 30 },
      },
    })
      .png()
      .toBuffer();

    const response = await request(createUploadApp())
      .post("/upload")
      .field("photoPath", "../../SYNTHETIC_TARGET.txt")
      .attach("img", image, {
        filename: "synthetic.html",
        contentType: "image/png",
      });

    expect(response.status).toBe(200);
    expect(response.body.photoPath).toBeUndefined();
    expect(response.body.logo.filename).toMatch(
      /^bank-\d+-[a-f0-9]{36}\.png$/
    );
    const storedPath = path.join(
      validation.uploadPath,
      response.body.logo.filename
    );
    expect((await sharp(storedPath).metadata()).format).toBe("png");
    fs.rmSync(storedPath, { force: true });
  });

  test("never deletes a forged stored logo path outside the logo folder", async () => {
    const syntheticTarget = path.join(
      validation.uploadPath,
      "..",
      `SYNTHETIC_BANK_${Date.now()}.txt`
    );
    fs.writeFileSync(syntheticTarget, "must remain");
    mockBank.findByPk.mockResolvedValue({
      id: 7,
      name: "Synthetic Bank",
      img: "../" + path.basename(syntheticTarget),
    });
    mockBank.destroy.mockResolvedValue(1);

    const model = new Model_cud({ body: { id: 7 } });
    await model.delete();
    await model.response();

    expect(fs.existsSync(syntheticTarget)).toBe(true);
    fs.rmSync(syntheticTarget, { force: true });
  });
});
