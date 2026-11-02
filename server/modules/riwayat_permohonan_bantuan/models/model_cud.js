const {
  Op,
  sequelize,
  Permohonan,
  Realisasi_permohonan,
  Validasi_syarat_permohonan,
  Survey_permohonan,
  Monev,
} = require("../../../models");
const { writeLog } = require("../../../helper/writeLogHelper");

class Model_cud {
  constructor(req) {
    this.req = req;
    this.state = false;
    this.message = null;
    this.t = null;
    this.statusCode = 400;
    this.errorCode = "PERMOHONAN_CANCEL_FAILED";
    this.transactionOutcome = "not_started";
  }

  async initialize() {
    this.t = await sequelize.transaction();
    this.transactionOutcome = "pending";
  }

  async delete() {
    const body = this.req.body;
    try {
      await this.initialize();
      const memberId = Number(this.req.user?.id);
      if (!Number.isInteger(memberId) || memberId <= 0) {
        const error = new Error("Identitas member tidak valid.");
        error.statusCode = 403;
        throw error;
      }

      const permohonan = await Permohonan.findOne({
        where: { id: body.id, member_id: memberId },
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
          "Permohonan sudah dibatalkan atau tidak lagi berlangsung."
        );
        error.statusCode = 409;
        throw error;
      }

      const realisasi = await Realisasi_permohonan.findOne({
        where: { permohonan_id: permohonan.id },
        attributes: [
          "id",
          "status",
          "status_realisasi",
          "biaya_disetujui",
        ],
        transaction: this.t,
        lock: this.t.LOCK.UPDATE,
        raw: true,
      });

      const [survey, monev, validatedFile] = await Promise.all([
        Survey_permohonan.findOne({
          where: { permohonan_id: permohonan.id },
          attributes: ["id"],
          transaction: this.t,
          lock: this.t.LOCK.UPDATE,
        }),
        Monev.findOne({
          where: { permohonan_id: permohonan.id },
          attributes: ["id"],
          transaction: this.t,
          lock: this.t.LOCK.UPDATE,
        }),
        Validasi_syarat_permohonan.findOne({
          where: {
            realisasi_permohonan_id: realisasi?.id ?? -1,
            status: { [Op.in]: ["approve", "reject"] },
          },
          attributes: ["id"],
          transaction: this.t,
          lock: this.t.LOCK.UPDATE,
        }),
      ]);

      const realisasiDiproses =
        realisasi &&
        (realisasi.status !== "process" ||
          realisasi.status_realisasi === "sudah_direalisasi" ||
          realisasi.biaya_disetujui != null);
      if (
        realisasiDiproses ||
        Boolean(survey) ||
        Boolean(monev) ||
        Boolean(validatedFile)
      ) {
        const error = new Error(
          "Permohonan yang sudah diverifikasi atau diproses tidak dapat dibatalkan."
        );
        error.statusCode = 409;
        throw error;
      }

      const [updated] = await Permohonan.update(
        {
          status: "terhenti",
          alasan_penolakan: "Dibatalkan oleh member.",
        },
        {
        where: {
          id: permohonan.id,
          member_id: memberId,
          status: "sedang_berlangsung",
        },
        transaction: this.t,
        },
      );
      if (updated !== 1) {
        const error = new Error(
          "Permohonan berubah saat diproses. Muat ulang data sebelum mencoba lagi."
        );
        error.statusCode = 409;
        throw error;
      }

      this.state = true;
      this.message =
        "Permohonan berhasil dibatalkan. Riwayatnya tetap tersimpan.";
    } catch (err) {
      console.error("Gagal membatalkan riwayat permohonan.");
      this.message = err.message || "Terjadi kesalahan saat menghapus data";
      this.state = false;
      this.statusCode = err.statusCode || 500;
    }
  }

  async response() {
    if (!this.t) {
      this.transactionOutcome = "not_started";
      return false;
    }

    if (this.state) {
      try {
        await writeLog(this.req, this.t, { msg: this.message });
      } catch (error) {
        this.failForResponse(error);
        return this.rollbackAfterFailure();
      }

      try {
        await this.t.commit();
        this.transactionOutcome = "committed";
        return true;
      } catch {
        this.transactionOutcome = "commit_unknown";
        this.statusCode = 503;
        this.errorCode = "CANCEL_COMMIT_UNCERTAIN";
        this.message =
          "Status pembatalan belum pasti. Periksa riwayat sebelum mencoba lagi.";
        return false;
      }
    }

    return this.rollbackAfterFailure();
  }

  failForResponse(error) {
    this.state = false;
    this.statusCode = error?.statusCode || 500;
    this.message = error?.message || "Gagal menyimpan pembatalan.";
  }

  async rollbackAfterFailure() {
    try {
      await this.t.rollback();
      this.transactionOutcome = "rolled_back";
    } catch {
      this.transactionOutcome = "rollback_unknown";
      this.statusCode = 503;
      this.errorCode = "CANCEL_ROLLBACK_UNCERTAIN";
      this.message =
        "Status pembatalan belum pasti. Periksa riwayat sebelum mencoba lagi.";
    }
    return false;
  }
}

module.exports = Model_cud;
