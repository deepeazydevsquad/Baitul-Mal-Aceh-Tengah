"use strict";

const { Member, Otp, sequelize } = require("../../../models");
const { generateKodeKeanggotaan } = require("../../../helper/randomHelper");
const moment = require("moment");
const bcryptjs = require("bcryptjs");

// Constants
const BCRYPT_ROUNDS = 10;
const OTP_STATUS_USED = "digunakan";
const OTP_STATUS_UNUSED = "belum_digunakan";

/**
 * Model_cud - Class untuk menangani operasi Create, Update, Delete
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
   * Register member baru
   * @returns {Promise<void>}
   */
  async register() {
    const body = this.req.body;
    const currentDate = moment().format("YYYY-MM-DD HH:mm:ss");

    this.transaction = await sequelize.transaction();

    try {
      // Hash password
      const hashedPassword = await bcryptjs.hash(body.password, BCRYPT_ROUNDS);
      const memberCode = await generateKodeKeanggotaan();

      // Create member baru
      await Member.create(
        {
          kode: memberCode,
          desa_id: body.desa_id,
          tipe: body.tipe,
          fullname: body.fullname,
          nomor_ktp: body.nomor_ktp,
          nomor_kk: body.nomor_kk,
          whatsapp_number: body.whatsapp_number,
          birth_date: body.birth_date,
          alamat: body.alamat,
          username: body.username,
          password: hashedPassword,
          created_at: currentDate,
          updated_at: currentDate,
        },
        { transaction: this.transaction },
      );

      // Update status OTP menjadi digunakan
      await Otp.update(
        {
          status: OTP_STATUS_USED,
          updatedAt: currentDate,
        },
        {
          where: {
            whatsapp_number: body.whatsapp_number,
            otp: body.otp,
            status: OTP_STATUS_UNUSED,
          },
          transaction: this.transaction,
        },
      );

      this.state = true;
      this.message = "Registrasi berhasil";
    } catch (error) {
      console.error("Error saat registrasi member:", error);
      this.state = false;
      this.message = error.message || "Terjadi kesalahan saat registrasi";
    }
  }

  /**
   * Handle response dan commit/rollback transaction
   * @returns {Promise<boolean>} Status sukses atau gagal
   */
  async response() {
    try {
      if (this.state) {
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
