const Model_cud = require("../models/model_cud");
const Model_r = require("../models/model_r");
const { handleServerError, handleValidationErrors } = require("../../../helper/handleError");

exports.register = async (req, res) => {
    // filter error
    if (!(await handleValidationErrors(req, res))) return;

    try {
        const model = new Model_cud(req);
        await model.register();

        if (await model.response()) {
            res.status(200).json({
                message:
                    model.message ||
                    "Registrasi Berhasil, Menunggu Persetujuan Admin",
                status: "success",
            });
        } else {
            const status = model.errorCode === "OTP_ATTEMPTS_EXCEEDED" ? 429 : 400;
            res.status(status).json({
                message: model.message || "Gagal melakukan Registrasi",
                status: "failed",
                code: model.errorCode || "REGISTRATION_FAILED",
            });
        }
    } catch (error) {
        console.error("Terjadi error saat Regisrasi Fee:", error);
        handleServerError(res, error);
    }
};

exports.list_desa = async (req, res) => {
    try {
        const model = new Model_r(req);
        const data = await model.daftar_desa();
        return res.status(200).json(data); // pake return
    } catch (error) {
        return handleServerError(res, error); // kasih full error object
    }
};

exports.list_kecamatan = async (req, res) => {
    try {
        const model = new Model_r(req);
        const data = await model.daftar_kecamatan();
        return res.status(200).json(data); // pake return
    } catch (error) {
        return handleServerError(res, error); // kasih full error object
    }
};

