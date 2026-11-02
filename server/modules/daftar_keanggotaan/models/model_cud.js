const { sequelize, Member } = require("../../../models");
const Model_r = require("../models/model_r");
const { writeLog } = require("../../../helper/writeLogHelper");
const bcrypt = require("bcryptjs");
const moment = require("moment");
const { normalizeNik } = require("../../../helper/nikHelper");

class Model_cud {
  constructor(req) {
    this.req = req;
  }

  async initialize() {
    this.t = await sequelize.transaction();
    this.state = true;
  }

  async add(kode) {
    await this.initialize();
    const myDate = moment(new Date()).format("YYYY-MM-DD HH:mm:ss");
    const body = this.req.body;

    try {
      let hashedPassword = null;
      if (body.password) {
        hashedPassword = await bcrypt.hash(body.password, 10);
      }

      const insert = await Member.create(
        {
          kode: kode,
          desa_id: body.desa_id || null,
          tipe: body.tipeAkun || null,
          fullname: body.fullname || null,
          nomor_ktp:
            body.tipeAkun === "perorangan"
              ? normalizeNik(body.nomor_ktp)
              : null,
          nomor_kk: body.nomor_kk || null,
          whatsapp_number: body.wa_number || null,
          birth_date: body.birth_date || null,
          alamat: body.alamat || null,
          username: body.username || null,
          password: hashedPassword,

          createdAt: myDate,
          updatedAt: myDate,
        },
        {
          transaction: this.t,
        }
      );

      this.message = `Menambahkan Member Keanggotaan Baru dengan Nama Member: ${body.fullname} dan ID Member: ${insert.id}`;
    } catch (error) {
      this.state = false;
    }
  }

  async edit() {
    await this.initialize();
    const myDate = moment().format("YYYY-MM-DD HH:mm:ss");
    const body = this.req.body;

    try {
      const model_r = new Model_r(this.req);
      const info_daftar_keanggotaan = await model_r.info_daftar_keanggotaan(
        body.id
      );
      console.log("info_daftar_keanggotaan", info_daftar_keanggotaan);
      let hashedPassword;
      if (body.password) {
        hashedPassword = await bcrypt.hash(body.password, 10);
      } else {
        hashedPassword = info_daftar_keanggotaan.password;
      }


      await Member.update(
        {
          desa_id: body.desa_id,
          tipe: body.tipeAkun,
          fullname: body.fullname,
          nomor_ktp:
            body.tipeAkun === "perorangan"
              ? normalizeNik(body.nomor_ktp)
              : null,
          nomor_kk: body.nomor_kk || null,
          whatsapp_number: body.wa_number || null,
          birth_date: body.birth_date || null,
          alamat: body.alamat || null,
          username: body.username,
          password: hashedPassword || info_daftar_keanggotaan.password,

          updatedAt: myDate,
        },
        {
          where: { id: body.id },
          transaction: this.t,
        }
      );

      this.message = `Memperbaharui Data Member Keanggotaan dengan Nama Member: ${info_daftar_keanggotaan.fullname} dan ID Member: ${body.id} menjadi Nama Member ${body.fullname}`;
    } catch (error) {
      this.state = false;
      this.message = error.message;
    }
  }

  async delete() {
    await this.initialize();
    const body = this.req.body;

    try {
      const model_r = new Model_r(this.req);
      const info_daftar_keanggotaan = await model_r.info_daftar_keanggotaan(
        body.id
      );

      await Member.destroy({
        where: { id: body.id },
        transaction: this.t,
      });

      this.message = `Menghapus Member Keanggotaan dengan Nama Member: ${info_daftar_keanggotaan.fullname} dan ID Member: ${info_daftar_keanggotaan.id}`;
    } catch (error) {
      this.state = false;
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
