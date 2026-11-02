const {
  Op,
  Member,
  Permohonan,
  Kegiatan,
  Program,
  Realisasi_permohonan,
} = require("../../../models");
const moment = require("moment");
const { get_member_id } = require("../../../helper/memberHelper");
class Model_r {
  constructor(req) {
    this.req = req;
    this.member_id = null;
  }
  async initialize() {
    this.member_id = await get_member_id(this.req);
  }
  async daftar_riwayat() {
    await this.initialize();
    const body = this.req.body;
    const limit = parseInt(body.perpage, 10) || 10;
    const page =
      body.pageNumber && body.pageNumber !== "0"
        ? parseInt(body.pageNumber, 10)
        : 1;
    const offset = (page - 1) * limit;
    const where = body.search
      ? {
          [Op.or]: [
            { "$Kegiatan.nama_kegiatan$": { [Op.like]: `%${body.search}%` } },
            { "$Kegiatan.Program.name$": { [Op.like]: `%${body.search}%` } },
          ],
        }
      : {};
    try {
      const { rows, count } = await Permohonan.findAndCountAll({
        where: {
          member_id: this.member_id,
          ...where,
        },
        include: [
          {
            model: Kegiatan,
            required: true,
            attributes: ["nama_kegiatan"],
            include: [{ model: Program, required: true, attributes: ["name"] }],
          },
          {
            model: Realisasi_permohonan,
            required: true,
            attributes: ["status", "status_realisasi"],
          },
        ],
        limit,
        offset,
        order: [["createdAt", "DESC"]],
      });

      console.log("====================");
      console.log(Realisasi_permohonan);
      console.log("====================");

      const data = rows.map((item) => {
        const realisasi = item.Realisasi_permohonans || [];
        return {
          id: item.id,
          tanggal: moment(item.createdAt).format("YYYY-MM-DD"),
          kegiatan: item.Kegiatan?.nama_kegiatan || "-",
          program: item.Kegiatan?.Program?.name || "-",
          status_permohonan: item.status,
          status_realisasi:
            realisasi.map((r) => r.status).join(", ") || "Belum direalisasi",
          can_cancel:
            item.status === "sedang_berlangsung" &&
            realisasi.length > 0 &&
            realisasi.every(
              (r) =>
                r.status === "process" &&
                r.status_realisasi === "belum_direalisasi"
            ),
        };
      });

      console.log(data);
      return {
        success: true,
        total: count,
        totalPage: Math.ceil(count / limit),
        currentPage: page,
        perPage: limit,
        data,
      };
    } catch (error) {
      console.error(error);
      return {
        success: false,
        message: "Terjadi kesalahan saat mengambil data riwayat.",
      };
    }
  }
}
module.exports = Model_r;
