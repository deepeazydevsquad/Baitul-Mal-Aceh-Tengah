const { Op, Wakalah, Desa } = require("../../../models");

class Model_r {
  constructor(req) {
    this.req = req;
  }

  async wakalah() {
    const body = this.req.body;
    const limit = parseInt(body.perpage, 10) || 10;
    const page =
      body.pageNumber && body.pageNumber !== "0"
        ? parseInt(body.pageNumber, 10)
        : 1;

    const where = body.search
      ? {
          [Op.or]: [
            { nama: { [Op.like]: `%${body.search}%` } },
            { nik: { [Op.like]: `%${body.search}%` } }
          ],
        }
      : {};

    try {
      const result = await Wakalah.findAndCountAll({
        limit,
        offset: (page - 1) * limit,
        order: [["id", "DESC"]],
        where,
        include: [{
          model: Desa,
          attributes: ['id', 'name']
        }]
      });

      return {
        data: result.rows.map((e) => ({
          id: e.id,
          nama: e.nama,
          nik: e.nik,
          desa_id: e.desa_id,
          desa_name: e.Desa ? e.Desa.name : "-"
        })),
        total: result.count,
      };
    } catch (error) {
      console.error("Error fetching wakalah data:", error);
      return { data: [], total: 0 };
    }
  }

  async get_info_edit_wakalah() {
    const body = this.req.body;
    try {
      const result = await Wakalah.findByPk(body.id, {
        include: [{ model: Desa, attributes: ['id', 'name', 'kecamatan_id'] }]
      });
      return {
        id: result.id,
        nama: result.nama,
        nik: result.nik,
        kecamatan_id: result.Desa ? result.Desa.kecamatan_id : null,
        desa_id: result.desa_id,
        desa_name: result.Desa ? result.Desa.name : "-"
      };
    } catch (error) {
      console.error("Error fetching wakalah data:", error);
      return { data: [] };
    }
  }

  async info_wakalah(id) {
    try {
      const result = await Wakalah.findByPk(id);
      return {
        id: result.id,
        nama: result.nama,
        nik: result.nik,
        desa_id: result.desa_id
      };
    } catch (error) {
      console.error("Error fetching wakalah data:", error);
      return {};
    }
  }
}

module.exports = Model_r;
