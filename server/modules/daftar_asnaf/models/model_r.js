"use strict";

const { Asnaf, sequelize } = require("../../../models");
const { Op } = require("sequelize");
const moment = require("moment");

class Model_r {
  constructor(req) {
    this.req = req;
  }

  async daftar_asnaf() {
    const body = this.req.body;
    const limit = parseInt(body.perpage) || 20;
    const page =
      body.pageNumber && body.pageNumber !== "0"
        ? parseInt(body.pageNumber)
        : 1;

    let where = {};

    // filter search kalau dikirim
    if (body.search && body.search !== "") {
      where.name = { [Op.like]: `%${body.search}%` };
    }

    const sql = {
      limit,
      offset: (page - 1) * limit,
      order: [["id", "ASC"]],
      attributes: ["id", "name", "tipe", "createdAt", "updatedAt"],
      where,
    };

    try {
      const q = await Asnaf.findAndCountAll(sql);
      const total = q.count;
      const data = q.rows.map((item) => {
        const row = item.toJSON();
        return {
          id: row.id,
          name: row.name,
          tipe: row.tipe || "zakat",
          createdAt: moment(row.createdAt).format("YYYY-MM-DD HH:mm:ss"),
          updatedAt: moment(row.updatedAt).format("YYYY-MM-DD HH:mm:ss"),
        };
      });
      return {
        data,
        total,
      };
    } catch (error) {
      console.error("🔥 ERROR :", error);
      return {
        data: [],
        total: 0,
      };
    }
  }

  async detail_asnaf() {
    const { id } = this.req.body;

    try {
      const item = await Asnaf.findOne({
        where: { id },
        attributes: ["id", "name", "tipe", "createdAt", "updatedAt"],
      });

      if (!item) {
        return null; // kalau tidak ketemu
      }

      const row = item.toJSON();
      return {
        id: row.id,
        name: row.name,
        tipe: row.tipe || "zakat",
        createdAt: moment(row.createdAt).format("YYYY-MM-DD HH:mm:ss"),
        updatedAt: moment(row.updatedAt).format("YYYY-MM-DD HH:mm:ss"),
      };
    } catch (error) {
      console.error("🔥 ERROR detail_asnaf :", error);
      return null;
    }
  }
}

module.exports = Model_r;
