const {
  sequelize,
  Op,
  Kegiatan,
  Desa_area_kegiatan,
  Kecamatan_area_kegiatan,
  Asnaf,
  Program,
  Realisasi_permohonan,
  Permohonan,
} = require("../../../models");
const Model_r = require("../models/model_r");
const { writeLog } = require("../../../helper/writeLogHelper");
const path = require("path");
const moment = require("moment");
const {
  removeStoredFile,
  resolveStoredPath,
} = require("../../../helper/uploadStorageHelper");

const PROGRAM_BANNER_DIRECTORY = path.resolve(
  __dirname,
  "../../../uploads/img/program_kegiatan_bantuan"
);
const PROGRAM_BANNER_EXTENSIONS = new Set([".jpg", ".jpeg", ".png"]);

class Model_cud {
  constructor(req) {
    this.req = req;
  }

  async initialize() {
    this.t = await sequelize.transaction();
    this.state = true;
  }

  getUploadedBanner() {
    const filename = this.req.programKegiatanBanner?.filename;
    if (!filename) return null;
    if (
      !resolveStoredPath(PROGRAM_BANNER_DIRECTORY, filename, {
        allowedExtensions: PROGRAM_BANNER_EXTENSIONS,
      })
    ) {
      throw new Error("Referensi banner tidak valid.");
    }
    return filename;
  }

  scheduleBannerRemoval(filename) {
    if (
      !resolveStoredPath(PROGRAM_BANNER_DIRECTORY, filename, {
        allowedExtensions: PROGRAM_BANNER_EXTENSIONS,
      })
    ) {
      return;
    }
    this.bannersToRemoveAfterCommit = [
      ...(this.bannersToRemoveAfterCommit || []),
      filename,
    ];
  }

  removeUploadedBanner() {
    removeStoredFile(
      PROGRAM_BANNER_DIRECTORY,
      this.req.programKegiatanBanner?.filename,
      { allowedExtensions: PROGRAM_BANNER_EXTENSIONS }
    );
  }

  async add(result_kode, result_slug) {
    await this.initialize();
    const myDate = moment(new Date()).format("YYYY-MM-DD HH:mm:ss");
    const body = this.req.body;

    try {
      const insert = await Kegiatan.create(
        {
          asnaf_id: body.sumber_dana == "zakat" ? body.asnaf_id : null,
          program_id: body.program_id,
          kode: result_kode,
          nama_kegiatan: body.nama_kegiatan,
          slug: result_slug,
          status_tampil:
            body.status_tampil === "true" ? "tampil" : "tidak_tampil",
          jumlah_dana: body.jumlah_dana,
          jumlah_maksimal_nominal_bantuan: body.jumlah_maksimal_nominal_bantuan,
          jumlah_target_penerima: body.jumlah_target_penerima,
          sumber_dana: body.sumber_dana,
          area_penyaluran: body.area_penyaluran,
          jenis_penyaluran: body.jenis_penyaluran,
          tahun: body.tahun,
          start_date: body.start_date
            ? moment(body.start_date).format("YYYY-MM-DD")
            : null,
          end_date: body.end_date
            ? moment(body.end_date).format("YYYY-MM-DD")
            : null,
          name: body.name,
          banner: this.getUploadedBanner(),
          desc: body.desc,
          createdAt: myDate,
          updatedAt: myDate,
        },
        {
          transaction: this.t,
        }
      );
      const promises = [];

      if (
        typeof body.desa_penyaluran === "string" &&
        body.desa_penyaluran !== ""
      ) {
        body.desa_penyaluran = JSON.parse(body.desa_penyaluran);
      }

      if (
        typeof body.kecamatan_penyaluran === "string" &&
        body.kecamatan_penyaluran !== ""
      ) {
        body.kecamatan_penyaluran = JSON.parse(body.kecamatan_penyaluran);
      }

      // Desa
      if (body.desa_penyaluran && Array.isArray(body.desa_penyaluran)) {
        body.desa_penyaluran.forEach((desa) => {
          promises.push(
            Desa_area_kegiatan.create(
              {
                kegiatan_id: insert.id,
                desa_id: desa.desa_id,
                kuota: desa.kuota,
                createdAt: myDate,
                updatedAt: myDate,
              },
              {
                transaction: this.t,
              }
            )
          );
        });
      }

      // Kecamatan
      if (
        body.kecamatan_penyaluran &&
        Array.isArray(body.kecamatan_penyaluran)
      ) {
        body.kecamatan_penyaluran.forEach((kec) => {
          promises.push(
            Kecamatan_area_kegiatan.create(
              {
                kegiatan_id: insert.id,
                kecamatan_id: kec.kecamatan_id,
                kuota: kec.kuota,
                createdAt: myDate,
                updatedAt: myDate,
              },
              {
                transaction: this.t,
              }
            )
          );
        });
      }

      await Promise.all(promises);

      this.message = `Menambahkan Kegiatan Baru dengan Nama Kegiatan: ${body.nama_kegiatan} dan ID Kegiatan: ${insert.id}`;
    } catch (error) {
      this.state = false;
      this.message = error.message;
      this.removeUploadedBanner();
    }
  }

  async edit() {
    await this.initialize();
    const myDate = moment().format("YYYY-MM-DD HH:mm:ss");
    const body = this.req.body;

    try {
      const currentKegiatan = await Kegiatan.findByPk(body.id, {
        transaction: this.t,
        lock: this.t.LOCK.UPDATE,
      });
      if (!currentKegiatan) {
        const error = new Error("Program kegiatan tidak ditemukan.");
        error.statusCode = 404;
        throw error;
      }
      if (Number(currentKegiatan.tahun) !== Number(body.tahun)) {
        const usedRealisasi = await Realisasi_permohonan.findOne({
          where: {},
          attributes: ["id"],
          include: [
            {
              model: Permohonan,
              required: true,
              attributes: [],
              where: { kegiatan_id: body.id },
            },
          ],
          transaction: this.t,
          lock: this.t.LOCK.UPDATE,
        });
        if (usedRealisasi) {
          const error = new Error(
            "Tahun kegiatan tidak dapat diubah setelah memiliki realisasi."
          );
          error.statusCode = 409;
          throw error;
        }
      }

      const model_r = new Model_r(this.req);
      const info_program = await model_r.info_program_kegiatan_bantuan(body.id);

      let newBanner = info_program.banner;

      // === CASE 1: Upload banner baru ===
      const uploadedBanner = this.getUploadedBanner();
      if (uploadedBanner) {
        newBanner = uploadedBanner;
        this.scheduleBannerRemoval(info_program.banner);
      }

      // === UPDATE Kegiatan ===
      const [updated] = await Kegiatan.update(
        {
          asnaf_id: body.sumber_dana == "zakat" ? body.asnaf_id : null,
          program_id: body.program_id,
          nama_kegiatan: body.nama_kegiatan,
          slug: body.slug,
          status_tampil:
            body.status_tampil === "true" ? "tampil" : "tidak_tampil",
          jumlah_dana: body.jumlah_dana,
          jumlah_maksimal_nominal_bantuan: body.jumlah_maksimal_nominal_bantuan,
          jumlah_target_penerima: body.jumlah_target_penerima,
          sumber_dana: body.sumber_dana,
          area_penyaluran: body.area_penyaluran,
          jenis_penyaluran: body.jenis_penyaluran,
          tahun: body.tahun,
          start_date: moment(body.start_date).format("YYYY-MM-DD"),
          end_date: moment(body.end_date).format("YYYY-MM-DD"),
          name: body.name,
          banner: newBanner,
          desc: body.desc,
          updatedAt: myDate,
        },
        {
          where: { id: body.id },
          transaction: this.t,
        }
      );
      if (updated !== 1) {
        const error = new Error("Kegiatan berubah saat diperbarui.");
        error.statusCode = 409;
        throw error;
      }

      // === Hapus dulu relasi lama, lalu insert ulang ===
      await Desa_area_kegiatan.destroy({
        where: { kegiatan_id: body.id },
        transaction: this.t,
      });
      await Kecamatan_area_kegiatan.destroy({
        where: { kegiatan_id: body.id },
        transaction: this.t,
      });

      // parse string -> JSON kalau perlu
      if (
        typeof body.desa_penyaluran === "string" &&
        body.desa_penyaluran !== ""
      ) {
        body.desa_penyaluran = JSON.parse(body.desa_penyaluran);
      }
      if (
        typeof body.kecamatan_penyaluran === "string" &&
        body.kecamatan_penyaluran !== ""
      ) {
        body.kecamatan_penyaluran = JSON.parse(body.kecamatan_penyaluran);
      }

      const promises = [];

      if (Array.isArray(body.desa_penyaluran)) {
        body.desa_penyaluran.forEach((desa) => {
          promises.push(
            Desa_area_kegiatan.create(
              {
                kegiatan_id: body.id,
                desa_id: desa.desa_id,
                kuota: desa.kuota,
                createdAt: myDate,
                updatedAt: myDate,
              },
              { transaction: this.t }
            )
          );
        });
      }

      if (Array.isArray(body.kecamatan_penyaluran)) {
        body.kecamatan_penyaluran.forEach((kec) => {
          promises.push(
            Kecamatan_area_kegiatan.create(
              {
                kegiatan_id: body.id,
                kecamatan_id: kec.kecamatan_id,
                kuota: kec.kuota,
                createdAt: myDate,
                updatedAt: myDate,
              },
              { transaction: this.t }
            )
          );
        });
      }

      await Promise.all(promises);

      this.message = `Memperbarui Kegiatan dengan Nama: ${body.nama_kegiatan} dan ID: ${body.id}`;
    } catch (error) {
      this.state = false;
      this.message = error.message;
      this.statusCode = error.statusCode || 500;
      this.removeUploadedBanner();
    }
  }

  async edit_status_program_bantuan() {
    await this.initialize();
    const body = this.req.body;

    try {
      const model_r = new Model_r(this.req);
      const info_program = await model_r.info_program_kegiatan_bantuan(body.id);

      let newStatus;
      if (info_program.status_kegiatan === "sedang_berlangsung") {
        newStatus = "selesai";
      } else {
        newStatus = "sedang_berlangsung";
      }

      await Kegiatan.update(
        { status_kegiatan: newStatus },
        {
          where: { id: body.id },
          transaction: this.t,
        }
      );

      this.message = `Memperbarui Status Program Kegiatan Bantuan dengan ID: ${body.id} dari ${info_program.status_kegiatan} menjadi ${newStatus}`;
    } catch (error) {
      this.state = false;
      this.message = error.message;
    }
  }

  async delete() {
    await this.initialize();
    const body = this.req.body;
    const model_r = new Model_r(this.req);

    try {
      const info = await model_r.info_program_kegiatan_bantuan(body.id);
      if (!info) {
        throw new Error(`Program dengan ID ${body.id} tidak ditemukan`);
      }

      // Hapus record dalam transaction
      await Kegiatan.destroy({
        where: { id: body.id },
        transaction: this.t,
      });

      this.scheduleBannerRemoval(info.banner);

      this.message = `Menghapus Program Kegiatan Bantuan: ${info.nama_kegiatan} (ID: ${info.id})`;
    } catch (error) {
      this.state = false;
      this.message = error.message;
    }
  }

  // response
  async response() {
    if (this.state) {
      await writeLog(this.req, this.t, {
        msg: this.message,
      });
      await this.t.commit();
      for (const filename of this.bannersToRemoveAfterCommit || []) {
        removeStoredFile(PROGRAM_BANNER_DIRECTORY, filename, {
          allowedExtensions: PROGRAM_BANNER_EXTENSIONS,
        });
      }
      return true;
    } else {
      await this.t.rollback();
      this.removeUploadedBanner();
      return false;
    }
  }
}

Model_cud.PROGRAM_BANNER_DIRECTORY = PROGRAM_BANNER_DIRECTORY;
Model_cud.removeBanner = (filename) =>
  removeStoredFile(PROGRAM_BANNER_DIRECTORY, filename, {
    allowedExtensions: PROGRAM_BANNER_EXTENSIONS,
  });

module.exports = Model_cud;
