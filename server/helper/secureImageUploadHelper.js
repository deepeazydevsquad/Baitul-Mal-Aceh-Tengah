const multer = require("multer");
const sharp = require("sharp");
const path = require("path");
const {
  randomStoredFilename,
  removeStoredFile,
  writeStoredFile,
} = require("./uploadStorageHelper");

const ALLOWED_SOURCE_FORMATS = new Set(["jpeg", "png"]);

function createSecureImageUpload(options) {
  const {
    directory,
    field,
    property = "secureUpload",
    bodyFieldsToRemove = [],
    required = false,
    maxSize = 2 * 1024 * 1024,
    maxPixels = 25_000_000,
    width = null,
    height = null,
    filenamePrefix = "image",
    outputFormat = "jpeg",
    quality = 88,
    dimensionsMessage = "Ukuran gambar tidak valid.",
  } = options;

  const resolvedDirectory = path.resolve(directory);
  const extension = outputFormat === "png" ? ".png" : ".jpg";
  const parser = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: maxSize,
      files: 1,
      fields: 30,
    },
    fileFilter(req, file, cb) {
      if (file.fieldname !== field) {
        return cb(new Error("Field unggahan tidak valid."));
      }
      return cb(null, true);
    },
  }).single(field);

  function remove(req) {
    return removeStoredFile(resolvedDirectory, req?.[property]?.filename, {
      allowedExtensions: new Set([extension]),
    });
  }

  function middleware(req, res, next) {
    parser(req, res, async (parseError) => {
      if (parseError) {
        return res.status(400).json({
          status: "error",
          error: true,
          message: "Unggahan file tidak valid.",
          code: "UPLOAD_REJECTED",
        });
      }

      if (req.body) {
        for (const fieldName of bodyFieldsToRemove) {
          delete req.body[fieldName];
        }
      }
      if (!req.file) {
        if (!required) return next();
        return res.status(400).json({
          status: "error",
          error: true,
          message: "File wajib diunggah.",
          code: "UPLOAD_REQUIRED",
        });
      }

      try {
        const source = sharp(req.file.buffer, {
          limitInputPixels: maxPixels,
        });
        const sourceMetadata = await source.metadata();
        if (!ALLOWED_SOURCE_FORMATS.has(sourceMetadata.format)) {
          throw new Error("Isi file bukan gambar PNG atau JPEG.");
        }

        const pipeline = source.rotate();
        const normalizedBuffer =
          outputFormat === "png"
            ? await pipeline.png({ compressionLevel: 9 }).toBuffer()
            : await pipeline.jpeg({ quality, mozjpeg: true }).toBuffer();
        const normalizedMetadata = await sharp(normalizedBuffer).metadata();

        if (width && normalizedMetadata.width !== width) {
          return res.status(400).json({
            status: "error",
            error: true,
            message: dimensionsMessage,
            code: "UPLOAD_REJECTED",
          });
        }
        if (height && normalizedMetadata.height !== height) {
          return res.status(400).json({
            status: "error",
            error: true,
            message: dimensionsMessage,
            code: "UPLOAD_REJECTED",
          });
        }

        const filename = randomStoredFilename(filenamePrefix, extension);
        await writeStoredFile(
          resolvedDirectory,
          filename,
          normalizedBuffer,
          0o644
        );
        req[property] = {
          filename,
          directory: resolvedDirectory,
          mimeType: outputFormat === "png" ? "image/png" : "image/jpeg",
        };
        req.file = {
          ...req.file,
          filename,
          destination: resolvedDirectory,
          path: path.join(resolvedDirectory, filename),
          buffer: undefined,
          mimetype: req[property].mimeType,
        };
        return next();
      } catch {
        return res.status(400).json({
          status: "error",
          error: true,
          message: "Isi file harus berupa gambar PNG atau JPEG yang valid.",
          code: "UPLOAD_REJECTED",
        });
      }
    });
  }

  return {
    middleware,
    remove,
    directory: resolvedDirectory,
  };
}

module.exports = {
  createSecureImageUpload,
};
