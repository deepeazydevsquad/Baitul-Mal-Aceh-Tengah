const { Bank, Op } = require("../models");
const multer = require("multer");
const sharp = require("sharp");
const path = require("path");
const fs = require("fs");
const {
  randomStoredFilename,
  removeStoredFile,
  writeStoredFile,
} = require("../helper/uploadStorageHelper");
const { validationResult } = require("express-validator");

const validation = {};

// Validasi id bank apakah sudah ada di database
validation.check_id_bank = async (value) => {
  const check = await Bank.findByPk(value);
  if (!check) {
    throw new Error("Bank tidak terdaftar di pangkalan data");
  }
  return true;
};

// Validasi nama bank apakah sudah ada di database
validation.check_nama_bank = async (value, { req }) => {
  const id = req.body.id;

  if (id) {
    const current = await Bank.findByPk(id);
    if (!current) {
      throw new Error("Bank tidak ditemukan");
    }

    if (current.name === value) {
      return true;
    }

    const check = await Bank.findOne({
      where: { id: { [Op.ne]: id }, name: value },
    });
    if (check) {
      throw new Error(
        "Bank dengan nama yang sama sudah terdaftar di pangkalan data"
      );
    }
  } else {
    const check = await Bank.findOne({
      where: { name: value },
    });
    if (check) {
      throw new Error(
        "Bank dengan nama yang sama sudah terdaftar di pangkalan data"
      );
    }
  }

  return true;
};

const uploadPath = path.join(__dirname, "../uploads/img/bank");
const MAX_LOGO_PIXELS = 1_000_000;

if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/png", "image/jpeg", "image/jpg"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Format file harus PNG, JPG atau JPEG"), false);
  }
};

validation.upload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: {
    fileSize: 1 * 1024 * 1024,
    files: 1,
    fields: 20,
  },
});

function removeBankLogo(req) {
  const logo = req?.bankLogo;
  return removeStoredFile(uploadPath, logo?.filename, {
    allowedExtensions: new Set([".png"]),
  });
}

// Validate the actual image bytes, enforce dimensions, re-encode as PNG, and
// only then write a server-generated filename into the public logo directory.
validation.check_dimensions = (isRequired = true) => {
  return async (req, res, next) => {
    if (req.body) {
      delete req.body.photoPath;
    }

    if (!req.file) {
      if (isRequired) {
        return res
          .status(400)
          .json({ error: true, error_msg: "Logo bank wajib diupload" });
      } else {
        return next();
      }
    }

    try {
      const source = sharp(req.file.buffer, {
        limitInputPixels: MAX_LOGO_PIXELS,
      });
      const sourceMetadata = await source.metadata();
      if (!["jpeg", "png"].includes(sourceMetadata.format)) {
        throw new Error("Isi file bukan gambar PNG atau JPEG.");
      }

      const normalizedBuffer = await source
        .rotate()
        .png({ compressionLevel: 9 })
        .toBuffer();
      const normalizedMetadata = await sharp(normalizedBuffer).metadata();
      if (
        normalizedMetadata.width !== 100 ||
        normalizedMetadata.height !== 33
      ) {
        return res
          .status(400)
          .json({
            error: true,
            error_msg: "Ukuran gambar harus 100x33 piksel",
          });
      }

      const filename = randomStoredFilename("bank", ".png");
      await writeStoredFile(uploadPath, filename, normalizedBuffer, 0o644);
      req.bankLogo = {
        filename,
        directory: path.resolve(uploadPath),
        mimeType: "image/png",
      };
      req.file = {
        ...req.file,
        filename,
        destination: path.resolve(uploadPath),
        path: path.join(path.resolve(uploadPath), filename),
        buffer: undefined,
        mimetype: "image/png",
      };
      return next();
    } catch (err) {
      return res
        .status(400)
        .json({
          error: true,
          error_msg: "Isi file harus berupa gambar PNG atau JPEG yang valid.",
          code: "UPLOAD_REJECTED",
        });
    }
  };
};

validation.cleanupRejectedUpload = (req, res, next) => {
  if (!validationResult(req).isEmpty()) {
    removeBankLogo(req);
  }
  return next();
};
validation.removeBankLogo = removeBankLogo;
validation.uploadPath = uploadPath;

module.exports = validation;
