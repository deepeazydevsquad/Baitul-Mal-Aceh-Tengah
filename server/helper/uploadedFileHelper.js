const fs = require("fs");
const path = require("path");

const SURVEY_UPLOAD_FIELDS = new Set([
  "form_survey",
  "berita_acara",
  "dokumentasi",
]);
const SURVEY_UPLOAD_DIRECTORY = path.join(
  __dirname,
  "../uploads/dokumen/survey_lapangan"
);

function flattenMulterFiles(files) {
  if (!files) return [];
  if (Array.isArray(files)) return files.filter(Boolean);
  if (typeof files !== "object") return [];

  return Object.values(files)
    .flatMap((value) => (Array.isArray(value) ? value : [value]))
    .filter(Boolean);
}

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

function safeFilename(file) {
  const filename = String(file?.filename || "");
  if (
    !filename ||
    filename.includes("\0") ||
    filename.includes("/") ||
    filename.includes("\\") ||
    path.basename(filename) !== filename
  ) {
    return null;
  }
  return filename;
}

function resolveSafeUploadPath(directory, filename) {
  if (
    !filename ||
    filename.includes("\0") ||
    filename.includes("/") ||
    filename.includes("\\") ||
    path.basename(filename) !== filename
  ) {
    return null;
  }

  const root = path.resolve(directory);
  const target = path.resolve(root, filename);
  if (!isPathInsideDirectory(root, target)) return null;

  if (!fs.existsSync(target)) return target;

  try {
    const realRoot = fs.realpathSync(root);
    const realTarget = fs.realpathSync(target);
    if (!isPathInsideDirectory(realRoot, realTarget)) return null;
  } catch {
    return null;
  }

  return target;
}

function collectSurveyUploads(files, directory) {
  const records = [];
  let invalid = false;

  for (const file of flattenMulterFiles(files)) {
    const filename = safeFilename(file);
    const fieldname = String(file?.fieldname || "");
    const filePath = filename
      ? resolveSafeUploadPath(directory, filename)
      : null;

    if (
      !filename ||
      !SURVEY_UPLOAD_FIELDS.has(fieldname) ||
      !filePath ||
      (file.path && path.resolve(file.path) !== filePath)
    ) {
      invalid = true;
      continue;
    }

    records.push({
      fieldname,
      filename,
      path: filePath,
    });
  }

  const findSingle = (fieldname) =>
    records.find((record) => record.fieldname === fieldname)?.filename || null;

  return {
    valid: !invalid,
    files: records,
    form_survey: findSingle("form_survey"),
    berita_acara: findSingle("berita_acara"),
    dokumentasi: records
      .filter((record) => record.fieldname === "dokumentasi")
      .map((record) => record.filename),
  };
}

function removeUploadedFiles(files, directory, options = {}) {
  const result = { removed: 0, missing: 0, skipped: 0, failed: 0 };
  const handledPaths = new Set();
  const allowedFields =
    options.allowedFields === undefined
      ? SURVEY_UPLOAD_FIELDS
      : options.allowedFields;
  if (!directory) {
    result.skipped = flattenMulterFiles(files).length;
    return result;
  }

  for (const file of flattenMulterFiles(files)) {
    const filename = safeFilename(file);
    const filePath = filename
      ? resolveSafeUploadPath(directory, filename)
      : null;

    if (
      !filename ||
      (allowedFields &&
        !allowedFields.has(String(file?.fieldname || ""))) ||
      !filePath ||
      (file.path && path.resolve(file.path) !== filePath) ||
      handledPaths.has(filePath)
    ) {
      result.skipped += 1;
      continue;
    }

    handledPaths.add(filePath);
    try {
      fs.unlinkSync(filePath);
      result.removed += 1;
    } catch (error) {
      if (error?.code === "ENOENT") {
        result.missing += 1;
      } else {
        result.failed += 1;
      }
    }
  }

  return result;
}

function cleanupRequestUploads(req, directory) {
  if (directory) return removeUploadedFiles(req?.files, directory);

  const files = [req?.file, ...flattenMulterFiles(req?.files)].filter(Boolean);
  const result = { removed: 0, missing: 0, skipped: 0, failed: 0 };

  for (const file of files) {
    const filename =
      safeFilename(file) ||
      (file.path ? path.basename(String(file.path)) : null);
    const fileDirectory =
      file.destination || (file.path ? path.dirname(file.path) : null);
    if (!filename || !fileDirectory) {
      result.skipped += 1;
      continue;
    }

    const cleaned = removeUploadedFiles(
      [
        {
          ...file,
          filename,
          path: path.resolve(fileDirectory, filename),
        },
      ],
      fileDirectory,
      { allowedFields: null }
    );
    result.removed += cleaned.removed;
    result.missing += cleaned.missing;
    result.skipped += cleaned.skipped;
    result.failed += cleaned.failed;
  }

  return result;
}

module.exports = {
  SURVEY_UPLOAD_FIELDS,
  SURVEY_UPLOAD_DIRECTORY,
  flattenMulterFiles,
  isPathInsideDirectory,
  resolveSafeUploadPath,
  collectSurveyUploads,
  removeUploadedFiles,
  cleanupRequestUploads,
};
