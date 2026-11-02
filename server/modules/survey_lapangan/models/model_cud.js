const {
  sequelize,
  Permohonan,
  Survey_permohonan,
  Realisasi_permohonan,
} = require("../../../models");
const Model_r = require("../models/model_r");
const moment = require("moment");
const {
  collectSurveyUploads,
  removeUploadedFiles,
  SURVEY_UPLOAD_DIRECTORY,
} = require("../../../helper/uploadedFileHelper");

class Model_cud {
  constructor(req) {
    this.req = req;
    this.t = null;
    this.transactionClosed = false;
    this.state = false;
    this.message = null;
    this.errorCode = "SURVEY_NOT_SAVED";
    this.statusCode = 400;
    this.cleanupDone = false;
    this.uploadDirectory = SURVEY_UPLOAD_DIRECTORY;
  }

  async initialize() {
    this.t = await sequelize.transaction();
    this.transactionClosed = false;
    this.state = true;
  }

  async submit() {
    const body = this.req.body || {};
    const capabilityId = Number(this.req.surveyCapability?.id);
    const uploads = collectSurveyUploads(
      this.req.files,
      this.uploadDirectory
    );

    if (!uploads.valid) {
      this.state = false;
      this.message = "Metadata unggahan tidak valid.";
      this.errorCode = "INVALID_UPLOAD_METADATA";
      this.cleanupNewUploads();
      return false;
    }
    if (!Number.isInteger(capabilityId) || capabilityId <= 0) {
      this.state = false;
      this.message = "Capability survei tidak valid.";
      this.errorCode = "INVALID_SURVEY_CAPABILITY";
      this.statusCode = 403;
      this.cleanupNewUploads();
      return false;
    }

    try {
      await this.initialize();
      const myDate = moment().format("YYYY-MM-DD HH:mm:ss");

      // === 1. Gunakan identitas capability yang sudah diverifikasi ===
      const model_r = new Model_r(this.req);
      const surveyorKegiatan = await model_r.info_survey_kegiatan(
        capabilityId
      );
      if (!surveyorKegiatan || Number(surveyorKegiatan.id) !== capabilityId) {
        throw new Error("Data survei tidak ditemukan.");
      }

      // === 2. Cari permohonan_id berdasarkan kegiatan_id dan member_id ===
      const permohonanPointer = await Permohonan.findOne({
        where: {
          kegiatan_id: surveyorKegiatan.kegiatan_id,
          member_id: body.member_id,
        },
        attributes: ["id", "member_id", "kegiatan_id"],
        transaction: this.t,
        raw: true,
        nest: true,
      });

      if (!permohonanPointer) {
        throw new Error("Data survei tidak ditemukan.");
      }
      const permohonan = await Permohonan.findByPk(permohonanPointer.id, {
        transaction: this.t,
        lock: this.t.LOCK.UPDATE,
      });
      if (
        !permohonan ||
        permohonan.status !== "sedang_berlangsung"
      ) {
        throw new Error(
          "Permohonan sudah tidak aktif dan tidak dapat disurvei."
        );
      }

      const eligibleRealisasi = await Realisasi_permohonan.findOne({
        where: {
          permohonan_id: permohonan.id,
          status: "process_lapangan",
        },
        attributes: ["id"],
        transaction: this.t,
        lock: this.t.LOCK.UPDATE,
      });
      if (!eligibleRealisasi) {
        throw new Error("Permohonan tidak berada pada tahap survei.");
      }

      const existingSurvey = await Survey_permohonan.findOne({
        where: {
          surveyor_kegiatan_id: surveyorKegiatan.id,
          permohonan_id: permohonan.id,
        },
        attributes: ["id"],
        transaction: this.t,
        lock: this.t.LOCK.UPDATE,
      });
      if (existingSurvey) {
        throw new Error("Member ini sudah pernah disurvey dalam kegiatan ini.");
      }

      // === 3. Prepare file paths ===
      const form_survey = uploads.form_survey;
      const berita_acara = uploads.berita_acara;
      const dokumentasi =
        uploads.dokumentasi.length > 0
          ? JSON.stringify(uploads.dokumentasi)
          : null;

      // === 4. Normalize data untuk disimpan ===
      const normalizeValue = (value) => {
        if (!value) return null;
        return value.toString().toLowerCase();
      };

      const normalizeYesNo = (value) => {
        if (!value) return "tidak";
        const normalized = value.toString().toLowerCase();
        return normalized === "iya" ? "iya" : "tidak";
      };

      // === 5. Insert data ke Survey_permohonan ===
      const surveyData = {
        surveyor_kegiatan_id: surveyorKegiatan.id,
        permohonan_id: permohonan.id,
        status: normalizeValue(body.status),
        kesimpulan: body.kesimpulan,
        form_survey,
        berita_acara,
        dokumentasi,

        // Data Responden
        tanggal_penilaian: body.tanggal_penilaian,
        nomor_ktp: body.nomor_ktp,
        tempat_lahir: body.tempat_lahir,
        tanggal_lahir: body.tanggal_lahir,
        nama_suami_istri: body.nama_suami_istri,
        pekerjaan_suami_istri: body.pekerjaan_suami_istri,
        jumlah_tanggungan_suami_istri: parseInt(body.jumlah_tanggungan) || 0,
        alamat: body.alamat,

        // Pertanyaan Saringan
        jenis_kelamin: normalizeValue(body.jenis_kelamin),
        status_pernikahan: normalizeValue(body.status_pernikahan),
        usia_25_60: normalizeYesNo(body.usia_25_60),
        penduduk_tetap: normalizeYesNo(body.penduduk_tetap),
        penghasilan_2jt: normalizeYesNo(body.penghasilan_kepala_keluarga),

        // Kondisi Peserta & Rumah
        kondisi_fisik: normalizeValue(body.kondisi_fisik),
        atap: normalizeValue(body.atap),
        rangka_rumah: normalizeValue(body.rangka_rumah),
        dinding_rumah: normalizeValue(body.dinding_rumah),
        lantai: normalizeValue(body.lantai),
        mck: normalizeValue(body.mck),
        luas_rumah: normalizeValue(body.luas_rumah),
        aset: normalizeValue(body.aset),
        kendaraan: normalizeValue(body.kendaraan),

        // Keterangan
        keterangan_kondisi_calon: body.keterangan_kondisi_calon,
        keterangan_pilih_mustahik: body.keterangan_pilih_mustahik,

        createdAt: myDate,
        updatedAt: myDate,
      };

      const surveyPermohonan = await Survey_permohonan.create(surveyData, {
        transaction: this.t,
      });
      if (!surveyPermohonan) {
        throw new Error("Survey gagal disimpan.");
      }

      this.state = true;
      return true;
    } catch (error) {
      this.state = false;
      this.message = "Survey gagal disimpan.";
      this.errorCode = "SURVEY_NOT_SAVED";
      if (await this.rollbackTransaction()) {
        this.cleanupNewUploads();
      } else {
        this.message =
          "Status penyimpanan survei belum pasti. Periksa data sebelum mengunggah ulang.";
        this.errorCode = "SURVEY_ROLLBACK_UNCERTAIN";
        this.statusCode = 503;
      }
      return false;
    }
  }

  cleanupNewUploads() {
    if (this.cleanupDone) return;
    this.cleanupDone = true;
    removeUploadedFiles(this.req.files, this.uploadDirectory);
  }

  async rollbackTransaction() {
    if (!this.t) return true;
    if (this.t.finished === "commit") return false;
    if (this.t.finished === "rollback") {
      this.transactionClosed = true;
      return true;
    }
    if (this.transactionClosed) return false;

    this.transactionClosed = true;
    try {
      await this.t.rollback();
      return true;
    } catch {
      return false;
    }
  }

  async response() {
    if (!this.state) {
      await this.rollbackTransaction();
      return false;
    }

    try {
      await this.t.commit();
      this.transactionClosed = true;
      return true;
    } catch {
      this.state = false;
      // Sequelize marks a failed COMMIT as finished with state "commit".
      // The database may have committed before the connection failed, so
      // files must remain until a later reconciliation proves otherwise.
      this.transactionClosed = true;
      this.message =
        "Status penyimpanan survei belum pasti. Periksa data sebelum mengunggah ulang.";
      this.errorCode = "SURVEY_COMMIT_UNCERTAIN";
      this.statusCode = 503;
      return false;
    }
  }
}

module.exports = Model_cud;
