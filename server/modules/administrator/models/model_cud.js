const { sequelize, User } = require("../../../models");
const Model_r = require("../models/model_r");
const { writeLog } = require("../../../helper/writeLogHelper");
const moment = require("moment");
const bcryptjs = require("bcryptjs");

class Model_cud {
  constructor(req) {
    this.req = req;
  }

  async initialize() {
    this.t = await sequelize.transaction();
    this.state = true;
  }

  async edit_profile() {
    await this.initialize();

    const myDate = moment().format("YYYY-MM-DD HH:mm:ss");
    const body = this.req.body;

    try {
      const model_r = new Model_r(this.req);
      const info_user = await model_r.info_user();
      let hashedPassword;
      if (body.password) {
        hashedPassword = await bcryptjs.hash(body.password, 10);
      } else {
        hashedPassword = info_user.password;
      }

      await User.update(
        {
          name: body.name,
          jabatan: body.jabatan,
          username: body.username,
          password: hashedPassword || info_user.password,
          updatedAt: myDate,
        },
        {
          where: { id: this.req.user.id },
          transaction: this.t,
        }
      );

      this.message = `Memperbarui Data Profile User dengan ID: ${this.req.user.id} menjadi Nama: ${body.name} dan Username: ${body.username}`;
    } catch (error) {
      this.state = false;
      this.message = error.message;
      return false;
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
