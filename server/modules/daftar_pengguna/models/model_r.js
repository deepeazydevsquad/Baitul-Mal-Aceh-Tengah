"use strict";

const { User, sequelize, Grup } = require("../../../models");
const { Op } = require("sequelize");
const moment = require("moment");
const { AuthorizationError } = require("../../../helper/authorizationError");
const {
  isPermissionSubset,
} = require("../../../helper/groupPermissionHelper");

class Model_r {
  constructor(req) {
    this.req = req;
    this.state = false; // default gagal
    this.message = null; // pesan default
    this.t = null; // simpan transaction
  }

  async daftar_pengguna() {
    const body = this.req.body;
    const limit = parseInt(body.perpage) || 10;
    const page =
      body.pageNumber && body.pageNumber !== "0"
        ? parseInt(body.pageNumber)
        : 1;

    let where = {};

    // filter search kalau dikirim
    if (body.search && body.search !== "") {
      where.name = { [Op.like]: `%${body.search}%` };
    }

    const groups = await Grup.findAll({
      attributes: ["id", "group_access"],
    });
    const actorIsSuperAdmin = Number(this.req.user?.grup_id) === 1;
    const readableGroupIds = groups
      .filter(
        (group) =>
          Number(group.id) !== 1 &&
          (actorIsSuperAdmin ||
            Number(group.id) === Number(this.req.user?.grup_id) ||
            isPermissionSubset(
              group.group_access,
              this.req.user?.group_access,
              { strict: true }
            ))
      )
      .map((group) => Number(group.id));
    where.grup_id = { [Op.in]: readableGroupIds };

    try {
      const q = await User.findAndCountAll({
        limit,
        offset: (page - 1) * limit,
        order: [["id", "ASC"]],
        attributes: [
          "id",
          "grup_id",
          "name",
          "jabatan",
          "kode",
          "username",
          "createdAt",
          "updatedAt",
        ],
        include: [
          {
            model: Grup,
            attributes: ["id", "name"],
          },
        ],
        where,
      });

      const total = q.count;
      const data = q.rows.map((item) => {
        const row = item.toJSON();
        return {
          id: row.id,
          grup_id: row.grup_id,
          grup: row.Grup ? row.Grup.name : null, // ambil nama grup
          name: row.name,
          jabatan: row.jabatan,
          kode: row.kode,
          username: row.username,
          createdAt: moment(row.createdAt).format("YYYY-MM-DD HH:mm:ss"),
          updatedAt: moment(row.updatedAt).format("YYYY-MM-DD HH:mm:ss"),
        };
      });

      return {
        data,
        total,
      };
    } catch (error) {
      console.error("🔥 ERROR daftar_pengguna :", error);
      return {
        data: [],
        total: 0,
      };
    }
  }

  async list_grup() {
    try {
      const groups = await Grup.findAll({
        attributes: ["id", "name", "group_access"],
        where: { id: { [Op.ne]: 1 } },
        order: [["id", "ASC"]],
      });
      const actorIsSuperAdmin = Number(this.req.user?.grup_id) === 1;
      return groups
        .filter(
          (group) =>
            actorIsSuperAdmin ||
            Number(group.id) === Number(this.req.user?.grup_id) ||
            isPermissionSubset(
              group.group_access,
              this.req.user?.group_access,
              { strict: true }
            )
        )
        .map((group) => ({ id: group.id, name: group.name }));
    } catch (error) {
      console.error("Error fetching grup:", error);
      throw new Error("Failed to fetch grup");
    }
  }
  async detail_pengguna() {
    const { id } = this.req.body;

    try {
      const item = await User.findOne({
        where: { id },
        attributes: [
          "id",
          "name",
          "jabatan",
          "grup_id",
          "kode",
          "username",
          "password",
          "createdAt",
          "updatedAt",
        ],
      });

      if (!item) {
        return null;
      }
      const targetGroup = await Grup.findByPk(item.grup_id, {
        attributes: ["id", "group_access"],
      });
      const actorIsSuperAdmin = Number(this.req.user?.grup_id) === 1;
      if (!targetGroup) {
        throw new Error("Grup pengguna tidak ditemukan");
      }
      if (Number(targetGroup.id) === 1 && !actorIsSuperAdmin) {
        throw new AuthorizationError(
          "Akun grup istimewa tidak dapat dikelola.",
          "PROTECTED_ACCOUNT"
        );
      }
      if (
        !actorIsSuperAdmin &&
        Number(targetGroup.id) !== Number(this.req.user?.grup_id) &&
        !isPermissionSubset(
          targetGroup.group_access,
          this.req.user?.group_access,
          { strict: true }
        )
      ) {
        throw new AuthorizationError(
          "Anda tidak dapat melihat akun dengan privilege lebih tinggi.",
          "PRIVILEGE_HIERARCHY_VIOLATION"
        );
      }

      const row = item.toJSON();
      return {
        id: row.id,
        name: row.name,
        jabatan: row.jabatan,
        grup_id: row.grup_id,
        kode: row.kode,
        username: row.username,
        createdAt: moment(row.createdAt).format("YYYY-MM-DD HH:mm:ss"),
        updatedAt: moment(row.updatedAt).format("YYYY-MM-DD HH:mm:ss"),
      };
    } catch (error) {
      console.error("🔥 ERROR detail_pengguna :", error);
      if (error.statusCode) throw error;
      return null;
    }
  }
}

module.exports = Model_r;
