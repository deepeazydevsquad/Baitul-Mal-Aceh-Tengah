const { Op, Desa, Kecamatan } = require("../../../models");
const moment = require("moment");

class Model_r {
  constructor(req) {
    this.req = req;
  }

  async Kecamatan() {
    try {
      const result = await Kecamatan.findAll({
        attributes: ["id", "name"],
        order: [["name", "ASC"]],
      });
      return {
        data: result.map((e) => ({
          id: e.id,
          name: e.name,
          
        })),
        total: result.length,
      };
    } catch (error) {
      console.error("Error fetching Kecamatan data:", error);
      return { data: [], total: 0 };
    }
  }

  async Desa() {
    const body = this.req.body;
    const limit = parseInt(body.perpage, 10) || 10;
    const page =
      body.pageNumber && body.pageNumber !== "0"
        ? parseInt(body.pageNumber, 10)
        : 1;
      console.log(body.search);
    const where = {};
    if (body.search) {
      where.name = { [Op.like]: `%${body.search}%` };
    }
    if (body.kecamatan_id) {
      where.kecamatan_id = body.kecamatan_id;
    }

    try {
      const result = await Desa.findAndCountAll({
        limit,
        offset: (page - 1) * limit,
        order: [["id", "ASC"]],
        attributes: ["id", "name", "updatedAt"],
        include: [
          {
            model: Kecamatan,
            attributes: ["name"],
            required: false,
          }
        ],
        where,
        subQuery: false,
        distinct: true,
      });

      return {
        data: result.rows.map((e) => ({
          id: e.id,
          name: e.name,
          kecamatan_name: e.Kecamatan.name,
          updatedAt: moment(e.updatedAt).format("YYYY-MM-DD HH:mm:ss"),
        })),
        total: result.count,
      };
    } catch (error) {
      console.error("Error fetching Desa data:", error);
      return { data: [], total: 0 };
    }
  }

  async get_info_edit_desa() {
    const body = this.req.body;
    try {
      const result = await Desa.findByPk(body.id);
      return {
        id: result.id,
        name: result.name,
        kecamatan_id: result.kecamatan_id,
      };
    } catch (error) {
      console.error("Error fetching Desa data:", error);
      return {};
    }
  }

  async info_desa(id) {
    try {
      const result = await Desa.findByPk(id);
      return {
        id: result.id,
        name: result.name,
        kecamatan_id: result.kecamatan_id,
      };
    } catch (error) {
      console.error("Error fetching Desa data:", error);
      return {};
    }
  }
}

module.exports = Model_r;
