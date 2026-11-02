const express = require("express");
const request = require("supertest");
const multer = require("multer");
const validation = require("../validation/pengaturan_umum");

function createApp() {
  const app = express();
  app.post(
    "/pengaturan_umum/edit",
    (req, res, next) => {
      validation.upload.fields([
        { name: "icon", maxCount: 1 },
        { name: "logo", maxCount: 1 },
        { name: "hero_logo", maxCount: 1 },
        { name: "logo_tanpa_teks", maxCount: 1 },
      ])(req, res, next);
    },
    (error, req, res, next) => {
      if (error instanceof multer.MulterError) {
        return res.status(400).json({ error: true, code: error.code });
      }
      return next(error);
    },
    (req, res) => res.status(200).json({ fields: Object.keys(req.body).length })
  );
  return app;
}

describe("pengaturan umum multipart limits", () => {
  test("accepts a normal bounded form without files", async () => {
    const response = await request(createApp())
      .post("/pengaturan_umum/edit")
      .field("nama_kabupaten_kota", "Fixture")
      .field("alamat", "Fixture")
      .field("quote", "Fixture");

    expect(response.status).toBe(200);
    expect(response.body.fields).toBe(3);
  });

  test("rejects more text fields than the endpoint needs", async () => {
    let multipart = request(createApp()).post("/pengaturan_umum/edit");
    for (let index = 0; index < 17; index += 1) {
      multipart = multipart.field(`unused_${index}`, "x");
    }

    const response = await multipart;

    expect(response.status).toBe(400);
    expect(response.body.code).toBe("LIMIT_FIELD_COUNT");
  });

  test("rejects an oversized text field", async () => {
    const response = await request(createApp())
      .post("/pengaturan_umum/edit")
      .field("alamat", "x".repeat(8 * 1024 + 1));

    expect(response.status).toBe(400);
    expect(response.body.code).toBe("LIMIT_FIELD_VALUE");
  });
});
