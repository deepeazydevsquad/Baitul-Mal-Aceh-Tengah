const express = require("express");
const { body } = require("express-validator");
const controllers = require("../modules/laporan_kesekretariatan/controllers/index");

const {
  authenticateTokenAdministrator,
} = require("../middleware/authenticateToken");

const router = express.Router();



router.get(
  "/laporan_kesekretariatan/list",
  authenticateTokenAdministrator,
  controllers.kegiatan_kesekretariatan
)

router.get(
  "/download_excel_laporan_kesekretariatan/list",
  authenticateTokenAdministrator,
  controllers.download_excel_laporan_penyaluran
)

router.get(
  "/tanda_tangan/list",
  controllers.tanda_tangan
)
module.exports = router
