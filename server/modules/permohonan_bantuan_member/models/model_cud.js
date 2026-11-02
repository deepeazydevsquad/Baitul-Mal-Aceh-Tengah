const {
  sequelize,
  Realisasi_permohonan,
  Permohonan,
  Kegiatan,
  Member,
  Validasi_syarat_permohonan,
} = require("../../../models");
const path = require("path");
const {
  getKegiatanPeriodWhere,
  validateKegiatanPeriod,
} = require("../../../helper/kegiatanPeriodHelper");
const {
  buildMonthlyPeriodKey,
} = require("../../../helper/monthlyPeriodHelper");

const DOCUMENT_EXTENSIONS = new Set([".pdf", ".png", ".jpg", ".jpeg"]);

class Model_cud {
  constructor(req) {
    this.req = req;
    this.transactionOutcome = "not_started";
  }

  async initialize() {
    this.t = await sequelize.transaction();
    this.state = true;
    this.statusCode = null;
    this.message = "";
    this.transactionError = null;
    this.transactionOutcome = "pending";
  }

  getAuthenticatedMemberId() {
    const memberId = Number(this.req.user?.id);
    if (
      this.req.user?.principalType !== "member" ||
      !Number.isInteger(memberId) ||
      memberId <= 0
    ) {
      const error = new Error("Identitas member tidak valid.");
      error.statusCode = 403;
      throw error;
    }
    return memberId;
  }

  getServerUploadedDocuments() {
    const uploads = Array.isArray(this.req.permohonanUploads)
      ? this.req.permohonanUploads
      : [];

    return uploads.map((fileObj) => {
      const filename = String(fileObj?.path || "");
      if (
        !filename ||
        path.basename(filename) !== filename ||
        !DOCUMENT_EXTENSIONS.has(path.extname(filename).toLowerCase())
      ) {
        const error = new Error("Referensi dokumen tidak valid.");
        error.statusCode = 400;
        throw error;
      }

      return {
        basename: String(fileObj.file_name || ""),
        path: filename,
      };
    });
  }

  async findCurrentPeriodPermohonan(memberId, year) {
    return Permohonan.findOne({
      where: { member_id: memberId },
      attributes: ["id"],
      include: [
        {
          model: Kegiatan,
          required: true,
          attributes: [],
          where: {
            ...getKegiatanPeriodWhere(),
            tahun: year,
          },
        },
      ],
      transaction: this.t,
      lock: this.t.LOCK.UPDATE,
    });
  }

  async createValidasiSyarat(realisasiId, documents, myDate) {
    if (documents.length === 0) return;

    await Validasi_syarat_permohonan.bulkCreate(
      documents.map((fileObj) => ({
        realisasi_permohonan_id: realisasiId,
        file_name: fileObj.basename,
        path: fileObj.path,
        status: "process",
        createdAt: myDate,
        updatedAt: myDate,
      })),
      { transaction: this.t }
    );
  }

  async add() {
    try {
      await this.initialize();
      const myDate = new Date();
      const body = this.req.body || {};
      const memberId = this.getAuthenticatedMemberId();

      if (
        body.member_id !== undefined &&
        String(body.member_id) !== String(memberId)
      ) {
        const error = new Error(
          "Data member tidak sesuai dengan sesi."
        );
        error.statusCode = 403;
        throw error;
      }

      // Lock the member row so concurrent add requests cannot both pass the
      // current-period duplicate check.
      const member = await Member.findByPk(memberId, {
        transaction: this.t,
        lock: this.t.LOCK.UPDATE,
        attributes: ["id", "fullname"],
      });
      if (!member) {
        const error = new Error("Member tidak terdaftar di pangkalan data.");
        error.statusCode = 400;
        throw error;
      }

      const info_kegiatan = await Kegiatan.findByPk(body.kegiatan_id, {
        transaction: this.t,
        lock: this.t.LOCK.UPDATE,
        attributes: [
          "id",
          "nama_kegiatan",
          "periode_bantuan",
          "status_kegiatan",
          "tahun",
          "start_date",
          "end_date",
        ],
      });
      const kegiatanPeriod = validateKegiatanPeriod(info_kegiatan);
      if (!kegiatanPeriod.valid) {
        const error = new Error(kegiatanPeriod.message);
        error.statusCode = kegiatanPeriod.statusCode;
        throw error;
      }

      const existingPermohonan = await this.findCurrentPeriodPermohonan(
        memberId,
        kegiatanPeriod.year
      );
      if (existingPermohonan) {
        const error = new Error("Member sudah mempunyai permohonan");
        error.statusCode = 409;
        throw error;
      }

      const documents = this.getServerUploadedDocuments();
      const bulanSekarang = kegiatanPeriod.now
        ? kegiatanPeriod.now.month() + 1
        : new Date().getMonth() + 1;

      const permohonan = await Permohonan.create(
        {
          member_id: memberId,
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

      const realisasi = await Realisasi_permohonan.create(
        {
          permohonan_id: permohonan.id,
          status: "process",
          status_realisasi: "belum_direalisasi",
          bulan:
            info_kegiatan.periode_bantuan === "bulanan"
              ? bulanSekarang
              : null,
          periode_key:
            info_kegiatan.periode_bantuan === "bulanan"
              ? buildMonthlyPeriodKey(
                  memberId,
                  info_kegiatan.id,
                  info_kegiatan.tahun,
                  bulanSekarang
                )
              : null,
          createdAt: myDate,
          updatedAt: myDate,
        },
        { transaction: this.t }
      );

      await this.createValidasiSyarat(realisasi.id, documents, myDate);

      const periodLabel =
        info_kegiatan.periode_bantuan === "bulanan"
          ? `bulanan bulan ${bulanSekarang}`
          : "tahunan";
      this.message = `Berhasil menambahkan Permohonan Bantuan ${periodLabel} atas nama ${member.fullname} untuk Kegiatan ${info_kegiatan.nama_kegiatan}`;
    } catch (error) {
      this.state = false;
      this.message = error.message;
      this.statusCode = error.statusCode || 500;
    }
  }

  async response() {
    if (!this.t) {
      this.transactionOutcome = "not_started";
      return false;
    }

    if (this.t.finished) {
      this.transactionOutcome = "unknown";
      this.statusCode = 503;
      this.message =
        "Status penyimpanan belum dapat dipastikan. Periksa riwayat permohonan sebelum mengulang.";
      return false;
    }

    if (this.state) {
      try {
        await this.t.commit();
        this.transactionOutcome = "committed";
        return true;
      } catch (error) {
        this.state = false;
        this.transactionError = error;
        this.transactionOutcome = "commit_unknown";
        this.statusCode = 503;
        this.message =
          "Status penyimpanan belum dapat dipastikan. Periksa riwayat permohonan sebelum mengulang.";
        return false;
      }
    }

    try {
      await this.t.rollback();
      this.transactionOutcome = "rolled_back";
    } catch (error) {
      this.transactionError = error;
      this.transactionOutcome = "rollback_unknown";
      this.statusCode = 503;
      this.message =
        "Status transaksi belum dapat dipastikan. Hubungi administrator.";
    }
    return false;
  }

  isUploadCleanupSafe() {
    return (
      !this.state &&
      ["not_started", "rolled_back"].includes(this.transactionOutcome)
    );
  }
}

module.exports = Model_cud;
