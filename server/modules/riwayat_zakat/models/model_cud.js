const jwt = require("jsonwebtoken");
const fs = require("fs").promises;
const path = require("path");
const { sequelize, Riwayat_pengumpulan, Member } = require("../../../models");
const Model_r = require("../models/model_r");
const { writeLog } = require("../../../helper/writeLogHelper");
const moment = require("moment");

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

    const authHeader = this.req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    const decoded = jwt.decode(token);

    try {
      const insert = await Riwayat_pengumpulan.create(
        {
          member_id: body.member_id,
          wakalah_id: body.wakalah_id,
          invoice: invoice,
          tipe: body.tipe_zakat,
          nominal: body.nominal,
          kode: "000",
          tipe_pembayaran: body.tipe_pembayaran,
          konfirmasi_pembayaran: "belum_dikirim",
          posisi_uang:
            body.tipe_pembayaran == "cash" ? "kantor_baitulmal" : "bank",
          nama_petugas: decoded.name,
          jabatan_petugas: decoded.jabatan,
          createdAt: myDate,
          updatedAt: myDate,
        },
        {
          transaction: this.t,
        },
      );

      this.message = `Menambahkan Riwayat pengumpulan Baru dengan Invoice Riwayat pengumpulan: ${invoice} dan ID Riwayat pengumpulan: ${insert.id}`;
    } catch (error) {
      this.state = false;
    }
  }

  async approve_online() {
    await this.initialize();
    const body = this.req.body;

    const authHeader = this.req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    const decoded = jwt.decode(token);

    try {
      const model_r = new Model_r(this.req);
      const info_riwayat_zakat = await model_r.info_riwayat_zakat(body.id);

      await Riwayat_pengumpulan.update(
        {
          konfirmasi_pembayaran: "sudah_dikirim",
          nama_petugas: decoded.name,
          jabatan_petugas: decoded.jabatan,
          status: "success",
          updatedAt: new Date(),
        },
        {
          where: { id: body.id },
          transaction: this.t,
        },
      );

      this.message = `Menyetujui Pembayaran Zakat Secara Online dengan Nama member Riwayat_pengumpulan: ${info_riwayat_zakat.member_name} dan ID Riwayat pengumpulan: ${info_riwayat_zakat.id}`;
    } catch (error) {
      this.state = false;
    }
  }

  async reject_online() {
    await this.initialize();
    const body = this.req.body;

    const authHeader = this.req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    const decoded = jwt.decode(token);

    try {
      const model_r = new Model_r(this.req);
      const info_riwayat_zakat = await model_r.info_riwayat_zakat(body.id);

      await Riwayat_pengumpulan.update(
        {
          status: "failed",
          alasan_penolakan: body.alasan,
          nama_petugas: decoded.name,
          jabatan_petugas: decoded.jabatan,
          updatedAt: new Date(),
        },
        {
          where: { id: body.id },
          transaction: this.t,
        },
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
      console.log(body);

      await Riwayat_pengumpulan.destroy({
        where: { id: body.id },
        transaction: this.t,
      });

      if (info_riwayat_zakat.bukti_transfer) {
        this.filesToDelete.push(
          path.resolve(process.cwd(), info_riwayat_zakat.bukti_transfer),
        );
      }

      if (info_riwayat_zakat.bukti_setoran) {
        this.filesToDelete.push(
          path.resolve(process.cwd(), info_riwayat_zakat.bukti_setoran),
        );
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
      const model_r = new Model_r(this.req);
      const info_riwayat_zakat = await model_r.info_riwayat_zakat(body.id);

      await Riwayat_pengumpulan.update(
        {
          bukti_transfer: body.buktiPath,
          nominal_transfer: body.nominal_transfer,
          status: "success",
          konfirmasi_pembayaran: "sudah_dikirim",
          updatedAt: new Date(),
        },
        {
          where: { id: body.id },
          transaction: this.t,
        },
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
      const model_r = new Model_r(this.req);
      const info_riwayat_zakat = await model_r.info_riwayat_zakat(body.id);

      await Riwayat_pengumpulan.update(
        {
          bukti_setoran: body.buktiPath,
          nominal_setoran: body.nominal_setoran,
          status: "success",
          posisi_uang: "bank",
          konfirmasi_pembayaran: "sudah_dikirim",
          updatedAt: new Date(),
        },
        {
          where: { id: body.id },
          transaction: this.t,
        },
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
      for (const filePath of this.filesToDelete || []) {
        try {
          await fs.unlink(filePath);
        } catch (err) {
          if (err.code !== "ENOENT")
            console.error("Failed to delete file:", filePath, err);
        }
      }
      return true;
    } else {
      await this.t.rollback();
      return false;
    }
  }
}

module.exports = Model_cud;
