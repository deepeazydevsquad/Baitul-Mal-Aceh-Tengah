const { sequelize, Grup, User } = require("../../../models");
const Model_r = require("../models/model_r");
const { writeLog } = require("../../../helper/writeLogHelper");
const path = require("path");
const fs = require("fs");
const moment = require("moment");
const { AuthorizationError } = require("../../../helper/authorizationError");
const {
  isPermissionSubset,
} = require("../../../helper/groupPermissionHelper");

class Model_cud {
  constructor(req) {
    this.req = req;
  }

  async initialize() {
    this.t = await sequelize.transaction();
    this.state = true;
  }

  assertCanManagePermissions(groupAccess, targetGroup = null) {
    const actorGroupId = Number(this.req.user?.grup_id);
    if (actorGroupId === 1) return;

    if (targetGroup && Number(targetGroup.id) === 1) {
      throw new AuthorizationError(
        "Grup istimewa hanya dapat dikelola oleh superadmin.",
        "PROTECTED_GROUP"
      );
    }
    if (
      targetGroup &&
      Number(targetGroup.id) === Number(this.req.user?.grup_id)
    ) {
      throw new AuthorizationError(
        "Anda tidak dapat mengubah privilege grup akun sendiri.",
        "SELF_PRIVILEGE_CHANGE"
      );
    }
    if (
      targetGroup &&
      !isPermissionSubset(
        targetGroup.group_access,
        this.req.user?.group_access,
        { strict: true }
      )
    ) {
      throw new AuthorizationError(
        "Grup tujuan memiliki privilege setara atau lebih tinggi.",
        "PRIVILEGE_HIERARCHY_VIOLATION"
      );
    }
    if (
      !isPermissionSubset(
        groupAccess,
        this.req.user?.group_access,
        { strict: true }
      )
    ) {
      throw new AuthorizationError(
        "Anda tidak dapat memberikan privilege yang belum Anda miliki.",
        "PRIVILEGE_HIERARCHY_VIOLATION"
      );
    }
  }

  async add() {
    await this.initialize();
    const myDate = moment(new Date()).format("YYYY-MM-DD HH:mm:ss");
    const body = this.req.body;
    try {
      this.assertCanManagePermissions(body.group_access);
      const insert = await Grup.create(
        {
          name: body.name,
          group_access: body.group_access,
          createdAt: myDate,
          updatedAt: myDate,
        },
        {
          transaction: this.t,
        }
      );

      this.message = `Menambahkan Grup Baru dengan Nama Grup: ${body.name} dan ID Grup: ${insert.id}`;
    } catch (error) {
      this.state = false;
      if (error.statusCode && this.t && !this.t.finished) {
        await this.t.rollback();
        this.t = null;
        throw error;
      }
    }
  }

  async edit() {
    await this.initialize();
    const myDate = moment(new Date()).format("YYYY-MM-DD HH:mm:ss");
    const body = this.req.body;

    try {
      const targetGroup = await Grup.findByPk(body.id, {
        transaction: this.t,
        lock: this.t.LOCK.UPDATE,
      });
      if (!targetGroup) {
        const error = new Error(`Grup dengan ID: ${body.id} tidak ditemukan`);
        error.statusCode = 404;
        throw error;
      }
      this.assertCanManagePermissions(body.group_access, targetGroup);
      const update = await Grup.update(
        {
          name: body.name,
          group_access: body.group_access,
          updatedAt: myDate,
        },
        {
          where: { id: body.id }, // id dikirim dari frontend
          transaction: this.t,
        }
      );

      if (update[0] === 0) {
        // artinya ga ada row yg ke-update
        this.state = false;
        this.message = `Grup dengan ID: ${body.id} tidak ditemukan`;
      } else {
        this.state = true;
        this.message = `Update Grup dengan ID: ${body.id} berhasil`;
      }
    } catch (error) {
      console.error("Error update grup:", error);
      this.state = false;
      this.message = "Gagal update grup";
      if (error.statusCode && this.t && !this.t.finished) {
        await this.t.rollback();
        this.t = null;
        throw error;
      }
    }
  }

  async delete() {
    await this.initialize();
    const body = this.req.body;

    try {
      if (Number(body.id) === 1) {
        throw new AuthorizationError(
          "Grup istimewa tidak dapat dihapus.",
          "PROTECTED_GROUP"
        );
      }
      const targetGroup = await Grup.findByPk(body.id, {
        transaction: this.t,
        lock: this.t.LOCK.UPDATE,
      });
      if (!targetGroup) {
        const error = new Error(`Grup dengan ID: ${body.id} tidak ditemukan`);
        error.statusCode = 404;
        throw error;
      }
      this.assertCanManagePermissions(targetGroup.group_access, targetGroup);
      const userCount = await User.count({
        where: { grup_id: body.id },
        transaction: this.t,
      });
      if (userCount > 0) {
        throw new AuthorizationError(
          "Grup masih memiliki pengguna. Pindahkan pengguna sebelum menghapus grup.",
          "GROUP_IN_USE"
        );
      }
      const deleted = await Grup.destroy({
        where: { id: body.id }, // id dikirim dari frontend
        transaction: this.t,
      });

      if (deleted === 0) {
        // artinya tidak ada row yang kehapus
        this.state = false;
        this.message = `Grup dengan ID: ${body.id} tidak ditemukan`;
      } else {
        this.state = true;
        this.message = `Grup dengan ID: ${body.id} berhasil dihapus`;
      }
    } catch (error) {
      console.error("Error delete grup:", error);
      this.state = false;
      this.message = "Gagal delete grup";
      if (error.statusCode && this.t && !this.t.finished) {
        await this.t.rollback();
        this.t = null;
        throw error;
      }
    }
  }

  async response() {
    if (this.state) {
      await writeLog(this.req, this.t, {
        msg: this.message,
      });
      await this.t.commit();
      return true;
    } else {
      await this.t.rollback();
      return false;
    }
  }
}

module.exports = Model_cud;
