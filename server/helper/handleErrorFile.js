const { validationResult } = require("express-validator");
const {
  cleanupRequestUploads,
} = require("./uploadedFileHelper");
const {
  removeStoredFile,
} = require("./uploadStorageHelper");

const helper = {};

helper.deleteRequestUploads = (req, directory) =>
  cleanupRequestUploads(req, directory);

helper.handleFileErrors = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    cleanupRequestUploads(req, req.surveyUploadPath);
    for (const upload of req.documentUploads || []) {
      removeStoredFile(upload.directory, upload.filename);
    }
    req.documentUploads = [];
  }

  return next();
};

module.exports = helper;
