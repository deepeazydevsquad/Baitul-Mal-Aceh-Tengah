const { Request_member, Member, sequelize } = require("../../../models");
const { writeLog } = require("../../../helper/writeLogHelper");
const { normalizeNik } = require("../../../helper/nikHelper");

const moment = require("moment");

class Model_cud {
  constructor(req) {
    this.req = req;
    this.state = false; // default gagal
    this.message = null; // pesan default
    this.t = null; // simpan transaction
  }

  async generate_kode() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < 4; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  async approve_request() {
    const { id, action } = this.req.body; // action bisa 'approve' atau 'reject'
    const date = moment().format("YYYY-MM-DD HH:mm:ss");

    this.t = await sequelize.transaction();

    try {
      // Ambil data request
      const request = await Request_member.findOne({
        where: { id },
        transaction: this.t,
        lock: this.t.LOCK.UPDATE,
      });

      if (!request) {
        throw new Error("Request member tidak ditemukan");
      }
      if (request.status !== "process") {
        const error = new Error(
          "Request keanggotaan sudah diproses dan tidak dapat diulang."
        );
        error.statusCode = 409;
        error.code = "REQUEST_ALREADY_PROCESSED";
        throw error;
      }

      if (action === "approve") {
        const nik =
          request.tipe === "perorangan"
            ? normalizeNik(request.nomor_ktp)
            : null;
        const existingMember = await Member.findOne({
          where: { username: request.username },
          attributes: ["id"],
          transaction: this.t,
          lock: this.t.LOCK.UPDATE,
        });
        if (existingMember) {
          const error = new Error(
            "Username request sudah digunakan oleh member lain."
          );
          error.statusCode = 409;
          error.code = "USERNAME_CONFLICT";
          throw error;
        }
        if (nik) {
          const existingNik = await Member.findOne({
            where: { nomor_ktp: nik },
            attributes: ["id"],
            transaction: this.t,
            lock: this.t.LOCK.UPDATE,
          });
          if (existingNik) {
            const error = new Error(
              "NIK request sudah digunakan oleh member lain."
            );
            error.statusCode = 409;
            error.code = "NIK_CONFLICT";
            throw error;
          }
        }
        // Update request jadi approved
        await Request_member.update(
          {
            status: "verified",
            updated_at: date,
          },
          { where: { id }, transaction: this.t }
        );

        // Insert ke Member
        await Member.create(
          {
            desa_id: request.desa_id,
            kode: await this.generate_kode(),
            tipe: request.tipe,
            fullname: request.fullname,
            nomor_ktp: nik,
            nomor_kk: request.nomor_kk,
            whatsapp_number: request.whatsapp_number,
            birth_date: request.birth_date,
            alamat: request.alamat,
            username: request.username,
            password: request.password, // ⚠️ sebaiknya di-hash
            created_at: date,
            updated_at: date,
          },
          { transaction: this.t }
        );

        this.state = true;
        this.message = "Request approved & data dipindahkan ke member";
      } else if (action === "reject") {
        // Update request jadi unverified
        await Request_member.update(
          {
            status: "unverified",
            updated_at: date,
          },
          { where: { id }, transaction: this.t }
        );

        this.state = true;
        this.message = "Request ditolak (status: unverified)";
      } else {
        throw new Error("Action tidak valid (gunakan 'approve' atau 'reject')");
      }
    } catch (error) {
      this.state = false;
      this.message = error.message;
      this.statusCode = error.statusCode || 500;
      this.errorCode = error.code || "VERIFICATION_FAILED";
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
