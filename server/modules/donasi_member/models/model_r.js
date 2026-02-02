const {
  Op,
  Program_donasi,
  Riwayat_donasi,
  Sequelize,
  Member,
  Bank_pengumpulan,
  Bank,
} = require("../../../models");
const moment = require("moment");

const { get_member_id } = require("../../../helper/memberHelper");
const { kode_pembayaran_donasi } = require("../../../helper/randomHelper");

class Model_r {
  constructor(req) {
    this.req = req;
    this.member_id = null;
    this.kode_pembayaran = null;
  }

  async initialize() {
    this.kode_pembayaran = await kode_pembayaran_donasi();
    this.member_id = await get_member_id(this.req);
  }

  async generateKode() {
    try {
      await this.initialize();
      const kode = this.kode_pembayaran;
      return kode;
    } catch (error) {
      console.error("Error in initialize method:", error);
      return null;
    }
  }

  async daftar_donasi() {
    const body = this.req.body;

    const limit = parseInt(body.perpage, 10) || 10;
    const page =
      body.pageNumber && body.pageNumber !== "0"
        ? parseInt(body.pageNumber, 10)
        : 1;

    const offset = (page - 1) * limit;

    try {
      // hitung total data
      const totalData = await Program_donasi.count();

      // ambil data donasi dengan total nominal per donasi
      const donasi = await Program_donasi.findAll({
        where: { status: "sedang_berlangsung" },
        attributes: [
          "id",
          "banner",
          "name",
          "waktu_donasi",
          [
            Sequelize.fn("SUM", Sequelize.col("Riwayat_donasis.nominal")),
            "total_nominal",
          ],
        ],
        include: [
          {
            model: Riwayat_donasi,
            attributes: [],
          },
        ],
        group: ["Program_donasi.id"],
        limit: limit,
        offset: offset,
        raw: true,
        subQuery: false,
        order: [["id", "DESC"]],
      });

      const totalPage = Math.ceil(totalData / limit);

      return {
        status: "success",
        current_page: page,
        per_page: limit,
        total_data: totalData,
        total_page: totalPage,
        data: donasi,
      };
    } catch (error) {
      console.error("Error daftar_donasi:", error);
      return {
        status: "error",
        message: "Gagal mengambil data donasi",
        total_data: 0,
        total_page: 0,
        data: [],
      };
    }
  }

  async detail_donasi() {
    const body = this.req.body;
    try {
      const data = await Program_donasi.findOne({
        where: {
          id: body.program_donasi_id,
        },
        attributes: [
          "id",
          "banner",
          "name",
          "deskripsi",
          "waktu_donasi",
          "status",
          "target_donasi_terkumpul",
        ],
      });

      const total_donasi = await Riwayat_donasi.sum("nominal", {
        where: {
          program_donasi_id: body.program_donasi_id,
        },
      });

      const total_donatur = await Riwayat_donasi.count({
        where: {
          program_donasi_id: body.program_donasi_id,
        },
      });

      return {
        id: data.id,
        banner: data.banner,
        name: data.name,
        deskripsi: data.deskripsi,
        waktu_donasi: data.waktu_donasi,
        status: data.status,
        target_donasi_terkumpul: data.target_donasi_terkumpul,
        total_donasi: total_donasi,
        total_donatur: total_donatur,
      };
    } catch (error) {
      console.error("Error detail_donasi:", error);
      return [];
    }
  }

  async donatur_donasi() {
    const body = this.req.body;

    const limit = parseInt(body.perpage, 10) || 10;
    const page =
      body.pageNumber && body.pageNumber !== "0"
        ? parseInt(body.pageNumber, 10)
        : 1;

    const offset = (page - 1) * limit;

    try {
      const { count, rows } = await Riwayat_donasi.findAndCountAll({
        where: {
          program_donasi_id: body.program_donasi_id,
          status: "success",
        },
        include: [{ model: Member, attributes: ["fullname"] }],
        limit,
        offset,
        order: [["createdAt", "DESC"]],
      });

      const data = rows.map((item) => {
        const row = item.toJSON();
        return {
          id: row.id,
          member_id: row.member_id,
          nominal: row.nominal,
          waktu_donasi: moment(row.createdAt).format("YYYY-MM-DD HH:mm:ss"),
          name: row.Member.fullname,
        };
      });

      return {
        total: count,
        current_page: page,
        per_page: limit,
        total_page: Math.ceil(count / limit),
        data,
      };
    } catch (error) {
      console.error("Error donatur_donasi:", error);
      return {
        total: 0,
        current_page: 1,
        per_page: limit,
        total_page: 0,
        data: [],
      };
    }
  }

  async get_detail_donatur() {
    await this.initialize();
    try {
      const data = await Member.findOne({
        where: {
          id: this.member_id,
        },
        attributes: ["id", "fullname", "nomor_ktp", "whatsapp_number"],
      });
      return {
        member_id: data.id,
        nama_pemohon: data.fullname,
        nomor_ktp: data.nomor_ktp,
        whatsapp_number: data.whatsapp_number,
      };
    } catch (error) {
      console.error("Error fetching data:", error);
      return {};
    }
  }

  async get_bank() {
    try {
      const banks = await Bank_pengumpulan.findAll({
        where: { tipe: "donasi" },
        include: [
          {
            model: Bank,
            attributes: ["name"],
            required: true,
          },
        ],
        attributes: ["nama_akun_bank", "nomor_akun_bank"],
      });

      return banks.map((bank) => ({
        bankName: bank.Bank.name,
        accountName: bank.nama_akun_bank,
        accountNumber: bank.nomor_akun_bank,
      }));
    } catch (error) {
      console.error("Error in donasi model:", error.message);
      throw error;
    }
  }

  async getMemberProfile() {
    try {
      const userSession = this.req.user;

      if (!userSession || !userSession.username) {
        throw new Error(
          "Sesi pengguna tidak valid atau tidak mengandung username.",
        );
      }

      const memberProfile = await Member.findOne({
        where: { username: userSession.username },
        attributes: ["fullname", "nomor_ktp", "whatsapp_number"],
      });

      if (!memberProfile) {
        throw new Error(
          `Profil untuk username '${userSession.username}' tidak ditemukan.`,
        );
      }

      return memberProfile;
    } catch (error) {
      console.error("Error in getMemberProfile model:", error.message);
      throw error;
    }
  }

  async detail_konfirmasi() {
    const body = this.req.body;
    await this.initialize();

    try {
      const data = await Riwayat_donasi.findOne({
        where: {
          program_donasi_id: body.program_donasi_id,
          member_id: this.member_id,
          konfirmasi_pembayaran: "belum_dikirim",
        },
        attributes: [
          "invoice",
          "nominal",
          "kode",
          "status",
          "createdAt",
          "konfirmasi_pembayaran",
        ],
      });

      if (!data) return null; // kalo ga ada data

      // 🧩 Mapping hasil data
      const mapped = {
        invoice: data.invoice,
        nominal: data.nominal,
        nominal_rupiah: Number(data.nominal + data.kode).toLocaleString(
          "id-ID",
        ),
        status: data.status,
        createdAt: data.createdAt,
        konfirmasi_pembayaran: data.konfirmasi_pembayaran,
      };

      return mapped;
    } catch (error) {
      console.error("Error detail_konfirmasi:", error);
      return null;
    }
  }

  async detail_riwayat() {
    const body = this.req.body;
    await this.initialize();
    try {
      const data = await Riwayat_donasi.findOne({
        where: {
          invoice: body.invoice,
        },
        attributes: [
          "invoice",
          "nominal",
          "status",
          "createdAt",
          "konfirmasi_pembayaran",
        ],
      });

      return data;
    } catch (error) {
      console.error("Error detail_konfirmasi:", error);
      return [];
    }
  }

  async getKonfirmasi() {
    await this.initialize();
    const body = this.req.body;
    console.log("body:", body);
    try {
      const member_id = this.member_id; // ambil ID member yang login

      const data = await Riwayat_donasi.findOne({
        where: {
          program_donasi_id: body.program_donasi_id,
          member_id: member_id,
          konfirmasi_pembayaran: "belum_dikirim", // cari yg belum terkirim
        },
      });

      console.log("data:", data);

      // kalo ada data belum terkirim -> true, kalo gak ada -> false
      return {
        status: data ? true : false,
        data: data || null,
      };
    } catch (error) {
      console.error("Error getKonfirmasi:", error);
      return { status: false, error: error.message };
    }
  }

  async get_riwayat_donasi_user() {
    await this.initialize();
    const body = this.req.body;

    const limit = parseInt(body.perpage, 10) || 10;
    const page =
      body.pageNumber && body.pageNumber !== "0"
        ? parseInt(body.pageNumber, 10)
        : 1;
    const offset = (page - 1) * limit;

    try {
      const { count, rows } = await Riwayat_donasi.findAndCountAll({
        where: {
          member_id: this.member_id,
          program_donasi_id: body.program_donasi_id,
        },
        attributes: ["id", "invoice", "nominal", "kode", "status", "createdAt"],
        limit,
        offset,
        order: [["createdAt", "DESC"]],
      });

      const data = rows.map((item) => ({
        id: item.id,
        invoice: item.invoice,
        nominal: Number(item.nominal + item.kode),
        status: item.status,
        waktu_donasi: moment(item.createdAt).format("YYYY-MM-DD HH:mm:ss"),
      }));

      return {
        total: count,
        current_page: page,
        per_page: limit,
        total_page: Math.ceil(count / limit),
        data,
      };
    } catch (error) {
      console.error("Error get_riwayat_donasi_user:", error);
      return {
        total: 0,
        current_page: 1,
        per_page: limit,
        total_page: 0,
        data: [],
      };
    }
  }
}

module.exports = Model_r;
