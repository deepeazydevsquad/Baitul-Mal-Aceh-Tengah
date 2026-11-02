
const { Member } = require("../../../models");
const bcrypt = require("bcryptjs");

class Model_r {
  constructor(req) {
    this.req = req;
  }

  async InfoMember(username) {
    try {
      var q = await Member.findOne({
        where: { username: username },
        attributes: ["id", "username", "fullname", "password", "whatsapp_number"],
      });
      return { id: q.id, username: q.username, fullname: q.fullname, password: q.password, whatsapp_number: q.whatsapp_number };
    } catch (error) {
      return {};
    }
  }

  async getInfoMember() {
    try {
      var q = await Member.findOne({
        where: { username: this.req.body.username },
      });
      if (!q) return null;
      const validPassword = await bcrypt.compare(
        this.req.body.password,
        q.password
      );
      if (!validPassword) return null;
      return { id: q.id, username: q.username, fullname: q.fullname };
    } catch (error) {
      return null;
    }
  }

  async get_profile_member() {
    try {
      const member = await Member.findOne({
        where: { id: this.req.user.id },
        attributes: [
          "id",
          "kode",
          "tipe",
          "fullname",
          "nomor_ktp",
          "nomor_kk",
          "whatsapp_number",
          "username",
        ],
        raw: true,
        nest: true,
      });

      if (!member) {
        return { error: "Member tidak ditemukan" };
      }

      return {
        id: member.id,
        kode: member.kode,
        username: member.username,
        fullname: member.fullname,
        nomor_ktp: member.nomor_ktp,
        nomor_kk: member.nomor_kk,
        whatsapp_number: member.whatsapp_number,
        tipe: member.tipe,
      };
    } catch (error) {
      console.error("Error get_profile_member:", error);
      return { error: "Terjadi kesalahan server" };
    }
  }
}



module.exports = Model_r;
