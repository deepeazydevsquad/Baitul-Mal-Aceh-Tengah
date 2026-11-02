const {
  Op,
  sequelize,
  Realisasi_permohonan,
  Validasi_syarat_permohonan,
  Permohonan,
  Kegiatan,
} = require("../../../models");
const Model_r = require("../models/model_r");
const { writeLog } = require("../../../helper/writeLogHelper");
const { sendWhatsApp } = require("../../../helper/waSenderHelper");
const { convertToRP } = require("../../../helper/currencyHelper");
const path = require("path");
const moment = require("moment");
const {
  resolveStoredPath,
  removeStoredFile,
} = require("../../../helper/uploadStorageHelper");
const {
  queueStoredFileCleanup,
} = require("../../../helper/documentCleanupHelper");
const {
  buildMonthlyPeriodKey,
} = require("../../../helper/monthlyPeriodHelper");

const DOCUMENT_DIRECTORY = path.resolve(
  __dirname,
  "../../../uploads/dokumen/permohonan_bantuan"
);
const DOCUMENT_EXTENSIONS = new Set([".pdf"]);

class Model_cud {
  constructor(req) {
    this.req = req;
    this.t = null;
    this.state = false;
    this.message = "";
    this.statusCode = 400;
    this.errorCode = "VALIDATION_FAILED";
    this.transactionOutcome = "not_started";
    this.cleanupDone = false;
  }

  async initialize() {
    this.t = await sequelize.transaction();
    this.transactionOutcome = "pending";
    this.state = true;
  }

  fail(error, statusCode = 400, errorCode = this.errorCode) {
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
      const error = new Error("Data realisasi tidak ditemukan.");
      error.statusCode = 404;
      throw error;
    }

    const permohonan = await Permohonan.findByPk(pointer.permohonan_id, {
      transaction: this.t,
      lock: this.t.LOCK.UPDATE,
    });
    if (!permohonan || permohonan.status !== "sedang_berlangsung") {
      const error = new Error(
        "Permohonan sudah tidak aktif dan tidak dapat diproses."
      );
      error.statusCode = 409;
      throw error;
    }

    const current = await Realisasi_permohonan.findByPk(id, {
      transaction: this.t,
      lock: this.t.LOCK.UPDATE,
    });
    if (!current) {
      const error = new Error("Data realisasi tidak ditemukan.");
      error.statusCode = 404;
      throw error;
    }
    return { permohonan, realisasi: current };
  }

  // ========================================
  // 1. EDIT FILE (Upload ulang file yang ditolak)
  // ========================================
  async edit_file() {
    const body = this.req.body;
    const uploadedFile = this.req.validationReplacementUpload;

    try {
      if (
        !resolveStoredPath(DOCUMENT_DIRECTORY, uploadedFile?.filename, {
          allowedExtensions: DOCUMENT_EXTENSIONS,
        })
      ) {
        throw new Error("Dokumen pengganti tidak valid.");
      }

      await this.initialize();
      await this.lockRealisasi(body.id);
      const dataValidasi = await Validasi_syarat_permohonan.findOne({
        where: {
          realisasi_permohonan_id: body.id,
          id: body.validasi_id,
        },
        transaction: this.t,
        lock: this.t.LOCK.UPDATE,
      });
      if (!dataValidasi) throw new Error("Data validasi tidak ditemukan");

      const myDate = moment(new Date()).format("YYYY-MM-DD HH:mm:ss");
      if (dataValidasi.path) {
        await queueStoredFileCleanup(
          DOCUMENT_DIRECTORY,
          dataValidasi.path,
          "validation-document-replaced",
          this.t
        );
      }

      await dataValidasi.update(
        {
          file_name: uploadedFile.file_name,
          path: uploadedFile.filename,
          status: "process", // Reset ke process (perlu validasi ulang)
          alasan_penolakan: null, // Reset alasan penolakan
          updatedAt: myDate,
        },
        { transaction: this.t }
      );

      // Get info untuk log
      const model_r = new Model_r(this.req);
      const info_realisasi = await model_r.info_realisasi(body.id);
      const info_permohonan = await model_r.info_permohonan(
        info_realisasi.permohonan_id
      );
      const info_member = await model_r.info_member(info_permohonan.member_id);

      this.message = `Memperbarui file syarat permohonan untuk ${info_member.fullname} dengan file baru: ${uploadedFile.file_name}`;
    } catch (error) {
      console.error("Gagal memperbarui berkas permohonan.");
      this.fail(error, 500);
    }
  }

  removeUploadedDocument() {
    const upload = this.req.validationReplacementUpload;
    if (
      resolveStoredPath(DOCUMENT_DIRECTORY, upload?.filename, {
        allowedExtensions: DOCUMENT_EXTENSIONS,
      })
    ) {
      return removeStoredFile(DOCUMENT_DIRECTORY, upload.filename, {
        allowedExtensions: DOCUMENT_EXTENSIONS,
      });
    }
    return false;
  }

  // ========================================
  // 2. APPROVE BERKAS (per syarat)
  // ========================================
  async approve_berkas() {
    const body = this.req.body;

    try {
      await this.initialize();
      const { realisasi } = await this.lockRealisasi(body.id);
      if (!["process", "process_lapangan"].includes(realisasi.status)) {
        const error = new Error(
          "Permohonan sudah diputuskan dan berkas tidak dapat diubah."
        );
        error.statusCode = 409;
        throw error;
      }

      const dataValidasi = await Validasi_syarat_permohonan.findOne({
        where: {
          id: body.validasi_id,
          realisasi_permohonan_id: body.id,
        },
        transaction: this.t,
        lock: this.t.LOCK.UPDATE,
      });
      if (!dataValidasi) {
        const error = new Error("Data validasi tidak ditemukan");
        error.statusCode = 404;
        throw error;
      }
      if (dataValidasi.status !== "process") {
        const error = new Error(
          "Berkas sudah diputuskan dan tidak dapat disetujui ulang."
        );
        error.statusCode = 409;
        throw error;
      }

      const myDate = moment(new Date()).format("YYYY-MM-DD HH:mm:ss");
      await dataValidasi.update(
        {
          status: "approve",
          alasan_penolakan: null,
          updatedAt: myDate,
        },
        { transaction: this.t }
      );

      // Get info untuk log
      const model_r = new Model_r(this.req);
      const info_realisasi = await model_r.info_realisasi(body.id);
      const info_permohonan = await model_r.info_permohonan(
        info_realisasi.permohonan_id
      );
      const info_kegiatan = await model_r.info_kegiatan(
        info_permohonan.kegiatan_id
      );
      const info_member = await model_r.info_member(info_permohonan.member_id);

      this.message = `Menyetujui berkas permohonan ${dataValidasi.file_name
        .split("_")
        .filter((item) => item.trim() !== "")
        .join(" ")} untuk ${info_member.fullname} - Kegiatan: ${
        info_kegiatan.nama_kegiatan
      }`;
    } catch (error) {
      console.error("Gagal menyetujui berkas permohonan.");
      this.fail(error, 500);
    }
  }

  // ========================================
  // 3. REJECT BERKAS (per syarat)
  // ========================================
  async reject_berkas() {
    const body = this.req.body;

    try {
      await this.initialize();
      const { realisasi } = await this.lockRealisasi(body.id);
      if (!["process", "process_lapangan"].includes(realisasi.status)) {
        const error = new Error(
          "Permohonan sudah diputuskan dan berkas tidak dapat diubah."
        );
        error.statusCode = 409;
        throw error;
      }

      const dataValidasi = await Validasi_syarat_permohonan.findOne({
        where: {
          id: body.validasi_id,
          realisasi_permohonan_id: body.id,
        },
        transaction: this.t,
        lock: this.t.LOCK.UPDATE,
      });
      if (!dataValidasi) {
        const error = new Error("Data validasi tidak ditemukan");
        error.statusCode = 404;
        throw error;
      }
      if (dataValidasi.status !== "process") {
        const error = new Error(
          "Berkas sudah diputuskan dan tidak dapat ditolak ulang."
        );
        error.statusCode = 409;
        throw error;
      }

      const myDate = moment(new Date()).format("YYYY-MM-DD HH:mm:ss");
      await dataValidasi.update(
        {
          status: "reject",
          alasan_penolakan: body.alasan_penolakan,
          updatedAt: myDate,
        },
        { transaction: this.t }
      );

      // Get info untuk log
      const model_r = new Model_r(this.req);
      const info_realisasi = await model_r.info_realisasi(body.id);
      const info_permohonan = await model_r.info_permohonan(
        info_realisasi.permohonan_id
      );
      const info_kegiatan = await model_r.info_kegiatan(
        info_permohonan.kegiatan_id
      );
      const info_member = await model_r.info_member(info_permohonan.member_id);

      this.message = `Menolak berkas ${dataValidasi.file_name
        .split("_")
        .filter((item) => item.trim() !== "")
        .join(" ")} untuk ${info_member.fullname} - Kegiatan: ${
        info_kegiatan.nama_kegiatan
      } - Alasan: ${body.alasan_penolakan}`;
    } catch (error) {
      console.error("Gagal menolak berkas permohonan.");
      this.fail(error, 500);
    }
  }

  // ========================================
  // 4. TOLAK PERMOHONAN (Tolak seluruh permohonan)
  // ========================================
  async reject_permohonan() {
    const body = this.req.body;

    try {
      await this.initialize();
      const pointer = await Realisasi_permohonan.findOne({
        where: { id: body.id },
        attributes: ["permohonan_id"],
        transaction: this.t,
        raw: true,
      });
      if (!pointer) {
        const error = new Error("Data realisasi tidak ditemukan");
        error.statusCode = 404;
        throw error;
      }
      const parentSnapshot = await Permohonan.findByPk(pointer.permohonan_id, {
        transaction: this.t,
        attributes: ["id", "kegiatan_id"],
      });
      const kegiatan = await Kegiatan.findByPk(parentSnapshot?.kegiatan_id, {
        transaction: this.t,
        lock: this.t.LOCK.UPDATE,
      });
      const permohonan = await Permohonan.findByPk(pointer.permohonan_id, {
        transaction: this.t,
        lock: this.t.LOCK.UPDATE,
      });
      const current = await Realisasi_permohonan.findByPk(body.id, {
        transaction: this.t,
        lock: this.t.LOCK.UPDATE,
      });
      if (!kegiatan || !permohonan || !current) {
        const error = new Error("Data permohonan tidak lengkap.");
        error.statusCode = 409;
        throw error;
      }
      if (permohonan.status !== "sedang_berlangsung") {
        const error = new Error("Permohonan sudah tidak aktif.");
        error.statusCode = 409;
        throw error;
      }
      if (!["process", "process_lapangan"].includes(current.status)) {
        const error = new Error("Permohonan sudah diputuskan");
        error.statusCode = 409;
        throw error;
      }

      const model_r = new Model_r(this.req);
      const info_member = await model_r.info_member(permohonan.member_id);
      const myDate = moment(new Date()).format("YYYY-MM-DD HH:mm:ss");

      const [updated] = await Realisasi_permohonan.update(
        {
          status: "reject_berkas",
          updatedAt: myDate,
        },
        {
          where: {
            id: body.id,
            status: { [Op.in]: ["process", "process_lapangan"] },
          },
          transaction: this.t,
        }
      );
      if (updated !== 1) {
        const error = new Error("Permohonan sudah diputuskan");
        error.statusCode = 409;
        throw error;
      }

      const [parentUpdated] = await Permohonan.update(
        {
          status: "terhenti",
          alasan_penolakan: body.alasan_penolakan,
          updatedAt: myDate,
        },
        {
          where: {
            id: permohonan.id,
            status: "sedang_berlangsung",
          },
          transaction: this.t,
        }
      );
      if (parentUpdated !== 1) {
        const error = new Error("Permohonan berubah saat ditolak.");
        error.statusCode = 409;
        throw error;
      }

      if (body.send_wa) {
        const message = `Halo *${info_member.fullname}*,\n\nPermohonan bantuan Anda untuk kegiatan *"${kegiatan.nama_kegiatan}"* telah *DITOLAK*.\n\n*Alasan:*\n${body.alasan_penolakan}\n\nTerima kasih.`;
        this.notification = {
          whatsappNumber: info_member.whatsapp_number,
          message,
        };
      }

      this.message = `Menolak permohonan bantuan ${
        info_member.fullname
      } - Kegiatan: ${kegiatan.nama_kegiatan}. Alasan: ${
        body.alasan_penolakan
      }${body.send_wa ? " (dengan notifikasi WA)" : ""}`;
    } catch (error) {
      console.error("Gagal menolak permohonan.");
      this.fail(error, 500);
    }
  }

  // ========================================
  // 5. APPROVE PERMOHONAN (dengan auto generate bulan berikutnya)
  // ========================================
  async approve_permohonan() {
    const body = this.req.body;

    try {
      const nominalDisetujui = Number(body.biaya_disetujui);
      if (!Number.isInteger(nominalDisetujui) || nominalDisetujui <= 0) {
        const error = new Error("Biaya disetujui harus lebih dari 0.");
        error.statusCode = 400;
        throw error;
      }

      await this.initialize();
      const pointer = await Realisasi_permohonan.findOne({
        where: { id: body.id },
        attributes: ["permohonan_id"],
        transaction: this.t,
        raw: true,
      });
      if (!pointer) {
        const error = new Error("Data realisasi tidak ditemukan");
        error.statusCode = 404;
        throw error;
      }
      const parentSnapshot = await Permohonan.findByPk(pointer.permohonan_id, {
        transaction: this.t,
        attributes: ["id", "kegiatan_id"],
      });
      // Lock the activity first so simultaneous approvals of different
      // months in the same series cannot both generate the same periods.
      const kegiatan = await Kegiatan.findByPk(parentSnapshot?.kegiatan_id, {
        transaction: this.t,
        lock: this.t.LOCK.UPDATE,
      });
      const permohonan = await Permohonan.findByPk(pointer.permohonan_id, {
        transaction: this.t,
        lock: this.t.LOCK.UPDATE,
      });
      const current = await Realisasi_permohonan.findByPk(body.id, {
        transaction: this.t,
        lock: this.t.LOCK.UPDATE,
      });
      if (!kegiatan || !permohonan || !current) {
        const error = new Error("Data permohonan tidak lengkap.");
        error.statusCode = 409;
        throw error;
      }
      if (permohonan.status !== "sedang_berlangsung") {
        const error = new Error("Permohonan sudah tidak aktif.");
        error.statusCode = 409;
        throw error;
      }
      if (current.status !== "process") {
        const error = new Error(
          "Permohonan tidak berada pada tahap persetujuan"
        );
        error.statusCode = 409;
        throw error;
      }

      const validationFiles = await Validasi_syarat_permohonan.findAll({
        where: { realisasi_permohonan_id: body.id },
        attributes: ["file_name", "path", "status"],
        transaction: this.t,
        lock: this.t.LOCK.UPDATE,
      });
      if (validationFiles.length === 0) {
        const error = new Error(
          "Belum ada berkas yang diunggah untuk permohonan ini."
        );
        error.statusCode = 409;
        throw error;
      }
      if (validationFiles.some((file) => file.status !== "approve")) {
        const error = new Error(
          "Semua berkas harus disetujui terlebih dahulu"
        );
        error.statusCode = 409;
        throw error;
      }

      const model_r = new Model_r(this.req);
      const info_member = await model_r.info_member(permohonan.member_id);
      const myDate = moment(new Date()).format("YYYY-MM-DD HH:mm:ss");

      const [updated] = await Realisasi_permohonan.update(
        {
          status: "approve",
          biaya_disetujui: nominalDisetujui,
          updatedAt: myDate,
        },
        {
          where: { id: body.id, status: "process" },
          transaction: this.t,
        }
      );
      if (updated !== 1) {
        const error = new Error("Permohonan sudah diputuskan");
        error.statusCode = 409;
        throw error;
      }

      let generatedCount = 0;
      if (kegiatan.periode_bantuan === "bulanan" && current.bulan) {
        const bulanSekarang = Number(current.bulan);
        const bulanBerikutnya = bulanSekarang + 1;
        if (bulanBerikutnya <= 12) {
          const bulansToGenerate = Array.from(
            { length: 12 - bulanBerikutnya + 1 },
            (_, i) => i + bulanBerikutnya
          );
          const existing = await Realisasi_permohonan.findAll({
            where: {
              bulan: { [Op.in]: bulansToGenerate },
            },
            include: [
              {
                model: Permohonan,
                required: true,
                attributes: [],
                where: {
                  member_id: permohonan.member_id,
                  kegiatan_id: permohonan.kegiatan_id,
                },
              },
            ],
            attributes: ["bulan"],
            transaction: this.t,
            lock: this.t.LOCK.UPDATE,
            raw: true,
          });
          const existingMonths = new Set(
            existing.map((item) => Number(item.bulan))
          );
          const missingMonths = bulansToGenerate.filter(
            (bulan) => !existingMonths.has(bulan)
          );

          for (const bulan of missingMonths) {
            const newPermohonan = await Permohonan.create(
              {
                member_id: permohonan.member_id,
                kegiatan_id: permohonan.kegiatan_id,
                bank_id: permohonan.bank_id,
                nomor_akun_bank: permohonan.nomor_akun_bank,
                nama_akun_bank: permohonan.nama_akun_bank,
                status: "sedang_berlangsung",
                createdAt: myDate,
                updatedAt: myDate,
              },
              { transaction: this.t }
            );

            const newRealisasi = await Realisasi_permohonan.create(
              {
                permohonan_id: newPermohonan.id,
                status: "process", // status process (sudah melewati tahap lapangan)
                status_realisasi: "belum_direalisasi",
                bulan: bulan,
                periode_key: buildMonthlyPeriodKey(
                  permohonan.member_id,
                  permohonan.kegiatan_id,
                  kegiatan.tahun,
                  bulan
                ),
                createdAt: myDate,
                updatedAt: myDate,
              },
              { transaction: this.t }
            );

            await Promise.all(
              validationFiles.map((file) =>
                Validasi_syarat_permohonan.create(
                  {
                    realisasi_permohonan_id: newRealisasi.id,
                    file_name: file.file_name,
                    path: file.path,
                    status: "approve",
                    createdAt: myDate,
                    updatedAt: myDate,
                  },
                  { transaction: this.t }
                )
              )
            );
            generatedCount += 1;
          }
        }
      }

      if (body.send_wa) {
        const message = `Halo *${
          info_member.fullname
        }*,\n\nPermohonan bantuan Anda untuk kegiatan *"${
          kegiatan.nama_kegiatan
        }"* telah *DISETUJUI* dengan jumlah bantuan *${await convertToRP(
          nominalDisetujui
        )}*.\n\nProses transfer akan diinformasikan selanjutnya.\n\n${
          body.catatan ? `Catatan: ${body.catatan}\n\n` : ""
        }Terima kasih.`;
        this.notification = {
          whatsappNumber: info_member.whatsapp_number,
          message,
        };
      }

      this.message = `Menyetujui permohonan bantuan ${
        info_member.fullname
      } - Kegiatan: ${kegiatan.nama_kegiatan} dengan biaya Rp ${
        nominalDisetujui
      }${body.send_wa ? " (dengan notifikasi WA)" : ""}${
        generatedCount > 0
          ? ` dan menggenerate ${generatedCount} permohonan bulan berikutnya`
          : ""
      }`;
    } catch (error) {
      if (error.name === "SequelizeUniqueConstraintError") {
        error.statusCode = 409;
        error.message =
          "Periode bantuan bulanan sudah ada untuk member dan kegiatan ini.";
      }
      console.error("Gagal menyetujui permohonan.");
      this.fail(error, 500);
    }
  }

  // ========================================
  // RESPONSE HANDLER
  // ========================================
  async notifyAfterCommit() {
    if (!this.notification) return;
    try {
      await sendWhatsApp(
        this.notification.whatsappNumber,
        this.notification.message
      );
    } catch (error) {
      this.notificationError = error;
      console.error("Keputusan tersimpan, tetapi notifikasi WhatsApp gagal:");
    }
  }

  async response() {
    if (!this.t) {
      this.transactionOutcome = "not_started";
      this.cleanupUploadedDocument();
      return false;
    }

    if (this.state) {
      try {
        await writeLog(this.req, this.t, {
          msg: this.message,
        });
      } catch (error) {
        this.fail(error, 500);
        return this.rollbackAfterFailure();
      }

      try {
        await this.t.commit();
        this.transactionOutcome = "committed";
        await this.notifyAfterCommit();
        return true;
      } catch (error) {
        this.fail(error, 503, "VALIDATION_COMMIT_UNCERTAIN");
        this.transactionOutcome = "commit_unknown";
        this.message =
          "Status penyimpanan belum pasti. Periksa dokumen sebelum mengunggah ulang.";
        return false;
      }
    }

    return this.rollbackAfterFailure();
  }

  async rollbackAfterFailure() {
    if (this.t.finished) {
      this.transactionOutcome = "rollback_unknown";
      this.statusCode = 503;
      this.errorCode = "VALIDATION_ROLLBACK_UNCERTAIN";
      this.message =
        "Status penyimpanan belum pasti. Periksa dokumen sebelum mengunggah ulang.";
      return false;
    }

    try {
      await this.t.rollback();
      this.transactionOutcome = "rolled_back";
      this.cleanupUploadedDocument();
      return false;
    } catch {
      this.transactionOutcome = "rollback_unknown";
      this.statusCode = 503;
      this.errorCode = "VALIDATION_ROLLBACK_UNCERTAIN";
      this.message =
        "Status penyimpanan belum pasti. Periksa dokumen sebelum mengunggah ulang.";
      return false;
    }
  }

  cleanupUploadedDocument() {
    if (this.cleanupDone) return;
    this.cleanupDone = true;
    this.removeUploadedDocument();
  }
}

Model_cud.DOCUMENT_DIRECTORY = DOCUMENT_DIRECTORY;
Model_cud.removeDocument = (filename) =>
  removeStoredFile(DOCUMENT_DIRECTORY, filename, {
    allowedExtensions: DOCUMENT_EXTENSIONS,
  });

module.exports = Model_cud;
