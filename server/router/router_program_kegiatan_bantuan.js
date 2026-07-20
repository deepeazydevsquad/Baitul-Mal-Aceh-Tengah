const express = require("express");
const { body } = require("express-validator");
const controllers = require("../modules/program_kegiatan_bantuan/controllers/index");
const validation = require("../validation/program_kegiatan_bantuan");
const {
  authenticateTokenAdministrator,
} = require("../middleware/authenticateToken");
const validationHelper = require("../helper/handleErrorFile");

const router = express.Router();

router.get(
  "/program_kegiatan_bantuan/get_filter_type",
  authenticateTokenAdministrator,
  controllers.get_filter_type
);

router.get(
  "/program_kegiatan_bantuan/daftar_kecamatan",
  authenticateTokenAdministrator,
  controllers.daftar_kecamatan
);

router.get(
  "/program_kegiatan_bantuan/daftar_desa",
  authenticateTokenAdministrator,
  controllers.daftar_desa
);

router.post(
  "/program_kegiatan_bantuan/list",
  authenticateTokenAdministrator,
  [
    body("perpage")
      .notEmpty()
      .withMessage("Perpage Tidak Boleh Kosong")
      .isInt()
      .withMessage("Perpage Harus Angka"),
    body("pageNumber")
      .notEmpty()
      .withMessage("Page Number Tidak Boleh Kosong")
      .isInt()
      .withMessage("Page Number Harus Angka"),
    body("search").optional().isString().withMessage("Search Harus String"),
    body("type_status_kegiatan").optional(),
    body("type_asnaf_id").optional(),
    body("type_program_id").optional(),
    body("type_year").optional(),
  ],
  controllers.daftar_list
);

router.post(
  "/program_kegiatan_bantuan/add",
  authenticateTokenAdministrator,
  validation.upload.single("banner"),
  validation.check_dimensions(false),
  [
    body("asnaf_id")
      .if(body("sumber_dana").equals("zakat")) // hanya wajib kalau sumber_dana = zakat
      .notEmpty()
      .withMessage("Asnaf Tidak Boleh Kosong")
      .isInt()
      .withMessage("Asnaf Harus Angka"),
    body("program_id")
      .notEmpty()
      .withMessage("Program Tidak Boleh Kosong")
      .isInt()
      .withMessage("Program Harus Angka"),
    body("nama_kegiatan")
      .notEmpty()
      .withMessage("Name Tidak Boleh Kosong")
      .isString()
      .withMessage("Name Harus String"),
    body("status_tampil")
      .optional()
      .isIn(["true", "false"])
      .withMessage("Status Tampil Harus diantara Tampil dan Tidak Tampil"),
    body("jumlah_dana")
      .notEmpty()
      .withMessage("Jumlah Dana Tidak Boleh Kosong")
      .isInt()
      .withMessage("Jumlah Dana Harus Angka"),
    body("jumlah_maksimal_nominal_bantuan")
      .notEmpty()
      .withMessage("Jumlah Maksimal Nominal Bantuan Tidak Boleh Kosong")
      .isInt()
      .withMessage("Jumlah Maksimal Nominal Bantuan Harus Angka"),
    body("jumlah_target_penerima")
      .optional()
      .isInt()
      .withMessage("Jumlah Target Penerima Harus Angka"),
    body("sumber_dana")
      .notEmpty()
      .withMessage("Sumber Dana Tidak Boleh Kosong")
      .isIn(["infaq", "zakat"])
      .withMessage("Sumber Dana Harus Infaq atau Zakat"),
    body("area_penyaluran")
      .notEmpty()
      .withMessage("Area Penyaluran Tidak Boleh Kosong")
      .isIn(["semua_pemohon", "kabupaten", "instansi", "kecamatan", "desa"])
      .withMessage(
        "Area Penyaluran Harus diantara Semua Pemohon, Kabupaten, Instansi, Kecamatan, atau Desa"
      ),
    body("desa_penyaluran").optional(),
    body("kecamatan_penyaluran").optional(),
    body("jenis_penyaluran")
      .notEmpty()
      .withMessage("Jenis Penyaluran Tidak Boleh Kosong")
      .isIn(["langsung", "volume"])
      .withMessage("Jenis Penyaluran Harus Langsung atau Volume"),
    body("tahun")
      .notEmpty()
      .withMessage("Tahun Tidak Boleh Kosong")
      .isInt()
      .withMessage("Tahun Harus Angka"),
    body("start_date")
      .optional()
      .isString()
      .withMessage("Start Date Harus Date"),
    body("end_date").optional().isString().withMessage("End Date Harus Date"),
    body("name").optional(),
    body("desc").optional(),
  ],
  validation.check_start_end_date,
  validationHelper.handleFileErrors,
  controllers.add
);

router.post(
  "/program_kegiatan_bantuan/get_info_edit_status_program_bantuan",
  authenticateTokenAdministrator,
  [
    body("id")
      .notEmpty()
      .withMessage("ID Tidak Boleh Kosong")
      .isInt()
      .withMessage("ID Harus Angka")
      .custom(validation.check_id_program_kegiatan_bantuan),
  ],
  controllers.get_edit_status_program_bantuan
);

router.post(
  "/program_kegiatan_bantuan/edit_status_program_bantuan",
  authenticateTokenAdministrator,
  [
    body("id")
      .notEmpty()
      .withMessage("ID Tidak Boleh Kosong")
      .isInt()
      .withMessage("ID Harus Angka")
      .custom(validation.check_id_program_kegiatan_bantuan),
  ],
  controllers.edit_status_program_bantuan
);

router.post(
  "/program_kegiatan_bantuan/get_info_edit_program_bantuan",
  authenticateTokenAdministrator,
  [
    body("id")
      .notEmpty()
      .withMessage("ID Tidak Boleh Kosong")
      .isInt()
      .withMessage("ID Harus Angka")
      .custom(validation.check_id_program_kegiatan_bantuan),
  ],
  controllers.get_info_edit_program_kegiatan_bantuan
);

router.post(
  "/program_kegiatan_bantuan/edit",
  authenticateTokenAdministrator,
  validation.upload.single("banner"),
  validation.check_dimensions(false),
  [
    body("id")
      .notEmpty()
      .withMessage("ID Tidak Boleh Kosong")
      .isInt()
      .withMessage("ID Harus Angka")
      .custom(validation.check_id_program_kegiatan_bantuan),
    body("asnaf_id")
      .if(body("sumber_dana").equals("zakat")) // hanya wajib kalau sumber_dana = zakat
      .notEmpty()
      .withMessage("Asnaf Tidak Boleh Kosong")
      .isInt()
      .withMessage("Asnaf Harus Angka"),
    body("program_id")
      .notEmpty()
      .withMessage("Program Tidak Boleh Kosong")
      .isInt()
      .withMessage("Program Harus Angka"),
    body("nama_kegiatan")
      .notEmpty()
      .withMessage("Name Tidak Boleh Kosong")
      .isString()
      .withMessage("Name Harus String"),
    body("status_tampil")
      .optional()
      .isBoolean()
      .withMessage("Status Tampil Harus diantara Tampil dan Tidak Tampil"),
    body("jumlah_dana")
      .notEmpty()
      .withMessage("Jumlah Dana Tidak Boleh Kosong")
      .isInt()
      .withMessage("Jumlah Dana Harus Angka"),
    body("jumlah_maksimal_nominal_bantuan")
      .notEmpty()
      .withMessage("Jumlah Maksimal Nominal Bantuan Tidak Boleh Kosong")
      .isInt()
      .withMessage("Jumlah Maksimal Nominal Bantuan Harus Angka"),
    body("jumlah_target_penerima")
      .optional()
      .isInt()
      .withMessage("Jumlah Target Penerima Harus Angka"),
    body("sumber_dana")
      .notEmpty()
      .withMessage("Sumber Dana Tidak Boleh Kosong")
      .isIn(["infaq", "zakat"])
      .withMessage("Sumber Dana Harus Infaq atau Zakat"),
    body("area_penyaluran")
      .notEmpty()
      .withMessage("Area Penyaluran Tidak Boleh Kosong")
      .isIn(["semua_pemohon", "kabupaten", "instansi", "kecamatan", "desa"])
      .withMessage(
        "Area Penyaluran Harus diantara Semua Pemohon, Kabupaten, Instansi, Kecamatan, atau Desa"
      ),
    body("jenis_penyaluran")
      .notEmpty()
      .withMessage("Jenis Penyaluran Tidak Boleh Kosong")
      .isIn(["langsung", "volume"])
      .withMessage("Jenis Penyaluran Harus Langsung atau Volume"),
    body("tahun")
      .notEmpty()
      .withMessage("Tahun Tidak Boleh Kosong")
      .isInt()
      .withMessage("Tahun Harus Angka"),
    body("start_date")
      .optional()
      .isString()
      .withMessage("Start Date Harus Date"),
    body("end_date").optional().isString().withMessage("End Date Harus Date"),
    body("name").optional(),
    body("desc").optional(),
  ],
  validation.check_start_end_date,
  validationHelper.handleFileErrors,
  controllers.edit
);

router.post(
  "/program_kegiatan_bantuan/delete",
  authenticateTokenAdministrator,
  [
    body("id")
      .notEmpty()
      .withMessage("ID Tidak Boleh Kosong")
      .isInt()
      .withMessage("ID Harus Angka")
      .custom(validation.check_id_program_kegiatan_bantuan),
  ],
  controllers.delete
);

module.exports = router;
