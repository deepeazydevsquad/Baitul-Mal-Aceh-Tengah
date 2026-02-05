const { Op, Kecamatan, Desa } = require("../../../models");
const moment = require("moment");

class Model_r {
  constructor(req) {
    this.req = req;
  }

  async initialize() {
    //
  }

  async list_kecamatan() {
    try {
      const result = await Kecamatan.findAndCountAll({});

      return {
        data: result.rows.map((e) => ({
          id: e.id,
          name: e.name,
        })),
      };
    } catch (error) {
      console.error("Error fetching Kecamatan data:", error);
      return { data: [] };
    }
  }

  async list_desa() {
    try {
      const result = await Desa.findAndCountAll({
        where: { kecamatan_id: this.req.body.kecamatan_id },
      });

      return {
        data: result.rows.map((e) => ({
          id: e.id,
          name: e.name,
        })),
      };
    } catch (error) {
      console.error("Error fetching Kecamatan data:", error);
      return { data: [] };
    }
  }

  async Kecamatan() {
    const body = this.req.body;
    const limit = parseInt(body.perpage, 10) || 10;
    const page =
      body.pageNumber && body.pageNumber !== "0"
        ? parseInt(body.pageNumber, 10)
        : 1;
    console.log(body.search);
    const where = body.search
      ? {
          [Op.or]: [{ name: { [Op.like]: `%${body.search}%` } }],
        }
      : {};

    try {
      const result = await Kecamatan.findAndCountAll({
        limit,
        offset: (page - 1) * limit,
        order: [["id", "ASC"]],
        attributes: ["id", "kode", "name", "updatedAt"],
        where,
      });

      return {
        data: result.rows.map((e) => ({
          id: e.id,
          name: e.name,
          kode: e.kode,
          updatedAt: moment(e.updatedAt).format("YYYY-MM-DD HH:mm:ss"),
        })),
        total: result.count,
      };
    } catch (error) {
      console.error("Error fetching Kecamatan data:", error);
      return { data: [], total: 0 };
    }
  }

  async get_info_edit_kecamatan() {
    const body = this.req.body;
    try {
      const result = await Kecamatan.findByPk(body.id);
      return {
        id: result.id,
        name: result.name,
        kode: result.kode,
      };
    } catch (error) {
      console.error("Error fetching Kecamatan data:", error);
      return {};
    }
  }

  async info_Kecamatan(id) {
    try {
      const result = await Kecamatan.findByPk(id);
      return {
        id: result.id,
        name: result.name,
        kode: result.kode,
      };
    } catch (error) {
      console.error("Error fetching Kecamatan data:", error);
      return {};
    }
  }
}

module.exports = Model_r;
