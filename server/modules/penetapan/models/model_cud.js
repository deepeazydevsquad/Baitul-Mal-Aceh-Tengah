const {
  sequelize,
  Surveyor_kegiatan,
  Syarat_kegiatan,
  Kriteria,
} = require("../../../models");
const { writeLog } = require("../../../helper/writeLogHelper");
const moment = require("moment");
const crypto = require("crypto");
const path = require("path");
const {
  removeStoredFile,
  resolveStoredPath,
} = require("../../../helper/uploadStorageHelper");

const SK_DIRECTORY = path.resolve(
  __dirname,
  "../../../uploads/img/sk_penetapan"
);
const SK_EXTENSIONS = new Set([".jpg", ".jpeg", ".png"]);

class Model_cud {
  constructor(req) {
    this.req = req;
  }

  async initialize() {
    this.t = await sequelize.transaction();
    this.state = true;
  }

  getUploadedSk() {
    const filename = this.req.penetapanSk?.filename;
    if (!filename) return null;
    if (
      !resolveStoredPath(SK_DIRECTORY, filename, {
        allowedExtensions: SK_EXTENSIONS,
      })
    ) {
      throw new Error("Referensi SK tidak valid.");
    }
    return filename;
  }

  removeUploadedSk() {
    removeStoredFile(SK_DIRECTORY, this.req.penetapanSk?.filename, {
      allowedExtensions: SK_EXTENSIONS,
    });
  }

  // generate access_code random 200 char
  async access_code() {
    const length = 200;
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    const bytes = crypto.randomBytes(length);
    let out = "";
    for (let i = 0; i < length; i++) {
      out += chars[bytes[i] % chars.length];
    }
    return out;
  }

  // =============================
  // Syarat
  // =============================
  async editSyarat() {
    const body = this.req.body; // array of syarat baru
    await this.initialize();
    const myDate = moment().format("YYYY-MM-DD HH:mm:ss");

    try {
      if (!Array.isArray(body) || body.length === 0) {
        throw new Error("Data syarat tidak boleh kosong");
      }

      // ambil kegiatan_id dari item pertama
      const kegiatanId = body[0].kegiatan_id;

      // 1. Hapus semua syarat lama untuk kegiatan_id ini
      await Syarat_kegiatan.destroy({
        where: { kegiatan_id: kegiatanId },
        transaction: this.t,
      });

      // 2. Insert ulang syarat baru
      const payload = body.map((item) => ({
        kegiatan_id: kegiatanId,
        syarat_id: item.syarat_id,
        createdAt: myDate,
        updatedAt: myDate,
      }));

      const insert = await Syarat_kegiatan.bulkCreate(payload, {
        transaction: this.t,
      });

      this.message = `Syarat kegiatan dengan kegiatan_id ${kegiatanId} berhasil diperbarui (${insert.length} syarat baru).`;
      return insert;
    } catch (error) {
      console.error("Error in editSyarat:", error);
      this.state = false;
      this.message = error.message;
    }
  }

  // =============================
  // Kriteria
  // =============================
  async editKriteria() {
    const body = this.req.body; // array of kriteria baru
    const myDate = moment().format("YYYY-MM-DD HH:mm:ss");

    await this.initialize();

    try {
      if (!Array.isArray(body) || body.length === 0) {
        throw new Error("Data kriteria tidak boleh kosong");
      }

      // ambil kegiatan_id dari item pertama
      const kegiatanId = body[0].kegiatan_id;

      // 1. Hapus semua kriteria lama
      await Kriteria.destroy({
        where: { kegiatan_id: kegiatanId },
        transaction: this.t,
      });

      // 2. Insert ulang kriteria baru
      const payload = body.map((item) => ({
        kegiatan_id: kegiatanId,
        name: item.name,
        createdAt: myDate,
        updatedAt: myDate,
      }));

      const insert = await Kriteria.bulkCreate(payload, {
        transaction: this.t,
      });

      this.message = `Kriteria kegiatan dengan kegiatan_id ${kegiatanId} berhasil diperbarui (${insert.length} kriteria baru).`;
      return insert;
    } catch (error) {
      console.error("Error in editKriteria:", error);
      this.state = false;
      this.message = error.message;
    }
  }

  async addSurveyor() {
    const body = this.req.body;
    const file = this.req.file;
    const myDate = moment().format("YYYY-MM-DD HH:mm:ss");

    await this.initialize();

    try {
      const kegiatanId = body.kegiatan_id;

      // cari sk lama sebelum dihapus
      const existing = await Surveyor_kegiatan.findOne({
        where: { kegiatan_id: kegiatanId },
      });
      const oldSk = existing ? existing.sk : null;

      const uploadedSk = this.getUploadedSk();
      let skFileName = oldSk;
      if (uploadedSk) {
        skFileName = uploadedSk;
        if (
          resolveStoredPath(SK_DIRECTORY, oldSk, {
            allowedExtensions: SK_EXTENSIONS,
          })
        ) {
          this.oldSkToRemoveAfterCommit = oldSk;
        }
      }

      // parse surveyor array
      let surveyorArray = body.surveyor;
      if (typeof body.surveyor === "string") {
        surveyorArray = JSON.parse(body.surveyor);
      }

      if (!Array.isArray(surveyorArray) || surveyorArray.length === 0) {
        throw new Error("Data surveyor tidak boleh kosong");
      }

      // hapus surveyor lama
      await Surveyor_kegiatan.destroy({
        where: { kegiatan_id: kegiatanId },
        transaction: this.t,
      });

      // insert surveyor baru
      const payload = await Promise.all(
        surveyorArray.map(async (item) => ({
          kegiatan_id: kegiatanId,
          sk: skFileName,
          surveyor_id: item.surveyor_id,
          status: "active",
          access_code: await this.access_code(),
          createdAt: myDate,
          updatedAt: myDate,
        }))
      );

      const insert = await Surveyor_kegiatan.bulkCreate(payload, {
        transaction: this.t,
      });

      this.message = `Surveyor kegiatan dengan kegiatan_id ${kegiatanId} berhasil diperbarui (${insert.length} surveyor baru).`;
      return insert;
    } catch (error) {
      console.error("Error in addSurveyor:", error);
      this.state = false;
      this.message = error.message;
      this.removeUploadedSk();
    }
  }

  // =============================
  // Response handler
  // =============================
  async response() {
    if (this.state) {
      await writeLog(this.req, this.t, {
        msg: this.message,
      });
      await this.t.commit();
      if (this.oldSkToRemoveAfterCommit) {
        removeStoredFile(SK_DIRECTORY, this.oldSkToRemoveAfterCommit, {
          allowedExtensions: SK_EXTENSIONS,
        });
      }
      return true;
    } else {
      await this.t.rollback();
      this.removeUploadedSk();
      return false;
    }
  }
}

Model_cud.SK_DIRECTORY = SK_DIRECTORY;
Model_cud.removeSk = (filename) =>
  removeStoredFile(SK_DIRECTORY, filename, {
    allowedExtensions: SK_EXTENSIONS,
  });

module.exports = Model_cud;
