const Model_r = require("../models/model_r");
const Model_cud = require("../models/model_cud");
const { handleValidationErrors, handleServerError } = require("../../../helper/handleError");

function handleControllerError(res, error) {
    if (error?.statusCode) {
        return res.status(error.statusCode).json({
            message: error.message,
            status: "failed",
            code: error.code,
        });
    }
    return handleServerError(res, error);
}

// list pengguna
exports.list_daftar_pengguna = async (req, res) => {
    if (!(await handleValidationErrors(req, res))) return;

    try {
        const model = new Model_r(req);
        const data = await model.daftar_pengguna();

        res.status(200).json({
            message: "Berhasil mengambil daftar pengguna",
            status: "success",
            data: data || [],
        });
    } catch (error) {
        console.error("Terjadi error saat mengambil daftar pengguna:", error);
        handleServerError(res, error);
    }
};

exports.grup = async (req, res) => {
    if (!(await handleValidationErrors(req, res))) return;

    try {
        const model = new Model_r(req);
        const data = await model.list_grup();

        res.status(200).json({
            message: "Berhasil mengambil daftar grup",
            status: "success",
            data: data || [],
        });
    } catch (error) {
        console.error("Terjadi error saat mengambil daftar grup:", error);
        handleServerError(res, error);
    }
};

// tambah pengguna
exports.add = async (req, res) => {
    if (!(await handleValidationErrors(req, res))) return;

    try {
        const model = new Model_cud(req);
        await model.create();

        if (await model.response()) {
            res.status(200).json({
                message: model.message,
                status: "success",
            });
        } else {
            res.status(400).json({
                message: model.message,
                status: "failed",
            });
        }
    } catch (error) {
        handleControllerError(res, error);
    }
};

// update pengguna
exports.update = async (req, res) => {
    if (!(await handleValidationErrors(req, res))) return;

    try {
        const model = new Model_cud(req);
        await model.update();

        if (await model.response()) {
            res.status(200).json({
                message: model.message,
                status: "success",
            });
        } else {
            res.status(400).json({
                message: model.message,
                status: "failed",
            });
        }
    } catch (error) {
        handleControllerError(res, error);
    }
};

// hapus pengguna
exports.delete = async (req, res) => {
    if (!(await handleValidationErrors(req, res))) return;

    try {
        const model = new Model_cud(req);
        await model.delete();

        if (await model.response()) {
            res.status(200).json({
                message: model.message,
                status: "success",
            });
        } else {
            res.status(400).json({
                message: model.message,
                status: "failed",
            });
        }
    } catch (error) {
        handleControllerError(res, error);
    }
};

// ambil detail pengguna
exports.detail = async (req, res) => {
    if (!(await handleValidationErrors(req, res))) return;

    try {
        const model = new Model_r(req);
        const data = await model.detail_pengguna();

        if (data) {
            res.status(200).json({
                message: "Berhasil mengambil detail pengguna",
                status: "success",
                data,
            });
        } else {
            res.status(404).json({
                message: "Pengguna tidak ditemukan",
                status: "failed",
            });
        }
    } catch (error) {
        handleControllerError(res, error);
    }
};
