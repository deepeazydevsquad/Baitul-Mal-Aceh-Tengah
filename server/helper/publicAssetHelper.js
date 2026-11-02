const path = require("path");

const PUBLIC_IMAGE_EXTENSIONS = new Set([
  ".ico",
  ".jpeg",
  ".jpg",
  ".png",
  ".webp",
]);

function restrictPublicImageType(req, res, next) {
  const extension = path.extname(req.path).toLowerCase();
  if (!PUBLIC_IMAGE_EXTENSIONS.has(extension)) {
    return res.status(404).json({
      error: true,
      error_msg: "Aset tidak ditemukan.",
      code: "FILE_NOT_FOUND",
    });
  }
  return next();
}

module.exports = {
  PUBLIC_IMAGE_EXTENSIONS,
  restrictPublicImageType,
};
