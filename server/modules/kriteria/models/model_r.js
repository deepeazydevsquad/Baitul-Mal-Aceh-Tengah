const { Op, Kriteria, Kegiatan } = require("../../../models");
const moment = require("moment");

class Model_r {
  constructor(req) {
    this.req = req;
  }

  async Kriteria() {
    const body = this.req.body;
    const limit = parseInt(body.perpage, 10) || 10;
    const page =
      body.pageNumber && body.pageNumber !== "0"
        ? parseInt(body.pageNumber, 10)
        : 1;
    const where = body.search
      ? {
          [Op.or]: [{ name: { [Op.like]: `%${body.search}%` } }],
        }
      : {};

    try {
      const result = await Kriteria.findAndCountAll({
        limit,
        offset: (page - 1) * limit,
        order: [["id", "ASC"]],
        attributes: ["id", "name", "updatedAt"],
        where,
        include: {
          model: Kegiatan,
          required: true,
          attributes: ["id", "nama_kegiatan"],
        },
      });

      return {
        data: result.rows.map((e) => ({
          id: e.id,
          name: e.name,
          kegiatan: e.Kegiatan.nama_kegiatan,
          updatedAt: moment(e.updatedAt).format("YYYY-MM-DD HH:mm:ss"),
        })),
        total: result.count,
      };
    } catch (error) {
      console.log("----------------xxx");
      console.log(error);
      console.log("----------------xxx");
      return { data: [], total: 0 };
    }
  }
}

module.exports = Model_r;
