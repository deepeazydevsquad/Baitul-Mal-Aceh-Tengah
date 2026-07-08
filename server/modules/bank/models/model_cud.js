const { sequelize, Bank } = require("../../../models");
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

  async add() {
    await this.initialize();
    const myDate = moment(new Date()).format("YYYY-MM-DD HH:mm:ss");
    const body = this.req.body;

    try {
      const insert = await Bank.create(
        {
          img: body.photoPath,
          name: body.name,
          createdAt: myDate,
          updatedAt: myDate,
        },
        {
          transaction: this.t,
        }
      );

      this.message = `Menambahkan Bank Baru dengan Nama Bank: ${body.name} dan ID Bank: ${insert.id}`;
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
      const info_bank = await model_r.info_bank(body.id);

      let newImg = info_bank.img;

      if (body.photoPath) {
        // === CASE 1: Upload baru ===
        if (info_bank.img) {
          const oldFile = path.join(
            __dirname,
            "../../../uploads/img/bank/",
            info_bank.img
          );
          if (fs.existsSync(oldFile)) fs.unlinkSync(oldFile);
        }
        newImg = body.photoPath;
      } else if (body.name && body.name !== info_bank.name && info_bank.img) {
        // === CASE 2: Hanya ganti nama ===
        const oldPath = path.join(
          __dirname,
          "../../../uploads/img/bank/",
          info_bank.img
        );
        const ext = path.extname(info_bank.img);
        const safeName = body.name.toLowerCase().replace(/[^a-z0-9]/g, "_");
        const newFilename = `${safeName}${ext}`;
        const newPath = path.join(
          __dirname,
          "../../../uploads/img/bank/",
          newFilename
        );

        if (fs.existsSync(oldPath)) {
          fs.renameSync(oldPath, newPath);
          newImg = newFilename;
        }
      }

      await Bank.update(
        {
          img: newImg,
          name: body.name,
          updatedAt: myDate,
        },
        {
          where: { id: body.id },
          transaction: this.t,
        }
      );

      this.message = `Memperbaharui Bank dengan Nama Bank: ${info_bank.name} dan ID Bank: ${body.id} menjadi Nama Bank ${body.name}`;
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
      const info_bank = await model_r.info_bank(body.id);

      await Bank.destroy({
        where: { id: body.id },
        transaction: this.t,
      });

      if (info_bank.img) {
        const filePath = path.join(
          __dirname,
          "../../../uploads/img/bank/",
          info_bank.img
        );
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }

      this.message = `Menghapus Bank dengan Nama Bank: ${info_bank.name} dan ID Bank: ${info_bank.id}`;
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
