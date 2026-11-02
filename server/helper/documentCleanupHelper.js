const crypto = require("crypto");
const path = require("path");
const { Stored_file_cleanup } = require("../models");
const { isSafeStoredFilename } = require("./uploadStorageHelper");

function storedFileKey(directory, filename) {
  return crypto
    .createHash("sha256")
    .update(`${path.resolve(directory)}${path.sep}${filename}`)
    .digest("hex");
}

async function queueStoredFileCleanup(
  directory,
  filename,
  reason,
  transaction
) {
  if (
    typeof directory !== "string" ||
    !directory ||
    !isSafeStoredFilename(filename)
  ) {
    const error = new Error("Referensi file cleanup tidak valid.");
    error.statusCode = 400;
    throw error;
  }

  const resolvedDirectory = path.resolve(directory);
  const fileKey = storedFileKey(resolvedDirectory, filename);
  await Stored_file_cleanup.findOrCreate({
    where: { file_key: fileKey },
    defaults: {
      file_key: fileKey,
      directory: resolvedDirectory,
      filename,
      reason: String(reason || "orphan-document").slice(0, 255),
    },
    transaction,
  });
}

module.exports = {
  queueStoredFileCleanup,
  storedFileKey,
};
