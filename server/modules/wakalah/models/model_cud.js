const { sequelize, Wakalah } = require("../../../models");
const Model_r = require("../models/model_r");
const { writeLog } = require("../../../helper/writeLogHelper");
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
      const insert = await Wakalah.create(
        {
          nama: body.nama,
          nik: body.nik,
          desa_id: body.desa_id,
          createdAt: myDate,
          updatedAt: myDate,
        },
        { transaction: this.t }
      );
      this.message = `Menambahkan Wakalah Baru dengan Nama: ${body.nama} dan ID: ${insert.id}`;
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
      const info_wakalah = await model_r.info_wakalah(body.id);

      await Wakalah.update(
        {
          nama: body.nama,
          nik: body.nik,
          desa_id: body.desa_id,
          updatedAt: myDate,
        },
        {
          where: { id: body.id },
          transaction: this.t,
        }
      );
      this.message = `Memperbaharui Wakalah dengan Nama: ${info_wakalah.nama} dan ID: ${body.id}`;
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
      const info_wakalah = await model_r.info_wakalah(body.id);

      await Wakalah.destroy({
        where: { id: body.id },
        transaction: this.t,
      });

      this.message = `Menghapus Wakalah dengan Nama: ${info_wakalah.nama} dan ID: ${info_wakalah.id}`;
    } catch (error) {
      this.state = false;
    }
  }

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
