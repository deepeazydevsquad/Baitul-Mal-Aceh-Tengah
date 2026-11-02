"use strict";

const {
    Request_member,
    Member,
    Otp,
    sequelize,
    Sequelize,
    Op,
} = require("../../../models");
const moment = require("moment");
const bcryptjs = require("bcryptjs");
const {
    normalizeWhatsAppNumber,
    verifyOtpCode,
    OTP_MAX_ATTEMPTS,
} = require("../../../helper/otpHelper");
const { normalizeNik } = require("../../../helper/nikHelper");

class Model_cud {
    constructor(req) {
        this.req = req;
        this.state = false; // default gagal
        this.message = null; // pesan default
        this.t = null; // simpan transaction
        this.errorCode = null;
    }

    async register() {
        const body = this.req.body;
        const date = moment().format("YYYY-MM-DD HH:mm:ss");
        const whatsappNumber = normalizeWhatsAppNumber(body.whatsapp_number);
        if (!whatsappNumber) {
            this.message = "Nomor WhatsApp tidak valid.";
            this.errorCode = "INVALID_WHATSAPP_NUMBER";
            return;
        }

        this.t = await sequelize.transaction({
            isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.SERIALIZABLE,
        });

        try {
            const otpRecord = await Otp.findOne({
                where: {
                    whatsapp_number: whatsappNumber,
                    purpose: "registration",
                    status: "belum_digunakan",
                    otp_time: { [Op.gt]: new Date() },
                },
                order: [["id", "DESC"]],
                transaction: this.t,
                lock: this.t.LOCK.UPDATE,
            });

            if (!otpRecord) {
                throw Object.assign(new Error("OTP kosong, salah, atau kedaluwarsa."), {
                    code: "OTP_INVALID",
                });
            }

            if (otpRecord.attempts >= OTP_MAX_ATTEMPTS) {
                throw Object.assign(new Error("Batas percobaan OTP tercapai."), {
                    code: "OTP_ATTEMPTS_EXCEEDED",
                });
            }

            const validOtp = verifyOtpCode(
                String(body.otp || ""),
                otpRecord.otp_salt,
                otpRecord.otp
            );
            if (!validOtp) {
                await otpRecord.update(
                    {
                        attempts: otpRecord.attempts + 1,
                        status:
                            otpRecord.attempts + 1 >= OTP_MAX_ATTEMPTS
                                ? "digunakan"
                                : "belum_digunakan",
                    },
                    { transaction: this.t }
                );
                await this.t.commit();
                this.t = null;
                throw Object.assign(new Error("OTP kosong, salah, atau kedaluwarsa."), {
                    code:
                        otpRecord.attempts + 1 >= OTP_MAX_ATTEMPTS
                            ? "OTP_ATTEMPTS_EXCEEDED"
                            : "OTP_INVALID",
                });
            }

            const username = String(body.username || "").trim();
            const nik =
              body.tipe === "perorangan"
                ? normalizeNik(body.nomor_ktp)
                : null;
            const [
              existingMember,
              pendingRequest,
              existingNikMember,
              pendingNikRequest,
            ] = await Promise.all([
                Member.findOne({
                    where: { username },
                    attributes: ["id"],
                    transaction: this.t,
                    lock: this.t.LOCK.UPDATE,
                }),
                Request_member.findOne({
                    where: { username, status: "process" },
                    attributes: ["id"],
                    transaction: this.t,
                    lock: this.t.LOCK.UPDATE,
                }),
              nik
                ? Member.findOne({
                    where: { nomor_ktp: nik },
                    attributes: ["id"],
                    transaction: this.t,
                    lock: this.t.LOCK.UPDATE,
                  })
                : null,
              nik
                ? Request_member.findOne({
                    where: { nomor_ktp: nik, status: "process" },
                    attributes: ["id"],
                    transaction: this.t,
                    lock: this.t.LOCK.UPDATE,
                  })
                : null,
            ]);
            if (
              existingMember ||
              pendingRequest ||
              existingNikMember ||
              pendingNikRequest
            ) {
                await otpRecord.update(
                    { status: "digunakan" },
                    { transaction: this.t }
                );
                await this.t.commit();
                this.t = null;
                throw Object.assign(
                    new Error("Registrasi tidak dapat diproses."),
                    { code: "REGISTRATION_REJECTED" }
                );
            }

            // hash password
            const hashedPassword = await bcryptjs.hash(body.password, 12);

            await Request_member.create(
                {
                    desa_id: body.desa_id,
                    tipe: body.tipe,
                    status: "process",
                    fullname: body.fullname,
                    nomor_ktp: nik,
                    nomor_kk: body.nomor_kk,
                    whatsapp_number: whatsappNumber,
                    birth_date: body.birth_date,
                    alamat: body.alamat,
                    username: body.username,
                    password: hashedPassword,
                    created_at: date,
                    updated_at: date,
                },
                { transaction: this.t }
            );

            await otpRecord.update(
                {
                    status: "digunakan",
                },
                { transaction: this.t }
            );

            this.state = true;
            this.message = "Registrasi berhasil, menunggu persetujuan admin";
        } catch (error) {
            this.state = false;
            this.errorCode = error.code || null;
            this.message =
                error.code === "OTP_INVALID" ||
                error.code === "OTP_ATTEMPTS_EXCEEDED"
                    ? "OTP kosong, salah, kedaluwarsa, atau sudah digunakan."
                    : error.code === "REGISTRATION_REJECTED"
                      ? "Registrasi tidak dapat diproses."
                    : "Terjadi kesalahan saat registrasi.";
        }
    }

    async response() {
        if (this.state) {
            await this.t.commit(); // simpan perubahan
            return true;
        } else {
            if (this.t && !this.t.finished) await this.t.rollback();
            return false;
        }
    }
}

module.exports = Model_cud;

