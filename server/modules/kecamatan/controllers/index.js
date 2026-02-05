// const Model_r = require("../models/model_r");
// const Model_cud = require("../models/model_cud");
// const { handleValidationErrors, handleServerError } = require("../../../helper/handleError");

// const controllers = {};

// controllers.daftar_kecamatan = async (req, res) => {
//   if (!(await handleValidationErrors(req, res))) return;

//   try {
//     const model_r = new Model_r(req);
//     const feedBack = await model_r.Kecamatan();

//     res.status(200).json({
//       error: false,
//       data: feedBack.data,
//       total: feedBack.total,
//     });
//   } catch (error) {
//     handleServerError(res, error);
//   }
// };

// controllers.add = async (req, res) => {
//   if (!(await handleValidationErrors(req, res))) return;

//   try {
//     const model_cud = new Model_cud(req);
//     await model_cud.add();

//     if (await model_cud.response()) {
//       res.status(200).json({
//         error: false,
//         error_msg: 'kecamatan berhasil ditambahkan.',
//       });
//     } else {
//       res.status(400).json({
//         error: true,
//         error_msg: 'kecamatan gagal ditambahkan.',
//       });
//     }
//   } catch (error) {
//     handleServerError(res, error);
//   }
// };

// controllers.get_info_edit_kecamatan = async (req, res) => {
//   if (!(await handleValidationErrors(req, res))) return;

//   try {
//     const model_r = new Model_r(req);
//     const feedBack = await model_r.get_info_edit_kecamatan();

//     res.status(200).json({
//       error: false,
//       data: feedBack,
//       total: 1
//     });
//   } catch (error) {
//     handleServerError(res, error);
//   }
// };

// controllers.edit = async (req, res) => {
//   if (!(await handleValidationErrors(req, res))) return;

//   try {
//     const model_cud = new Model_cud(req);
//     await model_cud.edit();

//     if (await model_cud.response()) {
//       res.status(200).json({
//         error: false,
//         error_msg: 'kecamatan berhasil diperbaharui.',
//       });
//     } else {
//       res.status(400).json({
//         error: true,
//         error_msg: 'kecamatan gagal diperbaharui.',
//       });
//     }
//   } catch (error) {
//     handleServerError(res, error);
//   }
// };

// controllers.delete = async (req, res) => {
//   if (!(await handleValidationErrors(req, res))) return;

//   try {
//     const model_cud = new Model_cud(req);
//     await model_cud.delete();

//     if (await model_cud.response()) {
//       res.status(200).json({
//         error: false,
//         error_msg: 'kecamatan berhasil dihapus.',
//       });
//     } else {
//       res.status(400).json({
//         error: true,
//         error_msg: 'kecamatan gagal dihapus.',
//       });
//     }
//   } catch (error) {
//     handleServerError(res, error);
//   }
// };

// module.exports = controllers;

const Model_r = require("../models/model_r");
const Model_cud = require("../models/model_cud");
const {
  handleValidationErrors,
  handleServerError,
} = require("../../../helper/handleError");

const controllers = {};

controllers.list_kecamatan = async (req, res) => {
  try {
    const model_r = new Model_r(req);
    const feedBack = await model_r.list_kecamatan();

    res.status(200).json({
      error: false,
      data: feedBack.data,
    });
  } catch (error) {
    handleServerError(res, error);
  }
};

controllers.list_desa = async (req, res) => {
  if (!(await handleValidationErrors(req, res))) return;

  try {
    const model_r = new Model_r(req);
    const feedBack = await model_r.list_desa();

    res.status(200).json({
      error: false,
      data: feedBack.data,
    });
  } catch (error) {
    handleServerError(res, error);
  }
};

controllers.daftar_kecamatan = async (req, res) => {
  if (!(await handleValidationErrors(req, res))) return;

  try {
    const model_r = new Model_r(req);
    const feedBack = await model_r.Kecamatan();

    res.status(200).json({
      error: false,
      data: feedBack.data,
      total: feedBack.total,
    });
  } catch (error) {
    handleServerError(res, error);
  }
};

controllers.add = async (req, res) => {
  if (!(await handleValidationErrors(req, res))) return;

  try {
    const model_cud = new Model_cud(req);
    await model_cud.add();

    const result = await model_cud.response();
    if (result.success) {
      res.status(200).json({
        error: false,
        error_msg: "Kecamatan berhasil ditambahkan.",
      });
    } else {
      res.status(400).json({
        error: true,
        error_msg: result.message || "Kecamatan gagal ditambahkan.",
      });
    }
  } catch (error) {
    handleServerError(res, error);
  }
};

controllers.get_info_edit_kecamatan = async (req, res) => {
  if (!(await handleValidationErrors(req, res))) return;

  try {
    const model_r = new Model_r(req);
    const feedBack = await model_r.get_info_edit_kecamatan();

    res.status(200).json({
      error: false,
      data: feedBack,
      total: 1,
    });
  } catch (error) {
    handleServerError(res, error);
  }
};

controllers.edit = async (req, res) => {
  if (!(await handleValidationErrors(req, res))) return;

  try {
    const model_cud = new Model_cud(req);
    await model_cud.update(); // Gunakan method update, bukan edit

    const result = await model_cud.response();
    if (result.success) {
      res.status(200).json({
        error: false,
        error_msg: "Kecamatan berhasil diperbaharui.",
      });
    } else {
      res.status(400).json({
        error: true,
        error_msg: result.message || "Kecamatan gagal diperbaharui.",
      });
    }
  } catch (error) {
    handleServerError(res, error);
  }
};

controllers.delete = async (req, res) => {
  if (!(await handleValidationErrors(req, res))) return;

  try {
    const model_cud = new Model_cud(req);
    await model_cud.delete();

    const result = await model_cud.response();
    if (result.success) {
      res.status(200).json({
        error: false,
        error_msg: "Kecamatan berhasil dihapus.",
      });
    } else {
      res.status(400).json({
        error: true,
        error_msg: result.message || "Kecamatan gagal dihapus.",
      });
    }
  } catch (error) {
    handleServerError(res, error);
  }
};

module.exports = controllers;
