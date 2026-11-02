const {
  sequelize,
  Permohonan,
  Pertanyaan_monev,
  Jawaban_monev,
  Monev,
} = require("../../../models");
const { writeLog } = require("../../../helper/writeLogHelper");
const moment = require("moment");

class Model_cud {
  constructor(req) {
    this.req = req;
    this.t = null;
    this.state = false;
    this.message = "";
    this.statusCode = 400;
  }

  async initialize() {
    this.t = await sequelize.transaction();
    this.state = true;
  }

  async kirim_jawaban() {
    const body = this.req.body;

    try {
      await this.initialize();
      const permohonan = await Permohonan.findByPk(body.permohonan_id, {
        transaction: this.t,
        lock: this.t.LOCK.UPDATE,
      });
      if (
        !permohonan ||
        permohonan.status !== "sedang_berlangsung"
      ) {
        const error = new Error(
          "Permohonan sudah tidak aktif dan tidak dapat dimonev."
        );
        error.statusCode = 409;
        throw error;
      }

      const insertMonev = await Monev.create(
        {
          permohonan_id: body.permohonan_id,
          tipe: body.tipe,
          jenis_monev: body.jenis_monev,
          nama_petugas_monev: body.nama_petugas_monev,
          tim_monev_1: body.tim_monev_1,
          tim_monev_2: body.tim_monev_2,
          tim_monev_3: body.tim_monev_3,
          rekomendasi_tim: body.rekomendasi_tim,
          createdAt: moment().format("YYYY-MM-DD HH:mm:ss"),
          updatedAt: moment().format("YYYY-MM-DD HH:mm:ss"),
        },
        { transaction: this.t }
      );

      console.log("insertMonev", insertMonev);

      const jawabanData = body.jawaban.map((j) => ({
        monev_id: insertMonev.id,
        pertanyaan_id: j.pertanyaan_id,
        jawaban: j.jawaban,
        createdAt: moment().format("YYYY-MM-DD HH:mm:ss"),
        updatedAt: moment().format("YYYY-MM-DD HH:mm:ss"),
      }));

      console.log("=====================");
      console.log(insertMonev);
      console.log(jawabanData);
      console.log("=====================");

      await Jawaban_monev.bulkCreate(jawabanData, { transaction: this.t });

      this.message =
        "Pertanyaan dan jawaban berhasil tersimpan dengan ID: " +
        insertMonev.id +
        "ID Permohonan: " +
        body.permohonan_id;
    } catch (error) {
      console.error("Error in kirim_jawaban:", error);
      this.state = false;
      this.message = error.message;
      this.statusCode = error.statusCode || 500;
    }
  }

  // =============================
  // Response handler
  // =============================
  async response() {
    if (!this.t) return false;
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
