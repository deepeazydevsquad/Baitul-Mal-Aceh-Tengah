const moment = require("moment");
const { User, sequelize } = require("../../../models");
const bcryptjs = require("bcryptjs");
const { writeLog } = require("../../../helper/writeLogHelper");
const crypto = require("crypto");
const { Grup } = require("../../../models");
const { AuthorizationError } = require("../../../helper/authorizationError");
const { revokeAllSessions } = require("../../../helper/tokenHelper");
const {
  isPermissionSubset,
} = require("../../../helper/groupPermissionHelper");

class Model_cud {
  constructor(req) {
    this.req = req;
    this.state = false;
    this.message = null;
    this.t = null;
  }

  async generate_kode() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    const bytes = crypto.randomBytes(6);
    return Array.from(bytes, (byte) => chars[byte % chars.length]).join("");
  }

  async loadLockedGroups(groupIds) {
    const ids = [
      ...new Set(
        groupIds
          .map((id) => Number(id))
          .filter((id) => Number.isInteger(id) && id > 0)
      ),
    ].sort((a, b) => a - b);
    const groups = await Grup.findAll({
      where: { id: ids },
      attributes: ["id", "group_access"],
      order: [["id", "ASC"]],
      transaction: this.t,
      lock: this.t.LOCK.UPDATE,
    });
    return new Map(groups.map((group) => [Number(group.id), group]));
  }

  async assertManageTarget(target, nextGroupId) {
    const actorAccount = await User.findByPk(Number(this.req.user?.id), {
      attributes: ["id", "grup_id"],
      transaction: this.t,
      lock: this.t.LOCK.UPDATE,
    });
    if (!actorAccount) {
      throw new AuthorizationError(
        "Akun administrator tidak ditemukan.",
        "ACCOUNT_NOT_FOUND"
      );
    }
    const actorGroupId = Number(actorAccount.grup_id);
    const actorIsSuperAdmin = actorGroupId === 1;
    const isSelf =
      target?.id && Number(target.id) === Number(this.req.user?.id);
    if (!target) throw new Error("Data tidak ditemukan");
    if (Number(target.grup_id) === 1 && !actorIsSuperAdmin) {
      throw new AuthorizationError(
        "Akun grup istimewa tidak dapat dikelola.",
        "PROTECTED_ACCOUNT"
      );
    }
    if (
      isSelf &&
      Number(target.grup_id) !== Number(nextGroupId) &&
      !actorIsSuperAdmin
    ) {
      throw new AuthorizationError(
        "Anda tidak dapat mengubah grup akun sendiri.",
        "SELF_PRIVILEGE_CHANGE"
      );
    }

    const groups = await this.loadLockedGroups([
      actorGroupId,
      nextGroupId,
      target.grup_id,
    ]);
    const group = groups.get(Number(nextGroupId));
    if (!group) throw new Error("Grup tujuan tidak ditemukan");
    const actorGroup = groups.get(actorGroupId);
    if (!actorGroup) {
      throw new AuthorizationError(
        "Grup akun administrator tidak ditemukan.",
        "ACCOUNT_GROUP_NOT_FOUND"
      );
    }

    if (actorIsSuperAdmin || isSelf) return group;
    if (Number(nextGroupId) === 1) {
      throw new AuthorizationError(
        "Hanya superadmin yang dapat memberikan grup istimewa.",
        "PRIVILEGED_GROUP_TARGET"
      );
    }

    const currentGroup =
      target.grup_id === undefined || target.grup_id === null
        ? null
        : groups.get(Number(target.grup_id));
    if (
      currentGroup &&
      !isPermissionSubset(
        currentGroup.group_access,
        actorGroup.group_access,
        { strict: true }
      )
    ) {
      throw new AuthorizationError(
        "Anda tidak dapat mengelola akun dengan privilege setara atau lebih tinggi.",
        "PRIVILEGE_HIERARCHY_VIOLATION"
      );
    }
    if (
      !isPermissionSubset(
        group.group_access,
        actorGroup.group_access,
        { strict: true }
      )
    ) {
      throw new AuthorizationError(
        "Anda tidak dapat memberikan privilege yang belum Anda miliki.",
        "PRIVILEGE_HIERARCHY_VIOLATION"
      );
    }
    return group;
  }

  async lockSuperAdmins() {
    return User.findAll({
      where: { grup_id: 1 },
      attributes: ["id", "grup_id"],
      order: [["id", "ASC"]],
      transaction: this.t,
      lock: this.t.LOCK.UPDATE,
    });
  }

  assertSuperAdminRemains(user, nextGroupId, superAdmins) {
    if (
      Number(user.grup_id) === 1 &&
      Number(nextGroupId) !== 1 &&
      superAdmins.filter(
        (account) => Number(account.id) !== Number(user.id)
      ).length === 0
    ) {
      throw new AuthorizationError(
        "Superadmin terakhir tidak dapat diturunkan atau dihapus.",
        "LAST_SUPERADMIN_PROTECTED"
      );
    }
  }

  async create() {
    const body = this.req.body;
    const date = moment().format("YYYY-MM-DD HH:mm:ss");
    this.t = await sequelize.transaction();
    const hashedPassword = await bcryptjs.hash(body.password, 10);
    try {
      await this.assertManageTarget(
        { id: null, grup_id: null },
        body.grup_id
      );
      await User.create(
        {
          name: body.name,
          jabatan: body.jabatan,
          grup_id: body.grup_id,
          kode: await this.generate_kode(),
          username: body.username,
          password: hashedPassword,
          createdAt: date,
          updatedAt: date,
        },
        { transaction: this.t }
      );

      this.state = true;
      this.message = "Data berhasil disimpan";
    } catch (err) {
      this.state = false;
      this.message = err.message;
      this.error = err;
      if (err.statusCode && this.t && !this.t.finished) {
        await this.t.rollback();
        this.t = null;
        throw err;
      }
    }
  }

  async update() {
    const body = this.req.body;
    const date = moment().format("YYYY-MM-DD HH:mm:ss");
    this.t = await sequelize.transaction();

    try {
      // Serialize operations touching superadmin accounts to prevent two
      // concurrent demotions from leaving zero superadmins.
      const superAdmins = await this.lockSuperAdmins();
      const user = await User.findByPk(body.id, {
        transaction: this.t,
        lock: this.t.LOCK.UPDATE,
      });
      await this.assertManageTarget(user, body.grup_id);
      this.assertSuperAdminRemains(user, body.grup_id, superAdmins);

      // siapkan data update dasar
      const updateData = {
        name: body.name,
        jabatan: body.jabatan,
        grup_id: body.grup_id,
        username: body.username,
        updatedAt: date,
      };

      // kalau password ada & ga kosong, baru hash
      if (body.password && body.password.trim() !== "") {
        const hashedPassword = await bcryptjs.hash(body.password, 10);
        updateData.password = hashedPassword;
      }

      await user.update(updateData, { transaction: this.t });
      this.updatedUserId = user.id;
      this.passwordChanged = Boolean(updateData.password);

      this.state = true;
      this.message = "Data berhasil diperbarui";
    } catch (err) {
      this.state = false;
      this.message = err.message;
      this.error = err;
      if (err.statusCode && this.t && !this.t.finished) {
        await this.t.rollback();
        this.t = null;
        throw err;
      }
    }
  }

  async delete() {
    const { id } = this.req.body;
    this.t = await sequelize.transaction();
    try {
      const superAdmins = await this.lockSuperAdmins();
      const user = await User.findByPk(id, {
        transaction: this.t,
        lock: this.t.LOCK.UPDATE,
      });
      if (!user) throw new Error("Data tidak ditemukan");
      await this.assertManageTarget(user, user.grup_id);
      if (Number(user.id) === Number(this.req.user?.id)) {
        throw new AuthorizationError(
          "Akun yang sedang digunakan tidak dapat dihapus.",
          "SELF_DELETE"
        );
      }
      this.assertSuperAdminRemains(user, 0, superAdmins);

      await user.destroy({ transaction: this.t });
      this.deletedUserId = user.id;

      this.state = true;
      this.message = "Data berhasil dihapus";
    } catch (err) {
      this.state = false;
      this.message = err.message;
      this.error = err;
      if (err.statusCode && this.t && !this.t.finished) {
        await this.t.rollback();
        this.t = null;
        throw err;
      }
    }
  }

  async response() {
    if (this.state) {
      await writeLog(this.req, this.t, {
        msg: this.message,
      });
      await this.t.commit();
      if (this.deletedUserId) {
        await revokeAllSessions("administrator", this.deletedUserId);
      } else if (this.passwordChanged && this.updatedUserId) {
        await revokeAllSessions("administrator", this.updatedUserId);
      }
      return true;
    } else {
      await this.t.rollback();
      return false;
    }
  }
}

module.exports = Model_cud;
