const { sequelize, Bank } = require("../../../models");
const Model_r = require("../models/model_r");
const { writeLog } = require("../../../helper/writeLogHelper");
const path = require("path");
const moment = require("moment");
const {
  removeStoredFile,
  resolveStoredPath,
} = require("../../../helper/uploadStorageHelper");

const BANK_LOGO_DIRECTORY = path.resolve(
  __dirname,
  "../../../uploads/img/bank"
);
const BANK_LOGO_EXTENSIONS = new Set([".png", ".jpg", ".jpeg"]);

class Model_cud {
  constructor(req) {
    this.req = req;
  }

  async initialize() {
    this.t = await sequelize.transaction();
    this.state = true;
  }

  getUploadedLogo() {
    const filename = this.req.bankLogo?.filename;
    if (!filename) return null;
    if (!resolveStoredPath(BANK_LOGO_DIRECTORY, filename, {
      allowedExtensions: BANK_LOGO_EXTENSIONS,
    })) {
      throw new Error("Referensi logo bank tidak valid.");
    }
    return filename;
  }

  removeUploadedLogo() {
    const filename = this.req.bankLogo?.filename;
    if (!filename) return false;
    return removeStoredFile(BANK_LOGO_DIRECTORY, filename, {
      allowedExtensions: BANK_LOGO_EXTENSIONS,
    });
  }

  scheduleLogoRemoval(filename) {
    if (!filename) return;
    if (!resolveStoredPath(BANK_LOGO_DIRECTORY, filename, {
      allowedExtensions: BANK_LOGO_EXTENSIONS,
    })) {
      return;
    }
    this.logosToRemoveAfterCommit = [
      ...(this.logosToRemoveAfterCommit || []),
      filename,
    ];
  }

  async add() {
    await this.initialize();
    const myDate = moment(new Date()).format("YYYY-MM-DD HH:mm:ss");
    const body = this.req.body;

    try {
      const insert = await Bank.create(
        {
          img: this.getUploadedLogo(),
          name: body.name,
          createdAt: myDate,
          updatedAt: myDate,
        },
        {
          transaction: this.t,
        }
      );

      this.message = `Menambahkan Bank Baru dengan Nama Bank: ${body.name} dan ID Bank: ${insert.id}`;
    } catch (error) {
      this.state = false;
      this.message = error.message;
    }
  }

  async edit() {
    await this.initialize();
    const myDate = moment().format("YYYY-MM-DD HH:mm:ss");
    const body = this.req.body;

    try {
      const model_r = new Model_r(this.req);
      const info_bank = await model_r.info_bank(body.id);
      if (!info_bank) throw new Error("Bank tidak ditemukan");

      let newImg = info_bank.img;
      const uploadedLogo = this.getUploadedLogo();

      if (uploadedLogo) {
        newImg = uploadedLogo;
        this.scheduleLogoRemoval(info_bank.img);
      }

      await Bank.update(
        {
          img: newImg,
          name: body.name,
          updatedAt: myDate,
        },
        {
          where: { id: body.id },
          transaction: this.t,
        }
      );

      this.message = `Memperbaharui Bank dengan Nama Bank: ${info_bank.name} dan ID Bank: ${body.id} menjadi Nama Bank ${body.name}`;
    } catch (error) {
      this.state = false;
      this.message = error.message;
      this.removeUploadedLogo();
    }
  }

  async delete() {
    await this.initialize();
    const body = this.req.body;

    try {
      const model_r = new Model_r(this.req);
      const info_bank = await model_r.info_bank(body.id);
      if (!info_bank) throw new Error("Bank tidak ditemukan");

      await Bank.destroy({
        where: { id: body.id },
        transaction: this.t,
      });

      this.scheduleLogoRemoval(info_bank.img);

      this.message = `Menghapus Bank dengan Nama Bank: ${info_bank.name} dan ID Bank: ${info_bank.id}`;
    } catch (error) {
      this.state = false;
      this.message = error.message;
    }
  }

  // response
  async response() {
    if (this.state) {
      await writeLog(this.req, this.t, {
        msg: this.message,
      });
      await this.t.commit();
      for (const filename of this.logosToRemoveAfterCommit || []) {
        removeStoredFile(BANK_LOGO_DIRECTORY, filename, {
          allowedExtensions: BANK_LOGO_EXTENSIONS,
        });
      }
      return true;
    } else {
      await this.t.rollback();
      this.removeUploadedLogo();
      return false;
    }
  }
}

Model_cud.BANK_LOGO_DIRECTORY = BANK_LOGO_DIRECTORY;
Model_cud.removeBankLogo = (filename) =>
  removeStoredFile(BANK_LOGO_DIRECTORY, filename, {
    allowedExtensions: BANK_LOGO_EXTENSIONS,
  });

module.exports = Model_cud;
