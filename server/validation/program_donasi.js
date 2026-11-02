const { Bank } = require("../models");
const multer = require("multer");
const sharp = require("sharp");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const { validationResult } = require("express-validator");

const validation = {};

const uploadPath = path.resolve(
  __dirname,
  "../uploads/img/program_donasi"
);
const MAX_BANNER_SIZE = 1 * 1024 * 1024;
const MAX_BANNER_PIXELS = 25_000_000;
const ALLOWED_SOURCE_FORMATS = new Set(["jpeg", "png"]);

const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/png", "image/jpeg", "image/jpg"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Format file harus PNG, JPG atau JPEG"), false);
  }
};

function isPathInsideDirectory(directory, targetPath) {
  const relativePath = path.relative(
    path.resolve(directory),
    path.resolve(targetPath)
  );
  return (
    relativePath !== "" &&
    relativePath !== ".." &&
    !relativePath.startsWith(`..${path.sep}`) &&
    !path.isAbsolute(relativePath)
  );
}

function createProgramDonasiUploadMiddleware(directory = uploadPath) {
  const resolvedDirectory = path.resolve(directory);
  const parser = multer({
    storage: multer.memoryStorage(),
    fileFilter,
    limits: {
      fileSize: MAX_BANNER_SIZE,
      files: 1,
      fields: 20,
    },
  }).single("banner");

  return function programDonasiUpload(req, res, next) {
    parser(req, res, async (uploadError) => {
      if (uploadError) {
        return res.status(400).json({
          status: "error",
          error: true,
          message: "Unggahan banner tidak valid.",
          code: "UPLOAD_REJECTED",
        });
      }

      if (req.body) delete req.body.photoPath;

      if (!req.file) return next();

      try {
        const image = sharp(req.file.buffer, {
          limitInputPixels: MAX_BANNER_PIXELS,
        });
        const metadata = await image.metadata();
        if (!ALLOWED_SOURCE_FORMATS.has(metadata.format)) {
          throw new Error("Isi file harus berupa gambar PNG atau JPEG.");
        }

        const normalizedImage = await image
          .rotate()
          .jpeg({ quality: 88, mozjpeg: true })
          .toBuffer();

        let safeName = String(req.body?.name || "program_donasi")
          .replace(/\s+/g, "_")
          .replace(/[^a-zA-Z0-9_]/g, "")
          .toLowerCase()
          .slice(0, 80);
        if (!safeName) safeName = "program_donasi";

        await fs.promises.mkdir(resolvedDirectory, { recursive: true });
        const realDirectory = await fs.promises.realpath(
          resolvedDirectory
        );
        const filename = `${safeName}-${Date.now()}-${crypto
          .randomBytes(18)
          .toString("hex")}.jpg`;
        const targetPath = path.resolve(realDirectory, filename);
        if (!isPathInsideDirectory(realDirectory, targetPath)) {
          throw new Error("Path banner tidak valid.");
        }

        await fs.promises.writeFile(targetPath, normalizedImage, {
          flag: "wx",
          mode: 0o644,
        });

        req.programDonasiBanner = filename;
        req.programDonasiBannerDirectory = realDirectory;
        return next();
      } catch (error) {
        return res.status(400).json({
          status: "error",
          error: true,
          message: "Isi file harus berupa gambar PNG atau JPEG yang valid.",
          code: "UPLOAD_REJECTED",
        });
      }
    });
  };
}

function removeUploadedBanner(req) {
  const filename = req?.programDonasiBanner;
  const directory = req?.programDonasiBannerDirectory || uploadPath;
  if (
    typeof filename !== "string" ||
    !filename ||
    filename.includes("\0") ||
    filename.includes("/") ||
    filename.includes("\\") ||
    path.basename(filename) !== filename
  ) {
    return false;
  }

  const targetPath = path.resolve(directory, filename);
  if (!isPathInsideDirectory(directory, targetPath)) return false;

  try {
    const stat = fs.lstatSync(targetPath);
    if (!stat.isFile() && !stat.isSymbolicLink()) return false;
    fs.unlinkSync(targetPath);
    return true;
  } catch {
    return false;
  }
}

validation.cleanupRejectedUpload = (req, res, next) => {
  if (!validationResult(req).isEmpty()) {
    removeUploadedBanner(req);
  }
  return next();
};
validation.removeUploadedBanner = removeUploadedBanner;
validation.upload = createProgramDonasiUploadMiddleware(uploadPath);
validation.createProgramDonasiUploadMiddleware =
  createProgramDonasiUploadMiddleware;
validation.isPathInsideDirectory = isPathInsideDirectory;
validation.uploadPath = uploadPath;

module.exports = validation;
