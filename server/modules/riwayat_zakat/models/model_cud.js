const path = require("path");
const { sequelize, Riwayat_pengumpulan, Member } = require("../../../models");
const Model_r = require("../models/model_r");
const { writeLog } = require("../../../helper/writeLogHelper");
const moment = require("moment");
const {
  isSafeStoredFilename,
  removeStoredFile,
} = require("../../../helper/uploadStorageHelper");

const ZAKAT_PROOF_DIRECTORIES = {
  transfer: path.resolve(__dirname, "../../../uploads/img/zakat/bukti_transfer"),
  cash: path.resolve(__dirname, "../../../uploads/img/zakat/bukti_setoran"),
};

class Model_cud {
  constructor(req) {
    this.req = req;
    this.filesToDelete = [];
  }

  async initialize() {
    this.t = await sequelize.transaction();
    this.state = true;
  }

  async add(invoice) {
    await this.initialize();
    const myDate = moment(new Date()).format("YYYY-MM-DD HH:mm:ss");
    const body = this.req.body;

    const actor = this.req.user;

    try {
      const insert = await Riwayat_pengumpulan.create(
        {
          member_id: body.member_id,
          invoice: invoice,
          tipe: body.tipe_zakat,
          nominal: body.nominal,
          kode: "000",
          tipe_pembayaran: body.tipe_pembayaran,
          konfirmasi_pembayaran: "belum_dikirim",
          posisi_uang:
            body.tipe_pembayaran == "cash" ? "kantor_baitulmal" : "bank",
          nama_petugas: actor.name,
          jabatan_petugas: actor.jabatan,
          wakalah_id: body.wakalah_id || null,
          createdAt: myDate,
          updatedAt: myDate,
        },
        {
          transaction: this.t,
        }
      );

      this.message = `Menambahkan Riwayat pengumpulan Baru dengan Invoice Riwayat pengumpulan: ${invoice} dan ID Riwayat pengumpulan: ${insert.id}`;
    } catch (error) {
      this.state = false;
    }
  }

  async approve_online() {
    await this.initialize();
    const body = this.req.body;

    const actor = this.req.user;

    try {
      const model_r = new Model_r(this.req);
      const info_riwayat_zakat = await model_r.info_riwayat_zakat(body.id);

      await Riwayat_pengumpulan.update(
        {
          konfirmasi_pembayaran: "sudah_dikirim",
          nama_petugas: actor.name,
          jabatan_petugas: actor.jabatan,
          status: "success",
          updatedAt: new Date(),
        },
        {
          where: { id: body.id },
          transaction: this.t,
        }
      );

      this.message = `Menyetujui Pembayaran Zakat Secara Online dengan Nama member Riwayat_pengumpulan: ${info_riwayat_zakat.member_name} dan ID Riwayat pengumpulan: ${info_riwayat_zakat.id}`;
    } catch (error) {
      this.state = false;
    }
  }

  async reject_online() {
    await this.initialize();
    const body = this.req.body;

    const actor = this.req.user;

    try {
      const model_r = new Model_r(this.req);
      const info_riwayat_zakat = await model_r.info_riwayat_zakat(body.id);

      await Riwayat_pengumpulan.update(
        {
          status: "failed",
          alasan_penolakan: body.alasan,
          nama_petugas: actor.name,
          jabatan_petugas: actor.jabatan,
          updatedAt: new Date(),
        },
        {
          where: { id: body.id },
          transaction: this.t,
        }
      );

      this.message = `Menolak Pembayaran Zakat Secara Online  dengan Nama member Riwayat_pengumpulan: ${info_riwayat_zakat.member_name} dan ID Riwayat pengumpulan: ${info_riwayat_zakat.id}`;
    } catch (error) {
      this.state = false;
    }
  }

  async delete() {
    await this.initialize();
    const body = this.req.body;

    try {
      const model_r = new Model_r(this.req);
      const info_riwayat_zakat = await model_r.info_riwayat_zakat(body.id);
      await Riwayat_pengumpulan.destroy({
        where: { id: body.id },
        transaction: this.t,
      });

      if (info_riwayat_zakat.bukti_transfer) {
        this.filesToDelete.push({
          directory: ZAKAT_PROOF_DIRECTORIES.transfer,
          filename: info_riwayat_zakat.bukti_transfer,
        });
      }

      if (info_riwayat_zakat.bukti_setoran) {
        this.filesToDelete.push({
          directory: ZAKAT_PROOF_DIRECTORIES.cash,
          filename: info_riwayat_zakat.bukti_setoran,
        });
      }

      this.message = `Menghapus Riwayat pengumpulan dengan Nama member Riwayat_pengumpulan: ${info_riwayat_zakat.member_name}, nominal zakat sebesar: ${info_riwayat_zakat.nominal} dan ID Riwayat pengumpulan: ${info_riwayat_zakat.id}`;
    } catch (error) {
      this.state = false;
    }
  }

  async upload_bukti_transfer() {
    await this.initialize();
    const body = this.req.body;

    try {
      const proofPath = this.req.transactionProof?.filename;
      if (
        !isSafeStoredFilename(proofPath, new Set([".jpg"]))
      ) {
        throw new Error("Bukti transfer tidak valid.");
      }
      const model_r = new Model_r(this.req);
      const info_riwayat_zakat = await model_r.info_riwayat_zakat(body.id);

      await Riwayat_pengumpulan.update(
        {
          bukti_transfer: proofPath,
          nominal_transfer: body.nominal_transfer,
          status: "success",
          konfirmasi_pembayaran: "sudah_dikirim",
          updatedAt: new Date(),
        },
        {
          where: { id: body.id },
          transaction: this.t,
        }
      );

      this.message = `Mengunggah Bukti Transfer untuk Riwayat pengumpulan dengan Nama member Riwayat_pengumpulan: ${info_riwayat_zakat.member_name} dan ID Riwayat pengumpulan: ${info_riwayat_zakat.id}`;
    } catch (error) {
      this.state = false;
    }
  }

  async upload_bukti_setoran() {
    await this.initialize();
    const body = this.req.body;

    try {
      const proofPath = this.req.transactionProof?.filename;
      if (
        !isSafeStoredFilename(proofPath, new Set([".jpg"]))
      ) {
        throw new Error("Bukti setoran tidak valid.");
      }
      const model_r = new Model_r(this.req);
      const info_riwayat_zakat = await model_r.info_riwayat_zakat(body.id);

      await Riwayat_pengumpulan.update(
        {
          bukti_setoran: proofPath,
          nominal_setoran: body.nominal_setoran,
          status: "success",
          posisi_uang: "bank",
          konfirmasi_pembayaran: "sudah_dikirim",
          updatedAt: new Date(),
        },
        {
          where: { id: body.id },
          transaction: this.t,
        }
      );

      this.message = `Mengunggah Bukti Transfer untuk Riwayat pengumpulan dengan Nama member Riwayat_pengumpulan: ${info_riwayat_zakat.member_name} dan ID Riwayat pengumpulan: ${info_riwayat_zakat.id}`;
    } catch (error) {
      console.log("=======error2");
      console.log(error);
      console.log("=======error2");
      this.state = false;
    }
  }

  async response() {
    if (this.state) {
      await writeLog(this.req, this.t, {
        msg: this.message,
      });
      await this.t.commit();
      // hapus file setelah commit (tidak bisa di-rollback jika terjadi kegagalan)
      for (const file of this.filesToDelete || []) {
        removeStoredFile(file.directory, file.filename, {
          allowedExtensions: new Set([".jpg", ".jpeg", ".png"]),
        });
      }
      return true;
    } else {
      await this.t.rollback();
      return false;
    }
  }
}

module.exports = Model_cud;
