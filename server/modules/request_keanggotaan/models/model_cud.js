const { Request_member, Member, sequelize } = require("../../../models");
const { generateKodeKeanggotaan } = require("../../../helper/randomHelper");
const { writeLog } = require("../../../helper/writeLogHelper");
const moment = require("moment");
const bcryptjs = require("bcryptjs");

// Constants
const BCRYPT_ROUNDS = 10;
const ACTION_APPROVE = "approve";
const ACTION_REJECT = "reject";
const STATUS_VERIFIED = "verified";
const STATUS_UNVERIFIED = "unverified";

/**
 * Model_cud - Class untuk menangani operasi Create, Update, Delete request keanggotaan
 */
class Model_cud {
  /**
   * Constructor
   * @param {Object} req - Express request object
   */
  constructor(req) {
    this.req = req;
    this.state = false;
    this.message = null;
    this.transaction = null;
  }

  /**
   * Approve atau reject request keanggotaan
   * @returns {Promise<void>}
   */
  async approve_request() {
    const { id, action } = this.req.body;
    const currentDate = moment().format("YYYY-MM-DD HH:mm:ss");

    this.transaction = await sequelize.transaction();

    try {
      // Validasi action
      if (![ACTION_APPROVE, ACTION_REJECT].includes(action)) {
        throw new Error("Action tidak valid (gunakan 'approve' atau 'reject')");
      }

      // Ambil data request member
      const requestMember = await Request_member.findOne({
        where: { id },
        transaction: this.transaction,
      });

      if (!requestMember) {
        throw new Error("Request member tidak ditemukan");
      }

      if (action === ACTION_APPROVE) {
        // Hash password sebelum disimpan
        const hashedPassword = await bcryptjs.hash(
          requestMember.password,
          BCRYPT_ROUNDS,
        );

        // Generate kode anggota unik
        const memberCode = await generateKodeKeanggotaan();

        // Update request status menjadi verified
        await Request_member.update(
          {
            status: STATUS_VERIFIED,
            updated_at: currentDate,
          },
          { where: { id }, transaction: this.transaction },
        );

        // Insert data ke tabel Member
        await Member.create(
          {
            kode: memberCode,
            desa_id: requestMember.desa_id,
            tipe: requestMember.tipe,
            fullname: requestMember.fullname,
            nomor_ktp: requestMember.nomor_ktp,
            nomor_kk: requestMember.nomor_kk,
            whatsapp_number: requestMember.whatsapp_number,
            birth_date: requestMember.birth_date,
            alamat: requestMember.alamat,
            username: requestMember.username,
            password: hashedPassword,
            created_at: currentDate,
            updated_at: currentDate,
          },
          { transaction: this.transaction },
        );

        this.state = true;
        this.message = "Request approved & data dipindahkan ke member";
      } else if (action === ACTION_REJECT) {
        // Update request status menjadi unverified
        await Request_member.update(
          {
            status: STATUS_UNVERIFIED,
            updated_at: currentDate,
          },
          { where: { id }, transaction: this.transaction },
        );

        this.state = true;
        this.message = "Request ditolak (status: unverified)";
      }
    } catch (error) {
      console.error("Error saat approve request:", error);
      this.state = false;
      this.message =
        error.message || "Terjadi kesalahan saat memproses request";
    }
  }

  /**
   * Handle response dan commit/rollback transaction
   * @returns {Promise<boolean>} Status sukses atau gagal
   */
  async response() {
    try {
      if (this.state) {
        await writeLog(this.req, this.transaction, {
          msg: this.message,
        });
        await this.transaction.commit();
        return true;
      } else {
        if (this.transaction) {
          await this.transaction.rollback();
        }
        return false;
      }
    } catch (error) {
      console.error("Error saat commit/rollback transaction:", error);
      return false;
    }
  }
}

module.exports = Model_cud;
