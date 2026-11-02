const express = require("express");
const { body } = require("express-validator");
const controllers = require("../modules/laporan_asnaf/controllers/index");

const {
  authenticateTokenAdministrator,
} = require("../middleware/authenticateToken");

const router = express.Router();

router.get(
  "/asnaf_tahun/list",
  authenticateTokenAdministrator,
  controllers.get_tahun
)
router.get(
  "/fn_asnaf/list",
  authenticateTokenAdministrator,
  controllers.fn_asnaf
)

router.get(
  "/fn_asnaf_amil/list",
  authenticateTokenAdministrator,
  controllers.fn_asnaf_amil
)

router.get(
  "/info_laporan_umum/list",
  authenticateTokenAdministrator,
  controllers.info
)

router.get(
  "/download_excel_laporan_penyaluran/list",
  authenticateTokenAdministrator,
  controllers.download_excel_laporan_penyaluran
)

router.get(
  "/download_excel_laporan_all_penyaluran",
  authenticateTokenAdministrator,
  controllers.download_excel_laporan_all_penyaluran
)

router.get(
  "/download_excel_laporan_rekap_penyaluran_per_asnaf",
  authenticateTokenAdministrator,
  controllers.download_excel_laporan_rekap_penyaluran_per_asnaf
)

router.get(
  "/download_excel_laporan_rekap_penyaluran_per_kode_asnaf",
  authenticateTokenAdministrator,
  controllers.download_excel_laporan_rekap_penyaluran_per_kode_asnaf
)

router.get(
  "/download_excel_laporan_rekap_penyaluran_per_kecamatan",
  authenticateTokenAdministrator,
  controllers.download_excel_laporan_rekap_penyaluran_per_kecamatan
)

router.get(
  "/tanda_tangan/list",
  authenticateTokenAdministrator,
  controllers.tanda_tangan
)
module.exports = router
