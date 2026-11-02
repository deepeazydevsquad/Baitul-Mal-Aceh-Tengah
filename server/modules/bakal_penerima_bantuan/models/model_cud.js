const {
  Op,
  sequelize,
  Realisasi_permohonan,
  Permohonan,
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

const REALISASI_DOCUMENT_DIRECTORY = path.resolve(
  __dirname,
  "../../../uploads/dokumen/bakal_penerima_bantuan/bukti_realisasi"
);
const BERITA_ACARA_DIRECTORY = path.resolve(
  __dirname,
  "../../../uploads/dokumen/bakal_penerima_bantuan/berita_acara"
);
const DOCUMENT_EXTENSIONS = new Set([".pdf", ".png", ".jpg", ".jpeg"]);

class Model_cud {
  constructor(req) {
    this.req = req;
    this.t = null;
    this.state = false;
    this.message = "";
    this.statusCode = 400;
    this.errorCode = "REALISASI_FAILED";
    this.transactionOutcome = "not_started";
    this.newUploads = [];
  }

  async initialize() {
    this.t = await sequelize.transaction();
    this.transactionOutcome = "pending";
    this.state = true;
  }

  recordNewUpload(directory, filename) {
    if (!filename) return;
    this.newUploads.push({ directory, filename });
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
      const error = new Error("Realisasi tidak ditemukan.");
      error.statusCode = 404;
      throw error;
    }

    const permohonan = await Permohonan.findByPk(pointer.permohonan_id, {
      transaction: this.t,
      lock: this.t.LOCK.UPDATE,
    });
    if (!permohonan) {
      const error = new Error("Permohonan tidak ditemukan.");
      error.statusCode = 404;
      throw error;
    }
    if (permohonan.status !== "sedang_berlangsung") {
      const error = new Error(
        "Permohonan sudah tidak aktif dan tidak dapat diubah."
      );
      error.statusCode = 409;
      throw error;
    }

    const realisasi = await Realisasi_permohonan.findByPk(id, {
      transaction: this.t,
      lock: this.t.LOCK.UPDATE,
    });
    if (!realisasi) {
      const error = new Error("Realisasi tidak ditemukan.");
      error.statusCode = 404;
      throw error;
    }
    return { permohonan, realisasi };
  }

  cleanupNewUploads() {
    for (const upload of this.newUploads) {
      removeStoredFile(upload.directory, upload.filename, {
        allowedExtensions: DOCUMENT_EXTENSIONS,
      });
    }
    this.newUploads = [];
  }

  async notifyAfterCommit() {
    if (!this.notification) return;
    try {
      await sendWhatsApp(
        this.notification.whatsappNumber,
        this.notification.message
      );
    } catch (error) {
      this.notificationError = error;
      console.error("Realisasi tersimpan, tetapi notifikasi WhatsApp gagal:");
    }
  }

  async realisasi_bantuan() {
    const body = this.req.body;
    try {
      const uploadedProof = this.req.buktiRealisasiDocument?.filename;
      this.recordNewUpload(REALISASI_DOCUMENT_DIRECTORY, uploadedProof);
      if (
        !resolveStoredPath(REALISASI_DOCUMENT_DIRECTORY, uploadedProof, {
          allowedExtensions: DOCUMENT_EXTENSIONS,
        })
      ) {
        throw new Error("Bukti realisasi tidak valid.");
      }

      const nominal = Number(body.nominal_realisasi);
      if (!Number.isInteger(nominal) || nominal <= 0) {
        const error = new Error("Nominal realisasi harus lebih dari 0.");
        error.statusCode = 400;
        throw error;
      }
      if (!["transfer", "bantuan_langsung"].includes(body.tipe)) {
        const error = new Error("Tipe realisasi tidak valid.");
        error.statusCode = 400;
        throw error;
      }
      if (!moment(body.tanggal_realisasi, "YYYY-MM-DD", true).isValid()) {
        const error = new Error("Tanggal realisasi tidak valid.");
        error.statusCode = 400;
        throw error;
      }

      await this.initialize();
      const { permohonan, realisasi: current } = await this.lockRealisasi(
        body.id
      );
      if (current.status !== "approve") {
        const error = new Error(
          "Realisasi belum disetujui atau sudah diputuskan."
        );
        error.statusCode = 409;
        throw error;
      }
      if (current.status_realisasi === "sudah_direalisasi") {
        const error = new Error("Realisasi sudah pernah dicatat.");
        error.statusCode = 409;
        throw error;
      }

      const approvedAmount = Number(current.biaya_disetujui);
      if (!Number.isInteger(approvedAmount) || approvedAmount <= 0) {
        const error = new Error("Biaya disetujui tidak valid.");
        error.statusCode = 409;
        throw error;
      }
      if (nominal > approvedAmount) {
        const error = new Error(
          "Nominal realisasi melebihi biaya yang disetujui saat ini."
        );
        error.statusCode = 409;
        throw error;
      }

      const model_r = new Model_r(this.req);
      const info_kegiatan = await model_r.info_kegiatan(permohonan.kegiatan_id);
      const info_member = await model_r.info_member(permohonan.member_id);
      const myDate = moment().format("YYYY-MM-DD HH:mm:ss");

      const updateData = {
        tanggal_realisasi: body.tanggal_realisasi,
        nominal_realisasi: nominal,
        tipe: body.tipe,
        status_realisasi: "sudah_direalisasi",
        updatedAt: myDate,
      };

      if (body.tipe === "transfer") {
        updateData.bukti_transfer = uploadedProof;
      } else {
        updateData.mou = uploadedProof;
      }

      const [updated] = await Realisasi_permohonan.update(updateData, {
        where: {
          id: body.id,
          status: "approve",
          status_realisasi: "belum_direalisasi",
        },
        transaction: this.t,
      });
      if (updated !== 1) {
        const error = new Error(
          "Realisasi berubah saat diproses. Muat ulang data sebelum mencoba lagi."
        );
        error.statusCode = 409;
        throw error;
      }

      if (body.send_wa === "true" || body.send_wa === true) {
        const message = `Halo *${
          info_member.fullname
        }*,\n\nRealisasi bantuan untuk kegiatan *"${
          info_kegiatan.nama_kegiatan
        }"* telah *BERHASIL DIREALISASIKAN*.\n\n*Detail:*\n- Tanggal: ${moment(
          body.tanggal_realisasi
        ).format("DD MMMM YYYY")}\n- Nominal: ${await convertToRP(
          nominal
        )}\n- Tipe: ${
          body.tipe === "transfer" ? "Transfer" : "Bantuan Langsung"
        }\n\nTerima kasih.`;

        this.notification = {
          whatsappNumber: info_member.whatsapp_number,
          message,
        };
      }

      this.message = `Realisasi bantuan berhasil untuk ${
        info_member.fullname
      } - Kegiatan: ${
        info_kegiatan.nama_kegiatan
      } dengan nominal Rp ${nominal.toLocaleString("id-ID")}${
        body.send_wa === "true" || body.send_wa === true
          ? " (dengan notifikasi WA)"
          : ""
      }`;
    } catch (error) {
      console.error("Error realisasi bantuan:", error);
      this.fail(error, 500);
    }
  }

  async upload_berita_acara() {
    const body = this.req.body;
    try {
      const uploadedBeritaAcara = this.req.beritaAcaraDocument?.filename;
      this.recordNewUpload(BERITA_ACARA_DIRECTORY, uploadedBeritaAcara);
      if (
        !resolveStoredPath(BERITA_ACARA_DIRECTORY, uploadedBeritaAcara, {
          allowedExtensions: DOCUMENT_EXTENSIONS,
        })
      ) {
        throw new Error("Berita acara tidak valid.");
      }

      await this.initialize();
      const { permohonan, realisasi } = await this.lockRealisasi(body.id);
      if (realisasi.status !== "approve") {
        const error = new Error(
          "Berita acara hanya dapat diunggah untuk realisasi yang disetujui."
        );
        error.statusCode = 409;
        throw error;
      }

      const myDate = moment().format("YYYY-MM-DD HH:mm:ss");
      const model_r = new Model_r(this.req);
      const info_kegiatan = await model_r.info_kegiatan(permohonan.kegiatan_id);
      const info_member = await model_r.info_member(permohonan.member_id);

      if (realisasi.berita_acara) {
        await queueStoredFileCleanup(
          BERITA_ACARA_DIRECTORY,
          realisasi.berita_acara,
          "berita-acara-replaced",
          this.t
        );
      }

      const [updated] = await Realisasi_permohonan.update(
        {
          berita_acara: uploadedBeritaAcara,
          updatedAt: myDate,
        },
        {
          where: { id: body.id, status: "approve" },
          transaction: this.t,
        }
      );
      if (updated !== 1) {
        const error = new Error(
          "Realisasi berubah saat berita acara diproses."
        );
        error.statusCode = 409;
        throw error;
      }

      this.message = `Berita acara berhasil diupload untuk ${info_member.fullname} - Kegiatan: ${info_kegiatan.nama_kegiatan}`;
    } catch (error) {
      console.error("Error upload berita acara:", error);
      this.fail(error, 500);
    }
  }

  async upload_berita_acara_massal() {
    const body = this.req.body;
    try {
      const uploadedBeritaAcara = this.req.beritaAcaraDocument?.filename;
      this.recordNewUpload(BERITA_ACARA_DIRECTORY, uploadedBeritaAcara);
      if (
        !resolveStoredPath(BERITA_ACARA_DIRECTORY, uploadedBeritaAcara, {
          allowedExtensions: DOCUMENT_EXTENSIONS,
        })
      ) {
        throw new Error("Berita acara tidak valid.");
      }

      let selectedIds;
      try {
        selectedIds = JSON.parse(body.selected_ids);
      } catch {
        const error = new Error("Selected IDs tidak valid.");
        error.statusCode = 400;
        throw error;
      }
      if (
        !Array.isArray(selectedIds) ||
        selectedIds.length === 0 ||
        selectedIds.some((id) => !Number.isInteger(Number(id)))
      ) {
        const error = new Error("Selected IDs tidak valid.");
        error.statusCode = 400;
        throw error;
      }
      selectedIds = [...new Set(selectedIds.map(Number))];

      await this.initialize();
      const pointers = await Realisasi_permohonan.findAll({
        where: { id: { [Op.in]: selectedIds } },
        attributes: ["id", "permohonan_id"],
        transaction: this.t,
        raw: true,
      });
      if (pointers.length !== selectedIds.length) {
        const error = new Error(
          "Sebagian realisasi tidak lagi memenuhi syarat unggah berita acara."
        );
        error.statusCode = 409;
        throw error;
      }
      const parentIds = [
        ...new Set(pointers.map((row) => Number(row.permohonan_id))),
      ].sort((left, right) => left - right);
      const parents = await Permohonan.findAll({
        where: { id: { [Op.in]: parentIds } },
        attributes: ["id", "status"],
        order: [["id", "ASC"]],
        transaction: this.t,
        lock: this.t.LOCK.UPDATE,
      });
      if (
        parents.length !== parentIds.length ||
        parents.some((row) => row.status !== "sedang_berlangsung")
      ) {
        const error = new Error(
          "Sebagian permohonan sudah tidak aktif."
        );
        error.statusCode = 409;
        throw error;
      }
      const rows = await Realisasi_permohonan.findAll({
        where: {
          id: { [Op.in]: selectedIds },
          status: "approve",
          status_realisasi: "sudah_direalisasi",
          berita_acara: null,
        },
        attributes: ["id", "berita_acara"],
        transaction: this.t,
        lock: this.t.LOCK.UPDATE,
      });
      if (rows.length !== selectedIds.length) {
        const error = new Error(
          "Sebagian realisasi tidak lagi memenuhi syarat unggah berita acara."
        );
        error.statusCode = 409;
        throw error;
      }

      const myDate = moment().format("YYYY-MM-DD HH:mm:ss");
      const [updated] = await Realisasi_permohonan.update(
        {
          berita_acara: uploadedBeritaAcara,
          updatedAt: myDate,
        },
        {
          where: {
            id: { [Op.in]: selectedIds },
            status: "approve",
            status_realisasi: "sudah_direalisasi",
            berita_acara: null,
          },
          transaction: this.t,
        }
      );
      if (updated !== selectedIds.length) {
        const error = new Error(
          "Sebagian realisasi berubah saat berita acara diproses."
        );
        error.statusCode = 409;
        throw error;
      }

      this.message = `Berita acara massal berhasil diupload untuk ${selectedIds.length} permohonan`;
    } catch (error) {
      console.error("Error upload berita acara massal:", error);
      this.fail(error, 500);
    }
  }

  async batal_realisasi() {
    const body = this.req.body;
    try {
      await this.initialize();
      const { permohonan, realisasi } = await this.lockRealisasi(body.id);
      if (realisasi.status_realisasi !== "sudah_direalisasi") {
        const error = new Error("Realisasi belum dicatat.");
        error.statusCode = 409;
        throw error;
      }

      const myDate = moment().format("YYYY-MM-DD HH:mm:ss");
      const model_r = new Model_r(this.req);
      const info_kegiatan = await model_r.info_kegiatan(permohonan.kegiatan_id);
      const info_member = await model_r.info_member(permohonan.member_id);

      const files = [
        [
          REALISASI_DOCUMENT_DIRECTORY,
          realisasi.bukti_transfer,
          "realisasi-cancelled-proof",
        ],
        [
          REALISASI_DOCUMENT_DIRECTORY,
          realisasi.mou,
          "realisasi-cancelled-mou",
        ],
        [
          BERITA_ACARA_DIRECTORY,
          realisasi.berita_acara,
          "realisasi-cancelled-agenda",
        ],
      ];
      for (const [directory, filename, reason] of files) {
        if (filename) {
          await queueStoredFileCleanup(
            directory,
            filename,
            reason,
            this.t
          );
        }
      }

      const [updated] = await Realisasi_permohonan.update(
        {
          status_realisasi: "belum_direalisasi",
          bukti_transfer: null,
          mou: null,
          tanggal_realisasi: null,
          nominal_realisasi: null,
          tipe: null,
          berita_acara: null,
          updatedAt: myDate,
        },
        {
          where: {
            id: body.id,
            status_realisasi: "sudah_direalisasi",
          },
          transaction: this.t,
        }
      );
      if (updated !== 1) {
        const error = new Error(
          "Realisasi berubah saat pembatalan diproses."
        );
        error.statusCode = 409;
        throw error;
      }

      this.message = `Realisasi berhasil dibatalkan untuk ${info_member.fullname} - Kegiatan: ${info_kegiatan.nama_kegiatan}`;
    } catch (error) {
      console.error("Error batal realisasi:", error);
      this.fail(error, 500);
    }
  }

  async response() {
    if (!this.t) {
      this.transactionOutcome = "not_started";
      this.cleanupNewUploads();
      return false;
    }

    if (this.state) {
      try {
        await writeLog(this.req, this.t, { msg: this.message });
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
        this.fail(error, 503, "COMMIT_OUTCOME_UNKNOWN");
        this.transactionOutcome = "commit_unknown";
        this.message =
          "Status penyimpanan belum pasti. Periksa data sebelum mengunggah ulang.";
        return false;
      }
    }

    return this.rollbackAfterFailure();
  }

  async rollbackAfterFailure() {
    if (this.t.finished) {
      this.transactionOutcome = "rollback_unknown";
      this.statusCode = 503;
      this.errorCode = "ROLLBACK_OUTCOME_UNKNOWN";
      this.message =
        "Status penyimpanan belum pasti. Periksa data sebelum mengunggah ulang.";
      return false;
    }

    try {
      await this.t.rollback();
      this.transactionOutcome = "rolled_back";
      this.cleanupNewUploads();
      return false;
    } catch {
      this.transactionOutcome = "rollback_unknown";
      this.statusCode = 503;
      this.errorCode = "ROLLBACK_OUTCOME_UNKNOWN";
      this.message =
        "Status penyimpanan belum pasti. Periksa data sebelum mengunggah ulang.";
      return false;
    }
  }
}

module.exports = Model_cud;
