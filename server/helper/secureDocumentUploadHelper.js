const multer = require("multer");
const fs = require("fs");
const path = require("path");
const {
  detectFileType,
  randomStoredFilename,
  removeStoredFile,
  writeStoredFile,
} = require("./uploadStorageHelper");

const DOCUMENT_EXTENSIONS = new Set([".pdf", ".png", ".jpg", ".jpeg"]);

function createSecureDocumentUpload(options) {
  const {
    directory,
    field,
    property = "secureDocument",
    bodyFieldsToRemove = [],
    required = true,
    maxSize = 1 * 1024 * 1024,
    filenamePrefix = "document",
  } = options;
  const resolvedDirectory = path.resolve(directory);
  const pendingProperty = `${property}Pending`;

  const parser = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: maxSize,
      files: 1,
      fields: 30,
    },
  }).single(field);

  function remove(req) {
    return removeStoredFile(
      resolvedDirectory,
      req?.[property]?.filename,
      { allowedExtensions: DOCUMENT_EXTENSIONS }
    );
  }

  function middleware(req, res, next) {
    parser(req, res, (error) => {
      if (error) {
        return res.status(400).json({
          status: "error",
          error: true,
          message: "Unggahan file tidak valid.",
          code: "UPLOAD_REJECTED",
        });
      }

      if (req.body) {
        for (const bodyField of bodyFieldsToRemove) {
          delete req.body[bodyField];
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

      const detectedType = detectFileType(req.file.buffer);
      const clientExtension = path
        .extname(String(req.file.originalname || ""))
        .toLowerCase();
      if (!detectedType || !detectedType.allowedExtensions.has(clientExtension)) {
        return res.status(400).json({
          status: "error",
          error: true,
          message: "Isi file harus PDF, JPEG, JPG, atau PNG yang valid.",
          code: "UPLOAD_REJECTED",
        });
      }

      req[pendingProperty] = {
        buffer: req.file.buffer,
        extension: detectedType.extension,
        mimeType: detectedType.mimeType,
      };
      return next();
    });
  }

  async function persist(req, res, next) {
    if (!req[pendingProperty]) {
      return next();
    }
    try {
      await fs.promises.mkdir(resolvedDirectory, { recursive: true });
      const realDirectory = await fs.promises.realpath(resolvedDirectory);
      const filename = randomStoredFilename(
        filenamePrefix,
        req[pendingProperty].extension
      );
      await writeStoredFile(
        realDirectory,
        filename,
        req[pendingProperty].buffer,
        0o600
      );
      req[property] = {
        filename,
        directory: realDirectory,
        mimeType: req[pendingProperty].mimeType,
      };
      req.documentUploads = [
        ...(Array.isArray(req.documentUploads) ? req.documentUploads : []),
        { directory: realDirectory, filename },
      ];
      delete req[pendingProperty];
      return next();
    } catch {
      return res.status(500).json({
        status: "error",
        error: true,
        message: "Dokumen gagal diproses.",
        code: "UPLOAD_FAILED",
      });
    }
  }

  return {
    middleware,
    persist,
    remove,
    directory: resolvedDirectory,
  };
}

module.exports = {
  createSecureDocumentUpload,
  DOCUMENT_EXTENSIONS,
  removeDocumentFile: removeStoredFile,
};
