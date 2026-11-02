const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const DEFAULT_STORED_EXTENSIONS = new Set([
  ".pdf",
  ".png",
  ".jpg",
  ".jpeg",
]);

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

function isSafeStoredFilename(filename, allowedExtensions) {
  if (
    typeof filename !== "string" ||
    !filename ||
    filename !== filename.trim() ||
    filename.includes("\0") ||
    filename.includes("/") ||
    filename.includes("\\") ||
    path.basename(filename) !== filename ||
    filename === "." ||
    filename === ".."
  ) {
    return false;
  }

  const extensions = allowedExtensions || DEFAULT_STORED_EXTENSIONS;
  return extensions.has(path.extname(filename).toLowerCase());
}

function resolveStoredPath(directory, filename, options = {}) {
  const extensions = options.allowedExtensions || DEFAULT_STORED_EXTENSIONS;
  if (!isSafeStoredFilename(filename, extensions)) return null;

  const root = path.resolve(directory);
  const targetPath = path.resolve(root, filename);
  if (!isPathInsideDirectory(root, targetPath)) return null;

  try {
    const realRoot = fs.realpathSync(root);
    if (fs.existsSync(targetPath)) {
      const realTarget = fs.realpathSync(targetPath);
      if (!isPathInsideDirectory(realRoot, realTarget)) return null;
    }
    return targetPath;
  } catch {
    return null;
  }
}

function removeStoredFile(directory, filename, options = {}) {
  const targetPath = resolveStoredPath(directory, filename, options);
  if (!targetPath) return false;

  try {
    const stat = fs.lstatSync(targetPath);
    if (!stat.isFile() && !stat.isSymbolicLink()) return false;
    fs.unlinkSync(targetPath);
    return true;
  } catch {
    return false;
  }
}

function randomStoredFilename(prefix = "upload", extension = ".bin") {
  const safePrefix = String(prefix || "upload")
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80) || "upload";
  return `${safePrefix}-${Date.now()}-${crypto
    .randomBytes(18)
    .toString("hex")}${extension}`;
}

async function writeStoredFile(directory, filename, contents, mode = 0o600) {
  const root = path.resolve(directory);
  await fs.promises.mkdir(root, { recursive: true });
  const realRoot = await fs.promises.realpath(root);
  const targetPath = path.resolve(realRoot, filename);
  if (!isPathInsideDirectory(realRoot, targetPath)) {
    throw new Error("Path unggahan tidak valid.");
  }

  await fs.promises.writeFile(targetPath, contents, {
    flag: "wx",
    mode,
  });
  return targetPath;
}

function detectFileType(buffer) {
  if (!Buffer.isBuffer(buffer)) return null;

  if (
    buffer.length >= 5 &&
    buffer.subarray(0, 5).toString("ascii") === "%PDF-"
  ) {
    return {
      mimeType: "application/pdf",
      extension: ".pdf",
      allowedExtensions: new Set([".pdf"]),
    };
  }

  if (
    buffer.length >= 8 &&
    buffer.subarray(0, 8).equals(
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
    )
  ) {
    return {
      mimeType: "image/png",
      extension: ".png",
      allowedExtensions: new Set([".png"]),
    };
  }

  if (
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) {
    return {
      mimeType: "image/jpeg",
      extension: ".jpg",
      allowedExtensions: new Set([".jpg", ".jpeg"]),
    };
  }

  return null;
}

module.exports = {
  DEFAULT_STORED_EXTENSIONS,
  detectFileType,
  isPathInsideDirectory,
  isSafeStoredFilename,
  randomStoredFilename,
  removeStoredFile,
  resolveStoredPath,
  writeStoredFile,
};
