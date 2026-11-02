const Model_r = require("../models/model_r");
const Model_cud = require("../models/model_cud");
const { handleValidationErrors, handleServerError } = require("../../../helper/handleError");

// list agen
exports.list = async (req, res) => {
    console.log("controller item");
    try {
        const model = new Model_r(req);
        const data = await model.daftar_request();
        return res.status(200).json(data); // pake return
    } catch (error) {
        return handleServerError(res, error); // kasih full error object
    }
};

exports.verifikasi = async (req, res) => {
    // filter error
    if (!(await handleValidationErrors(req, res))) return;

    try {
        const model = new Model_cud(req);
        await model.approve_request();

        if (await model.response()) {
            res.status(200).json({
                message:
                    model.message ||
                    "Berhasil, Melakukan Verifikasi Request Keanggotaan",
                status: "success",
            });
        } else {
            res.status(model.statusCode || 400).json({
                message: model.message || "Gagal melakukan Verifikasi",
                status: "failed",
                code: model.errorCode || "VERIFICATION_FAILED",
            });
        }
    } catch (error) {
        console.error("Terjadi error saat Melakukan Verifikasi:", error);
        handleServerError(res, error);
    }
};

