const { sequelize, Riwayat_donasi } = require("../../../models");
const { get_member_id } = require("../../../helper/memberHelper");
const moment = require("moment");

class Model_cud {
  constructor(req) {
    this.req = req;
    this.t = null;
    this.state = true;
    this.message = "";
    this.member_id = null;
  }

  async initialize() {
    this.t = await sequelize.transaction();
    this.member_id = await get_member_id(this.req);
  }

  async kode() {
    const digits = "0123456789";
    let result = "";
    for (let i = 0; i < 6; i++) {
      result += digits.charAt(Math.floor(Math.random() * digits.length));
    }
    return Promise.resolve(result);
  }

  // 6 angka + huruf kapital
  async invoice() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return Promise.resolve(result);
  }

  async add_donasi() {
    await this.initialize();
    const myDate = moment(new Date()).format("YYYY-MM-DD HH:mm:ss");
    const body = this.req.body;

    try {
      const insert = await Riwayat_donasi.create(
        {
          program_donasi_id: body.program_donasi_id,
          member_id: this.member_id,
          invoice: body.invoice,
          nominal: body.nominal,
          kode: body.kode,
          status: "process",
          tipe_pembayaran: "online",
          konfirmasi_pembayaran: "belum_dikirim",
          posisi_uang: "bank",
          createdAt: myDate,
          updatedAt: myDate,
        },
        {
          transaction: this.t,
        }
      );

      this.message = `Menambahkan Riwayat Donasi Baru dengan Nominal Donasi: ${body.nominal} `;
    } catch (error) {
      this.state = false;
      console.error("Gagal menambahkan donasi.");
    }
  }

  async update_konfirmasi() {
    await this.initialize();
    const myDate = moment(new Date()).format("YYYY-MM-DD HH:mm:ss");
    const body = this.req.body;

    try {
      const [updated] = await Riwayat_donasi.update(
        {
          konfirmasi_pembayaran: "sudah_dikirim",
          updatedAt: myDate,
        },
        {
          where: {
            invoice: body.invoice,
            member_id: this.member_id,
          },
          transaction: this.t,
        }
      );
      if (updated !== 1) throw new Error("Data donasi tidak ditemukan");
      this.message = `Update Konfirmasi Pembayaran Donasi`;
    } catch (error) {
      this.state = false;
      console.error("Gagal memperbarui konfirmasi donasi.");
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
