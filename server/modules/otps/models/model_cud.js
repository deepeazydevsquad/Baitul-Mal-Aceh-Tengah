const crypto = require("crypto");
const moment = require("moment");
const {
  sequelize,
  Sequelize,
  Op,
  Otp,
} = require("../../../models");
const {
  createOtpVerifier,
  OTP_TTL_MS,
} = require("../../../helper/otpHelper");

class OtpRateLimitError extends Error {
  constructor() {
    super("Batas pengiriman OTP tercapai.");
    this.code = "OTP_SEND_LIMIT";
  }
}

class Model_cud {
  constructor(req) {
    this.req = req;
    this.t = null;
    this.state = false;
    this.record = null;
  }

  async createOtp({ whatsapp_number, purpose, otp_code }) {
    this.t = await sequelize.transaction({
      isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.SERIALIZABLE,
    });

    try {
      const startOfDay = moment().startOf("day").toDate();
      const recent = await Otp.findAll({
        where: {
          whatsapp_number,
          createdAt: { [Op.gte]: startOfDay },
        },
        attributes: ["id"],
        transaction: this.t,
        lock: this.t.LOCK.UPDATE,
      });
      if (recent.length >= 2) throw new OtpRateLimitError();

      await Otp.update(
        { status: "digunakan" },
        {
          where: {
            whatsapp_number,
            purpose,
            status: "belum_digunakan",
          },
          transaction: this.t,
        }
      );

      const salt = crypto.randomBytes(24).toString("hex");
      this.record = await Otp.create(
        {
          whatsapp_number,
          purpose,
          otp: createOtpVerifier(otp_code, salt),
          otp_salt: salt,
          otp_time: new Date(Date.now() + OTP_TTL_MS),
          status: "belum_digunakan",
          attempts: 0,
        },
        { transaction: this.t }
      );
      this.state = true;
    } catch (error) {
      this.state = false;
      throw error;
    }
  }

  async markFailed() {
    if (!this.record) return;
    await Otp.update(
      { status: "digunakan" },
      { where: { id: this.record.id } }
    );
  }

  async response() {
    if (this.t && !this.t.finished) {
      if (this.state) await this.t.commit();
      else await this.t.rollback();
    }
    return this.state;
  }
}

module.exports = Model_cud;
module.exports.OtpRateLimitError = OtpRateLimitError;
