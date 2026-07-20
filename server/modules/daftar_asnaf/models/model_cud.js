const moment = require("moment");
const { Asnaf, sequelize } = require("../../../models");
const { writeLog } = require("../../../helper/writeLogHelper");

class Model_cud {
  constructor(req) {
    this.req = req;
  }

  async initialize() {
    this.t = await sequelize.transaction();
    this.state = true;
  }

  async create() {
    await this.initialize();
    const body = this.req.body;
    console.log("body", body);
    const date = moment().format("YYYY-MM-DD HH:mm:ss");
    try {
      const insert = await Asnaf.create(
        {
          name: body.name,
          tipe: body.tipe || "zakat",
          createdAt: date,
          updatedAt: date,
        },
        { transaction: this.t }
      );
      this.message = `Menambahkan Asnaf Baru dengan Nama Asnaf: ${body.name} dan ID Asnaf: ${insert.id}`;
    } catch (err) {
      this.message = err.message;
    }
  }

  async update() {
    await this.initialize();
    const body = this.req.body;
    const date = moment().format("YYYY-MM-DD HH:mm:ss");
    try {
      const daftar_asnaf = await Asnaf.findByPk(body.id, {
        transaction: this.t,
      });
      await daftar_asnaf.update(
        {
          name: body.name,
          tipe: body.tipe || "zakat",
          updatedAt: date,
        },
        { transaction: this.t }
      );

      this.message = `Memperbarui Asnaf dengan Nama Asnaf: ${body.name} dan ID Asnaf: ${body.id}`;
    } catch (err) {
      this.message = err.message;
    }
  }

  async delete() {
    await this.initialize();
    const { id } = this.req.body; // ambil id dari params
    try {
      const daftar_asnaf = await Asnaf.findByPk(id, { transaction: this.t });
      if (!daftar_asnaf) {
        throw new Error("Data tidak ditemukan");
      }

      await daftar_asnaf.destroy({ transaction: this.t });

      this.message = "Menghapus Asnaf dengan ID Asnaf: " + id + ".";
    } catch (err) {
      this.message = err.message;
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
