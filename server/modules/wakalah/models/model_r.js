const { Op, sequelize, Wakalah, Desa, Kecamatan } = require("../../../models");
const { get_info_lokasi } = require("../../../helper/locationHelper");
const moment = require("moment");

class Model_r {
  constructor(req) {
    this.req = req;
  }

  async info(id) {
    try {
      return Wakalah.findOne({
        where: { id },
        attributes: ["fullname"],
        raw: true,
      });
    } catch (error) {
      return {};
    }
  }

  async list() {
    const body = this.req.body;
    const limit = parseInt(body.perpage, 10) || 10;
    const page = parseInt(body.pageNumber, 10) || 1;

    const where = body.search
      ? {
          [Op.or]: [
            { fullname: { [Op.like]: `%${body.search}%` } },
            { kode: { [Op.like]: `%${body.search}%` } },
            { jabatan: { [Op.like]: `%${body.search}%` } },
          ],
        }
      : {};

    try {
      const result = await Wakalah.findAndCountAll({
        limit,
        offset: (page - 1) * limit,
        order: [["id", "ASC"]],
        attributes: [
          "id",
          "kode",
          "fullname",
          "jabatan",
          "whatsapp_number",
          "updatedAt",
        ],
        where,
        include: [
          {
            model: Desa,
            attributes: ["id", "name"],
            include: [
              {
                model: Kecamatan,
                attributes: ["id", "name"],
              },
            ],
          },
        ],
      });

      return {
        data: result.rows.map((e) => ({
          id: e.id,
          kode: e.kode,
          fullname: e.fullname,
          jabatan: e.jabatan,
          whatsapp_number: e.whatsapp_number,
          updatedAt: moment(e.updatedAt).format("YYYY-MM-DD HH:mm:ss"),
          desa: e.Desa.name,
          kecamatan: e.Desa.Kecamatan.name,
        })),
        total: result.count,
      };
    } catch (error) {
      console.error("Error fetching daftar_keanggotaan data:", error);
      return { data: [], total: 0 };
    }
  }

  async get_info_edit() {
    const { id } = this.req.body;

    try {
      return await Wakalah.findOne({
        attributes: ["desa_id", "fullname", "jabatan", "whatsapp_number"],
        where: { id },
        include: {
          model: Desa,
          required: true,
          attributes: ["kecamatan_id"],
        },
      });
    } catch (error) {
      console.log("Error=====");
      console.log(error);
      console.log("Error=====");
      return {};
    }
  }

  async list_kecamatan() {
    try {
      const { rows } = await Kecamatan.findAndCountAll({
        attributes: ["id", "name"],
      });

      return rows.map((e) => ({
        id: e.id,
        name: e.name,
      }));
      // return row;
    } catch (error) {
      return [];
    }
  }

  async list_desa(kecamatan_id) {
    try {
      const { rows } = await Desa.findAndCountAll({
        attributes: ["id", "name"],
        where: { kecamatan_id },
      });

      return rows.map((e) => ({
        id: e.id,
        name: e.name,
      }));
      // return row;
    } catch (error) {
      return [];
    }
  }
}

module.exports = Model_r;
