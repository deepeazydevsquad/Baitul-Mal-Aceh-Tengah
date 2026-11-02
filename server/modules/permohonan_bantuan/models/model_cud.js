const {
  Op,
  sequelize,
  Bank,
  Kegiatan,
  Realisasi_permohonan,
  Permohonan,
  Validasi_syarat_permohonan,
} = require("../../../models");
const Model_r = require("../models/model_r");
const { writeLog } = require("../../../helper/writeLogHelper");
const path = require("path");
const moment = require("moment");
const {
  removeStoredFile,
  resolveStoredPath,
} = require("../../../helper/uploadStorageHelper");
const {
  buildMonthlyPeriodKey,
} = require("../../../helper/monthlyPeriodHelper");
const {
  queueStoredFileCleanup,
} = require("../../../helper/documentCleanupHelper");

const DOCUMENT_DIRECTORY = path.resolve(
  __dirname,
  "../../../uploads/dokumen/permohonan_bantuan"
);
const DOCUMENT_EXTENSIONS = new Set([".pdf", ".png", ".jpg", ".jpeg"]);

class Model_cud {
  constructor(req) {
    this.req = req;
    this.t = null;
    this.state = false;
    this.message = "";
    this.statusCode = 400;
    this.errorCode = "PERMOHONAN_EDIT_FAILED";
    this.transactionOutcome = "not_started";
    this.cleanupDone = false;
  }

  async initialize() {
    this.t = await sequelize.transaction();
    this.transactionOutcome = "pending";
    this.state = true;
  }

  fail(error, statusCode = 500, errorCode = this.errorCode) {
    this.state = false;
    this.message = error?.message || String(error);
    this.statusCode = error?.statusCode || statusCode;
    this.errorCode = error?.code || errorCode;
  }

  async lockRealisasi(id) {
    const pointer = await Realisasi_permohonan.findOne({
      where: { id },
      attributes: ["id", "permohonan_id"],
      transaction: this.t,
      raw: true,
    });
    if (!pointer) {
      const error = new Error("Realisasi tidak ditemukan.");
      error.statusCode = 404;
      throw error;
    }
    const permohonan = await Permohonan.findByPk(pointer.permohonan_id, {
      transaction: this.t,
      lock: this.t.LOCK.UPDATE,
    });
    const realisasi = await Realisasi_permohonan.findByPk(id, {
      transaction: this.t,
      lock: this.t.LOCK.UPDATE,
    });
    if (!permohonan || !realisasi) {
      const error = new Error("Permohonan tidak lengkap.");
      error.statusCode = 409;
      throw error;
    }
    return { permohonan, realisasi };
  }

  getUploadedDocuments() {
    const uploads = Array.isArray(this.req.adminPermohonanUploads)
      ? this.req.adminPermohonanUploads
      : [];
    return uploads.map((file) => {
      if (
        !resolveStoredPath(DOCUMENT_DIRECTORY, file?.path, {
          allowedExtensions: DOCUMENT_EXTENSIONS,
        })
      ) {
        throw new Error("Referensi dokumen tidak valid.");
      }
      return {
        basename: String(file.file_name || ""),
        path: file.path,
      };
    });
  }

  getSafeDocumentPath(filename) {
    return resolveStoredPath(DOCUMENT_DIRECTORY, filename, {
      allowedExtensions: DOCUMENT_EXTENSIONS,
    });
  }

  async queueDocumentRemoval(filename, reason) {
    if (!filename) return;
    await queueStoredFileCleanup(
      DOCUMENT_DIRECTORY,
      filename,
      reason,
      this.t
    );
  }

  removeUploadedDocuments() {
    for (const file of this.req.adminPermohonanUploads || []) {
      removeStoredFile(DOCUMENT_DIRECTORY, file?.path, {
        allowedExtensions: DOCUMENT_EXTENSIONS,
      });
    }
  }

  async sisaBulanTahunIni() {
    const bulanSekarang = moment().month() + 1; // month() is zero-based
    const bulans = Array.from(
      { length: 12 - bulanSekarang + 1 },
      (v, k) => k + bulanSekarang
    );
    return bulans;
  }

  async add() {
    const body = this.req.body;

    try {
      await this.initialize();
      const myDate = new Date();
      const bulanSekarang = moment().month() + 1; // 1-12
      const arr_filepath = this.getUploadedDocuments();
      const model_r = new Model_r(this.req);
      const info_kegiatan = await Kegiatan.findByPk(body.kegiatan_id, {
        transaction: this.t,
        lock: this.t.LOCK.UPDATE,
      });
      if (!info_kegiatan) {
        const error = new Error("Kegiatan tidak ditemukan.");
        error.statusCode = 404;
        throw error;
      }
      const info_member = await model_r.info_member(body.member_id);

      // ================= BULANAN =================
      if (info_kegiatan.periode_bantuan === "bulanan") {
        console.log(
          "================ Processing BULANAN (1 realisasi saja) ================="
        );

        // 1. Insert 1 permohonan saja
        const permohonan = await Permohonan.create(
          {
            member_id: body.member_id,
            kegiatan_id: body.kegiatan_id,
            bank_id: body.bank_id,
            nomor_akun_bank: body.nomor_rekening,
            nama_akun_bank: body.atas_nama,
            status: "sedang_berlangsung",
            createdAt: myDate,
            updatedAt: myDate,
          },
          { transaction: this.t }
        );

        // 2. Insert 1 realisasi dengan bulan sekarang dan status process_lapangan
        const realisasi = await Realisasi_permohonan.create(
          {
            permohonan_id: permohonan.id,
            status: "process_lapangan",
            status_realisasi: "belum_direalisasi",
            bulan: bulanSekarang,
            periode_key: buildMonthlyPeriodKey(
              body.member_id,
              body.kegiatan_id,
              info_kegiatan.tahun,
              bulanSekarang
            ),
            createdAt: myDate,
            updatedAt: myDate,
          },
          { transaction: this.t }
        );

        // 3. Insert file validasi untuk realisasi ini
        await Promise.all(
          arr_filepath.map((fileObj) =>
            Validasi_syarat_permohonan.create(
              {
                realisasi_permohonan_id: realisasi.id,
                file_name: fileObj.basename,
                path: fileObj.path,
                status: "process",
                createdAt: myDate,
                updatedAt: myDate,
              },
              { transaction: this.t }
            )
          )
        );

        this.message = `Berhasil menambahkan Permohonan Bantuan bulanan bulan ${bulanSekarang} atas nama ${info_member.fullname} untuk Kegiatan ${info_kegiatan.nama_kegiatan}`;
      }

      // ================= TAHUNAN =================
      else {
        console.log(
          "================== Processing TAHUNAN (1 realisasi saja) =================="
        );

        // 1. Insert 1 permohonan
        const permohonan = await Permohonan.create(
          {
            member_id: body.member_id,
            kegiatan_id: body.kegiatan_id,
            bank_id: body.bank_id,
            nomor_akun_bank: body.nomor_rekening,
            nama_akun_bank: body.atas_nama,
            status: "sedang_berlangsung",
            createdAt: myDate,
            updatedAt: myDate,
          },
          { transaction: this.t }
        );

        // 2. Insert 1 realisasi dengan status process_lapangan (bulan = null untuk tahunan)
        const realisasi = await Realisasi_permohonan.create(
          {
            permohonan_id: permohonan.id,
            status: "process_lapangan",
            status_realisasi: "belum_direalisasi",
            bulan: null, // null untuk tahunan
            periode_key: null,
            createdAt: myDate,
            updatedAt: myDate,
          },
          { transaction: this.t }
        );

        // 3. Insert file validasi
        await Promise.all(
          arr_filepath.map((fileObj) =>
            Validasi_syarat_permohonan.create(
              {
                realisasi_permohonan_id: realisasi.id,
                file_name: fileObj.basename,
                path: fileObj.path,
                status: "process",
                createdAt: myDate,
                updatedAt: myDate,
              },
              { transaction: this.t }
            )
          )
        );

        this.message = `Berhasil menambahkan Permohonan Bantuan tahunan atas nama ${info_member.fullname} untuk Kegiatan ${info_kegiatan.nama_kegiatan}`;
      }
    } catch (error) {
      console.error("Error in add():", error);
      this.fail(error);
    }
  }

  async edit() {
    const body = this.req.body;

    try {
      await this.initialize();
      const { permohonan, realisasi } = await this.lockRealisasi(body.id);
      if (
        Number(body.member_id) !== Number(permohonan.member_id) ||
        Number(body.kegiatan_id) !== Number(permohonan.kegiatan_id)
      ) {
        const error = new Error(
          "Member dan kegiatan permohonan tidak dapat diubah setelah realisasi dibuat."
        );
        error.statusCode = 409;
        throw error;
      }

      const myDate = new Date();
      const model_r = new Model_r(this.req);
      const info_kegiatan = await model_r.info_kegiatan(
        permohonan.kegiatan_id
      );
      const info_member = await model_r.info_member(permohonan.member_id);

      // --- Update permohonan utama ---
      const [parentUpdated] = await Permohonan.update(
        {
          kegiatan_id: permohonan.kegiatan_id,
          bank_id: body.bank_id,
          member_id: permohonan.member_id,
          nomor_akun_bank: body.nomor_rekening,
          nama_akun_bank: body.atas_nama,
          updatedAt: myDate,
        },
        {
          where: { id: permohonan.id },
          transaction: this.t,
        }
      );
      if (parentUpdated !== 1) {
        const error = new Error("Permohonan berubah saat diperbarui.");
        error.statusCode = 409;
        throw error;
      }

      // --- Handle dokumen via dokumenMap ---
      const dokumenMap = body.dokumenMap || {};

      // Merge file + meta berdasarkan prefix
      const mergedDocs = [];
      for (const [key, val] of Object.entries(dokumenMap)) {
        if (key.endsWith("_meta")) {
          const baseKey = key.replace("_meta", "");
          const fileObj = dokumenMap[baseKey] || {};
          mergedDocs.push({ ...val, ...fileObj });
        }
      }

      const allDocs = mergedDocs;

      // bikin map existing dari DB
      const ids = allDocs.filter((f) => f.id).map((f) => f.id);
      const existingDocs = ids.length
        ? await Validasi_syarat_permohonan.findAll({
            where: {
              id: ids,
              realisasi_permohonan_id: realisasi.id,
            },
            transaction: this.t,
            lock: this.t.LOCK.UPDATE,
            raw: true,
            nest: true,
            attributes: ["id", "path"],
          })
        : [];
      const docMap = Object.fromEntries(existingDocs.map((d) => [d.id, d]));

      console.log("========== allDocs ==========");
      console.log("allDocs: ", allDocs);
      console.log("ids: ", ids);
      console.log("docMap: ", docMap);
      console.log("========== allDocs ==========");

      const usedUploads = new Set();
      for (const fileObj of allDocs) {
        const {
          id: id,
          file: newPath,
          file_name: basename,
          status = "new",
        } = fileObj;

        if (status === "replace" && id) {
          // hapus file lama
          const oldDoc = docMap[id];
          if (!oldDoc) {
            throw new Error("Dokumen pengganti tidak sesuai permohonan.");
          }
          if (!this.getSafeDocumentPath(newPath) || !basename) {
            throw new Error("Referensi dokumen pengganti tidak valid.");
          }
          // update ke file baru
          await Validasi_syarat_permohonan.update(
            {
              file_name: basename, // fallback
              path: newPath,
              status: "process",
              updatedAt: myDate,
            },
            { where: { id }, transaction: this.t }
          );
          usedUploads.add(newPath);
          await this.queueDocumentRemoval(
            oldDoc.path,
            "admin-permohonan-document-replaced"
          );
        } else if (status === "keep" && id) {
          // skip
        } else if (status === "remove" && id) {
          const oldDoc = docMap[id];
          if (!oldDoc) {
            throw new Error("Dokumen yang dihapus tidak sesuai permohonan.");
          }
          await Validasi_syarat_permohonan.destroy({
            where: { id },
            transaction: this.t,
          });
          await this.queueDocumentRemoval(
            oldDoc.path,
            "admin-permohonan-document-removed"
          );
        } else if (status === "new") {
          if (!this.getSafeDocumentPath(newPath) || !basename) {
            throw new Error("Referensi dokumen baru tidak valid.");
          }
          await Validasi_syarat_permohonan.create(
            {
              realisasi_permohonan_id: realisasi.id,
              file_name: basename,
              path: newPath,
              status: "process",
              createdAt: myDate,
              updatedAt: myDate,
            },
            { transaction: this.t }
          );
          usedUploads.add(newPath);
        }
      }

      for (const file of this.req.adminPermohonanUploads || []) {
        if (!usedUploads.has(file.path)) {
          await this.queueDocumentRemoval(
            file.path,
            "admin-permohonan-unused-upload"
          );
        }
      }

      this.message = `Mengubah Permohonan Bantuan atas nama ${info_member.fullname} untuk Kegiatan ${info_kegiatan.nama_kegiatan} dan ID Permohonan: ${realisasi.id}`;
    } catch (error) {
      console.error("Error in edit():", error);
      this.fail(error);
    }
  }

  async edit_status() {
    await this.initialize();
    const myDate = moment().format("YYYY-MM-DD HH:mm:ss");
    const body = this.req.body;
    try {
      const model_r = new Model_r(this.req);
      const info_realisasi = await model_r.info_realisasi(body.id);
      const info_permohonan = await model_r.info_permohonan(
        info_realisasi.permohonan_id
      );
      const info_kegiatan = await model_r.info_kegiatan(
        info_permohonan.kegiatan_id
      );
      const info_member = await model_r.info_member(info_permohonan.member_id);

      // Cek apakah bulanan atau tahunan
      const isBulanan = info_realisasi.bulan !== null;
      console.log("isBulanan: ", isBulanan);

      if (isBulanan) {
        const bulanSekarang = info_realisasi.bulan;

        console.log("bulanSekarang: ", bulanSekarang);

        // Ambil semua realisasi dari bulan sekarang sampai bulan 12
        const realisasiList = await Realisasi_permohonan.findAll({
          attributes: ["id", "permohonan_id", "bulan"],
          where: {
            bulan: {
              [Op.between]: [bulanSekarang, 12], // Ambil semua realisasi dari bulan sekarang sampai bulan 12
            },
          },
          include: [
            {
              model: Permohonan,
              where: {
                kegiatan_id: info_permohonan.kegiatan_id,
                member_id: info_permohonan.member_id,
              },
              required: true,
              attributes: [],
            },
          ],
          raw: true,
        });
        console.log("realisasiList: ", realisasiList);

        // Update setiap permohonan yang terkait
        for (const realisasi of realisasiList) {
          await Permohonan.update(
            {
              status: "terhenti",
              alasan_penolakan: body.alasan_penolakan,
              updatedAt: myDate,
            },
            {
              where: { id: realisasi.permohonan_id },
              transaction: this.t,
            }
          );
        }
      } else {
        await Permohonan.update(
          {
            status: "terhenti",
            alasan_penolakan: body.alasan_penolakan,
            updatedAt: myDate,
          },
          {
            where: { id: info_realisasi.permohonan_id },
            transaction: this.t,
          }
        );
      }

      this.message = `Menghentikan Permohonan Bantuan atas nama ${info_member.fullname} untuk Kegiatan ${info_kegiatan.nama_kegiatan} dengan ID Permohonan: ${info_realisasi.permohonan_id} dan Alasan Penolakan: ${body.alasan_penolakan}`;
    } catch (error) {
      this.state = false;
      this.message = error.message;
    }
  }

  async delete() {
    const body = this.req.body;

    try {
      await this.initialize();
      const { permohonan, realisasi } = await this.lockRealisasi(body.id);
      const model_r = new Model_r(this.req);
      const info_kegiatan = await model_r.info_kegiatan(
        permohonan.kegiatan_id
      );
      const info_member = await model_r.info_member(permohonan.member_id);

      const validasi = await Validasi_syarat_permohonan.findAll({
        attributes: ["id", "file_name", "path"],
        where: { realisasi_permohonan_id: realisasi.id },
        transaction: this.t,
        lock: this.t.LOCK.UPDATE,
        raw: true,
      });

      await Validasi_syarat_permohonan.destroy({
        where: { realisasi_permohonan_id: realisasi.id },
        transaction: this.t,
      });
      await Realisasi_permohonan.destroy({
        where: { id: realisasi.id },
        transaction: this.t,
      });
      await Permohonan.destroy({
        where: { id: permohonan.id },
        transaction: this.t,
      });

      // Referensi lama tetap aman jika dipakai record lain.
      for (const item of validasi) {
        await this.queueDocumentRemoval(
          item.path,
          "admin-permohonan-deleted-document"
        );
      }

      this.message = `Menghapus Permohonan Bantuan atas nama ${info_member.fullname} untuk Kegiatan ${info_kegiatan.nama_kegiatan} dengan ID Permohonan: ${body.id}`;
    } catch (error) {
      console.error("Failed to delete data:", error);
      this.fail(error);
    }
  }

  // response
  async response() {
    if (!this.t) {
      this.transactionOutcome = "not_started";
      return false;
    }

    if (this.state) {
      try {
        await writeLog(this.req, this.t, {
          msg: this.message,
        });
      } catch (error) {
        this.fail(error);
        return this.rollbackAfterFailure();
      }

      try {
        await this.t.commit();
        this.transactionOutcome = "committed";
        return true;
      } catch (error) {
        this.fail(error, 503, "PERMOHONAN_COMMIT_UNCERTAIN");
        this.transactionOutcome = "commit_unknown";
        this.message =
          "Status penyimpanan belum pasti. Periksa data sebelum mencoba lagi.";
        return false;
      }
    }

    return this.rollbackAfterFailure();
  }

  async rollbackAfterFailure() {
    if (this.t.finished) {
      this.transactionOutcome = "rollback_unknown";
      this.statusCode = 503;
      this.errorCode = "PERMOHONAN_ROLLBACK_UNCERTAIN";
      this.message =
        "Status penyimpanan belum pasti. Periksa data sebelum mencoba lagi.";
      return false;
    }

    try {
      await this.t.rollback();
      this.transactionOutcome = "rolled_back";
      if (!this.cleanupDone) {
        this.cleanupDone = true;
        this.removeUploadedDocuments();
      }
      return false;
    } catch {
      this.transactionOutcome = "rollback_unknown";
      this.statusCode = 503;
      this.errorCode = "PERMOHONAN_ROLLBACK_UNCERTAIN";
      this.message =
        "Status penyimpanan belum pasti. Periksa data sebelum mencoba lagi.";
      return false;
    }
  }
}

Model_cud.DOCUMENT_DIRECTORY = DOCUMENT_DIRECTORY;
Model_cud.removeDocument = (filename) =>
  removeStoredFile(DOCUMENT_DIRECTORY, filename, {
    allowedExtensions: DOCUMENT_EXTENSIONS,
  });
Model_cud.resolveDocumentPath = (filename) =>
  resolveStoredPath(DOCUMENT_DIRECTORY, filename, {
    allowedExtensions: DOCUMENT_EXTENSIONS,
  });

module.exports = Model_cud;
