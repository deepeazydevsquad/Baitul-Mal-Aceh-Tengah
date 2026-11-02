const { sequelize, Setting } = require("../../../models");
const Model_r = require("../models/model_r");
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

  async edit_pengaturan_umum() {
    await this.initialize();
    const myDate = moment().format("YYYY-MM-DD HH:mm:ss");
    const { body, files } = this.req;
    try {
      const model_r = new Model_r(this.req);
      const currentSettings = await model_r.get_info_pengaturan_umum();

      // Mapping data yang akan diupdate
      const updateData = {
        nama_kabupaten_kota: body.nama_kabupaten_kota,
        alamat: body.alamat,
        quote: body.quote,
        harga_emas_per_gram: body.harga_emas_per_gram,
        nama_jabatan1: body.nama_jabatan_1,
        nama_pejabat1: body.nama_pejabat_1,
        nama_jabatan2: body.nama_jabatan_2,
        nama_pejabat2: body.nama_pejabat_2,
        nama_jabatan3: body.nama_jabatan_3,
        nama_pejabat3: body.nama_pejabat_3,
      };

      if (body.iconPath) {
        updateData.icon = body.iconPath;
      }

      if (body.logoPath) {
        updateData.logo = body.logoPath;
      }

      if (body.heroLogoPath) {
        updateData.hero_logo = body.heroLogoPath;
      }

      if (body.logoTanpaTeksPath) {
        updateData.logo_tanpa_teks = body.logoTanpaTeksPath;
      }

      for (const [key, value] of Object.entries(updateData)) {
        await Setting.update(
          {
            value: value,
            updatedAt: myDate,
          },
          {
            where: { name: key },
            transaction: this.t,
          }
        );
      }

      this.message = `Berhasil memperbarui pengaturan umum`;
    } catch (error) {
      this.state = false;
      this.message = error.message;
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
