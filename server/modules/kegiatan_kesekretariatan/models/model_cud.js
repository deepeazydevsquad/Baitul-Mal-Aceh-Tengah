const { sequelize, Kegiatan_keseketariatan } = require("../../../models");
const { writeLog } = require("../../../helper/writeLogHelper");
const path = require("path");
const fs = require("fs");
const moment = require("moment");

class Model_cud {
  constructor(req) {
    this.req = req;
  }

  async initialize() {
    this.t = await sequelize.transaction();
    this.state = true;
  }

  async add() {
    await this.initialize();
    const myDate = moment(new Date()).format("YYYY-MM-DD HH:mm:ss");
    const body = this.req.body;
    try {
      const insert = await Kegiatan_keseketariatan.create(
        {
          kode: body.kode,
          nama_kegiatan: body.nama_kegiatan,
          sumber_dana: body.sumber_dana,
          penerima: body.penerima,
          jenis_penerima: body.jenis_penerima,
          nominal_kegiatan: body.nominal_kegiatan,
          area_penyaluran: body.area_penyaluran,
          desa_id: body.desa_id || null,
          tanggal_penyaluran: body.tanggal_penyaluran,
          createdAt: myDate,
          updatedAt: myDate,
        },
        {
          transaction: this.t,
        }
      );

      this.message = `Menambahkan Kegiatan Baru dengan Nama Kegiatan: ${body.nama_kegiatan}, Sumber Dana: ${body.sumber_dana}, dan ID: ${insert.id}`;
    } catch (error) {
      this.state = false;
      console.log(error);
    }
  }

  // response
  async response() {
    if (this.state) {
      await writeLog(this.req, this.t, {
        msg: this.message,
      });
      await this.t.commit();
      return true;
    } else {
      await this.t.rollback();
      return false;
    }
  }
}

module.exports = Model_cud;
