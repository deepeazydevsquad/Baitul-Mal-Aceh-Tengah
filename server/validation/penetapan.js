const path = require("path");
const { validationResult } = require("express-validator");
const {
  createSecureImageUpload,
} = require("../helper/secureImageUploadHelper");

const validation = {};

const uploadPath = path.join(__dirname, "../uploads/img/sk_penetapan");

const skUpload = createSecureImageUpload({
  directory: uploadPath,
  field: "sk",
  property: "penetapanSk",
  bodyFieldsToRemove: ["photoPath"],
  required: false,
  maxSize: 1 * 1024 * 1024,
  filenamePrefix: "sk",
  outputFormat: "jpg",
});
validation.upload = (req, res, next) => {
  res.once("finish", () => {
    if (res.statusCode >= 400) {
      skUpload.remove(req);
    }
  });
  return skUpload.middleware(req, res, next);
};
validation.upload.single = () => validation.upload;
validation.cleanupRejectedUpload = (req, res, next) => {
  if (!validationResult(req).isEmpty()) {
    skUpload.remove(req);
  }
  return next();
};
validation.removeUploadedSk = skUpload.remove;
validation.uploadPath = uploadPath;

module.exports = validation;
