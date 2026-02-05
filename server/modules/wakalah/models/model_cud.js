const { sequelize, Wakalah, Desa } = require("../../../models");
const { generateKodeWakalah } = require("../../../helper/randomHelper");
const Model_r = require("../models/model_r");
const fs = require("fs");
const path = require("path");
const moment = require("moment");
const { raw } = require("body-parser");

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
    const myDate = moment().format("YYYY-MM-DD HH:mm:ss");
    const body = this.req.body;

    try {
      const insert = await Wakalah.create(
        {
          kode: await generateKodeWakalah(),
          desa_id: body.desa_id,
          fullname: body.fullname,
          jabatan: body.jabatan,
          whatsapp_number: body.whatsapp_number,
          createdAt: myDate,
          updatedAt: myDate,
        },
        {
          transaction: this.t,
        },
      );

      this.message = `Menambahkan Bank Baru dengan Nama Bank: ${body.name} dan ID Bank: ${insert.id}`;
    } catch (error) {
      console.log("-------------");
      console.log(error);
      console.log("-------------");
      this.state = false;
    }
  }

  async update() {
    await this.initialize();
    const myDate = moment().format("YYYY-MM-DD HH:mm:ss");
    const body = this.req.body;

    try {
      const model_r = new Model_r(this.req);
      const info = await model_r.info(body.id);

      await Wakalah.update(
        {
          desa_id: body.desa_id,
          fullname: body.fullname,
          jabatan: body.jabatan,
          whatsapp_number: body.whatsapp_number,
          updatedAt: myDate,
        },
        {
          where: { id: body.id },
          transaction: this.t,
        },
      );

      this.message = `Memperbaharui Wakalah dengan Nama Wakalah: ${info.fullname} dan ID Wakalah: ${body.id} menjadi Nama Wakalah ${body.fullname}`;
    } catch (error) {
      this.state = false;
    }
  }

  async delete() {
    await this.initialize();
    const { id } = this.req.body;
    try {
      const info = await Wakalah.findByPk(id, { transaction: this.t });
      if (!info) {
        throw new Error("Data tidak ditemukan");
      }

      await info.destroy({ transaction: this.t });

      this.message = "Menghapus Wakalah dengan ID Wakalah: " + id + ".";
    } catch (err) {
      this.message = err.message;
    }
  }

  async response() {
    if (this.state) {
      await this.t.commit();
      return true;
    } else {
      await this.t.rollback();
      return false;
    }
  }
}

module.exports = Model_cud;
