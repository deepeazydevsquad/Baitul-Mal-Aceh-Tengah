const { sequelize, Permohonan, Survey_permohonan } = require("../../../models");
const Model_r = require("../models/model_r");
const fs = require("fs");
const path = require("path");
const moment = require("moment");
const { raw } = require("body-parser");

class Model_cud {
  constructor(req) {
    this.req = req;
  }

  async initialize() {
    this.t = await sequelize.transaction();
    this.state = true;
  }

  async submit() {
    await this.initialize();
    const myDate = moment().format("YYYY-MM-DD HH:mm:ss");
    const body = this.req.body;
    const uploaded = body.uploaded_files || {};

    try {
      // === 1. Ambil surveyor_kegiatan_id dari access_code ===
      const model_r = new Model_r(this.req);
      const surveyorKegiatan = await model_r.info_survey_kegiatan(
        body.access_code
      );

      // === 2. Cari permohonan_id berdasarkan kegiatan_id dan member_id ===
      const permohonan = await Permohonan.findOne({
        where: {
          kegiatan_id: surveyorKegiatan.kegiatan_id,
          member_id: body.member_id,
        },
        attributes: ["id", "member_id", "kegiatan_id"],
        raw: true,
        nest: true,
      });

      console.log("Permohonan ditemukan:", {
        permohonan_id: permohonan.id,
        member_id: permohonan.member_id,
        kegiatan_id: permohonan.kegiatan_id,
      });

      // === 3. Prepare file paths ===
      const form_survey = uploaded.form_survey || null;
      const berita_acara = uploaded.berita_acara || null;
      const dokumentasi = Array.isArray(uploaded.dokumentasi)
        ? JSON.stringify(uploaded.dokumentasi)
        : null;

      console.log("Upload info:", {
        form_survey,
        berita_acara,
        dokumentasi_count: uploaded.dokumentasi?.length || 0,
      });

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

      console.log("Survey berhasil disimpan:", {
        id: surveyPermohonan.id,
        permohonan_id: surveyPermohonan.permohonan_id,
        status: surveyPermohonan.status,
      });
    } catch (error) {
      this.state = false;
      console.error("Error in submit method:", error.message);
      this.cleanupUploadedFiles(uploaded);
      throw error;
    }
  }

  // Helper: Cleanup uploaded files
  cleanupUploadedFiles(uploaded) {
    const uploadedFiles = [
      ...(uploaded.dokumentasi || []),
      uploaded.form_survey,
      uploaded.berita_acara,
    ].filter(Boolean);

    const folderPath = path.join(
      __dirname,
      "../../../uploads/dokumen/survey_lapangan"
    );

    uploadedFiles.forEach((filename) => {
      const filePath = path.join(folderPath, filename);
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log("Deleted file:", filename);
        }
      } catch (err) {
        console.error("Error deleting file:", filename, err.message);
      }
    });
  }

  async response() {
    if (this.state) {
      await this.t.commit();
      return true;
    } else {
      await this.t.rollback();
      return false;
    }
  }
}

module.exports = Model_cud;
