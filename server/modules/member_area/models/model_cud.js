
const { sequelize, Member } = require("../../../models");
const Model_r = require("../models/model_r");
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


  async edit_profile_member() {
    await this.initialize();

    const myDate = moment().format("YYYY-MM-DD HH:mm:ss");
    const body = this.req.body;

    
    try {
      const model_r = new Model_r(this.req);
      const info_member = await model_r.InfoMember(this.req.user.username);

      let hashedPassword;
      if (body.password && body.password.trim() !== "") {
        hashedPassword = await bcryptjs.hash(body.password, 10);
      } else {
        hashedPassword = info_member.password;
      }

      await Member.update(
        {
          fullname: body.fullname,
          username: body.username,
          password: hashedPassword,
          updatedAt: myDate,
        },
        {
          where: { id: info_member.id },
          transaction: this.t,
        }
      );

      this.message = `Memperbarui Profil Member ID: ${info_member.id}, Nama: ${body.fullname}, Username: ${body.username}`;
    } catch (error) {
      console.error("Error edit_profile_member:", error);
      this.state = false;
      return false;
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
