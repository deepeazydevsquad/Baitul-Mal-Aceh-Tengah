const { sequelize, Setting } = require("../../../models");
const Model_r = require("../models/model_r");
const { writeLog } = require("../../../helper/writeLogHelper");
const moment = require("moment");
const { where } = require("sequelize");

class Model_cud {
  constructor(req) {
    this.req = req;
    this.t = null;
    this.state = true;
    this.message = "";
  }

  async initialize() {
    this.t = await sequelize.transaction();
    this.state = true;
  }

  async update() {
    await this.initialize();
    const body = this.req.body;
    const date = moment().format("YYYY-MM-DD HH:mm:ss");

    try {
      // list key yg diizinkan untuk update
      const allowedKeys = ["api_key", "device_key", "whatsapp_number"];

      for (const key of allowedKeys) {
        if (
          body[key] !== undefined &&
          (key === "whatsapp_number" || String(body[key]).trim() !== "")
        ) {
          const data = await Setting.findOne({
            where: { name: key },
            transaction: this.t,
          });

          if (!data) throw new Error(`Data setting "${key}" tidak ditemukan`);

          await data.update(
            {
              value: body[key],
              updatedAt: date,
            },
            { transaction: this.t }
          );
        }
      }
      this.message = "Pengaturan WhatsApp berhasil diperbarui";
    } catch (err) {
      console.error("Error in update method:", err);
      this.state = false;
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
