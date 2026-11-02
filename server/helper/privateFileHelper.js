const fs = require("fs");
const path = require("path");

const privateRoot = path.resolve(__dirname, "../uploads");
const allowedExtensions = new Set([".pdf", ".png", ".jpg", ".jpeg", ".webp"]);

function resolvePrivateFile(relativeFolder, storedPath) {
  if (!storedPath || typeof storedPath !== "string") return null;
  const filename = path.basename(storedPath);
  if (!filename || filename === "." || filename === "..") return null;
  if (!allowedExtensions.has(path.extname(filename).toLowerCase())) return null;

  return path.resolve(privateRoot, relativeFolder, filename);
}

async function assertSafePrivateFile(filePath) {
  if (!filePath || !filePath.startsWith(`${privateRoot}${path.sep}`)) {
    return false;
  }

  try {
    const [realRoot, realFile] = await Promise.all([
      fs.promises.realpath(privateRoot),
      fs.promises.realpath(filePath),
    ]);
    if (!realFile.startsWith(`${realRoot}${path.sep}`)) return false;
    const stat = await fs.promises.stat(realFile);
    return stat.isFile();
  } catch {
    return false;
  }
}

async function sendPrivateFile(res, relativeFolder, storedPath) {
  const filePath = resolvePrivateFile(relativeFolder, storedPath);
  if (!(await assertSafePrivateFile(filePath))) {
    res.status(404).json({
      error: true,
      error_msg: "Dokumen tidak ditemukan.",
      code: "FILE_NOT_FOUND",
    });
    return;
  }

  const filename = path.basename(filePath);
  const safeFilename = filename.replace(/[\r\n"\\]/g, "");
  res.set("Cache-Control", "private, no-store");
  res.set("Content-Disposition", `inline; filename="${safeFilename}"`);
  res.type(path.extname(filename));
  fs.createReadStream(filePath).on("error", () => {
    if (!res.headersSent) {
      res.status(404).json({
        error: true,
        error_msg: "Dokumen tidak dapat dibaca.",
      });
    }
  }).pipe(res);
}

module.exports = {
  privateRoot,
  resolvePrivateFile,
  assertSafePrivateFile,
  sendPrivateFile,
};
