const path = require("path");
const {
  createSecureImageUpload,
} = require("./secureImageUploadHelper");

function createProofUpload(folderName) {
  const baseDirectory = path.resolve(
    __dirname,
    "../uploads/img",
    folderName
  );

  return function proofUpload(tipe = "cash") {
    const folder = tipe === "transfer" ? "bukti_transfer" : "bukti_setoran";
    const upload = createSecureImageUpload({
      directory: path.join(baseDirectory, folder),
      field: "bukti",
      property: "transactionProof",
      bodyFieldsToRemove: ["buktiPath"],
      required: true,
      maxSize: 2 * 1024 * 1024,
      filenamePrefix: "bukti",
      outputFormat: "jpg",
    });
    const middleware = (req, res, next) => {
      res.once("finish", () => {
        if (res.statusCode >= 400) {
          upload.remove(req);
        }
      });
      return upload.middleware(req, res, next);
    };
    middleware.single = () => middleware;
    middleware.directory = upload.directory;
    middleware.remove = upload.remove;
    return middleware;
  };
}

module.exports = {
  createProofUpload,
};
