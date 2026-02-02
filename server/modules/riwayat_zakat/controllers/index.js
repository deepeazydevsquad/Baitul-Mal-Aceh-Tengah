const Model_r = require("../models/model_r");
const Model_cud = require("../models/model_cud");
const {
  handleValidationErrors,
  handleServerError,
} = require("../../../helper/handleError");

const controllers = {};

controllers.list_desa = async (req, res) => {
  try {
    const model = new Model_r(req);
    const data = await model.list_desa();
    res.status(200).json({
      error: false,
      data,
    });
  } catch (error) {
    return handleServerError(res, error); // kasih full error object
  }
};

controllers.list_kecamatan = async (req, res) => {
  try {
    const model = new Model_r(req);
    const data = await model.list_kecamatan();
    res.status(200).json({
      error: false,
      data,
    });
  } catch (error) {
    return handleServerError(res, error); // kasih full error object
  }
};

controllers.list_member = async (req, res) => {
  try {
    const model = new Model_r(req);
    const feedBack = await model.list_member();
    res.status(200).json({
      error: false,
      data: feedBack.data,
      total: feedBack.total,
    });
  } catch (error) {
    return handleServerError(res, error); // kasih full error object
  }
};

// list agen
controllers.list = async (req, res) => {
  if (!(await handleValidationErrors(req, res))) return;

  try {
    const model = new Model_r(req);
    const feedBack = await model.list_riwayat_zakat();
    res.status(200).json({
      error: false,
      data: feedBack.data,
      total: feedBack.total,
    });
  } catch (error) {
    return handleServerError(res, error); // kasih full error object
  }
};

controllers.add = async (req, res) => {
  if (!(await handleValidationErrors(req, res))) return;

  try {
    const model_r = new Model_r(req);
    const model_cud = new Model_cud(req);
    const invoice = await model_r.gen_invoice();
    await model_cud.add(invoice);

    if (await model_cud.response()) {
      res.status(200).json({
        error: false,
        error_msg: "Riwayat zakat berhasil ditambahkan.",
      });
    } else {
      res.status(400).json({
        error: true,
        error_msg: "Riwayat Zakat gagal ditambahkan.",
      });
    }
  } catch (error) {
    handleServerError(res, error);
  }
};

controllers.approve_online = async (req, res) => {
  if (!(await handleValidationErrors(req, res))) return;
  try {
    const model_cud = new Model_cud(req);
    await model_cud.approve_online();
    if (await model_cud.response()) {
      res.status(200).json({
        error: false,
        error_msg: "Pembayaran zakat online berhasil disetujui.",
      });
    } else {
      res.status(400).json({
        error: true,
        error_msg: "Gagal menyetujui pembayaran zakat online.",
      });
    }
  } catch (error) {
    handleServerError(res, error);
  }
};

controllers.reject_online = async (req, res) => {
  if (!(await handleValidationErrors(req, res))) return;
  try {
    const model_cud = new Model_cud(req);
    await model_cud.reject_online();
    if (await model_cud.response()) {
      res.status(200).json({
        error: false,
        error_msg: "Pembayaran zakat online berhasil ditolak.",
      });
    } else {
      res.status(400).json({
        error: true,
        error_msg: "Gagal menolak pembayaran zakat online.",
      });
    }
  } catch (error) {
    handleServerError(res, error);
  }
};

// DELETE
controllers.delete = async (req, res) => {
  if (!(await handleValidationErrors(req, res))) return;

  try {
    const model_cud = new Model_cud(req);
    await model_cud.delete();

    if (await model_cud.response()) {
      res.status(200).json({
        error: false,
        error_msg: "Riwayat zakat berhasil dihapus.",
      });
    } else {
      res.status(400).json({
        error: true,
        error_msg: "Riwayat Zakat gagal dihapus.",
      });
    }
  } catch (error) {
    handleServerError(res, error);
  }
};

controllers.upload_bukti_transfer = async (req, res) => {
  if (!(await handleValidationErrors(req, res))) return;

  try {
    const model_cud = new Model_cud(req);
    await model_cud.upload_bukti_transfer();

    if (await model_cud.response()) {
      res.status(200).json({
        error: false,
        error_msg: "Bukti transfer berhasil diupload.",
      });
    } else {
      res.status(400).json({
        error: true,
        error_msg: "Bukti transfer gagal diupload.",
      });
    }
  } catch (error) {
    console.log("=======error");
    console.log(error);
    console.log("=======error");
    handleServerError(res, error);
  }
};

controllers.upload_bukti_setoran = async (req, res) => {
  if (!(await handleValidationErrors(req, res))) return;

  try {
    const model_cud = new Model_cud(req);
    await model_cud.upload_bukti_setoran();

    if (await model_cud.response()) {
      res.status(200).json({
        error: false,
        error_msg: "Bukti setoran berhasil diupload.",
      });
    } else {
      res.status(400).json({
        error: true,
        error_msg: "Bukti setoran gagal diupload.",
      });
    }
  } catch (error) {
    console.log("=======error");
    console.log(error);
    console.log("=======error");
    handleServerError(res, error);
  }
};

controllers.info_bukti_setoran = async (req, res) => {
  if (!(await handleValidationErrors(req, res))) return;

  try {
    const model = new Model_r(req);
    const feedBack = await model.info_bukti_setoran();
    res.status(200).json({
      error: false,
      data: feedBack,
      total: 1,
    });
  } catch (error) {
    console.log("=======error");
    console.log(error);
    console.log("=======error");
    return handleServerError(res, error); // kasih full error object
  }
};

module.exports = controllers;
