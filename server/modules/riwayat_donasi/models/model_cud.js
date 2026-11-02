const {
  sequelize,
  Program_donasi,
  Riwayat_donasi,
  Member,
} = require("../../../models");
const Model_r = require("../models/model_r");
const { writeLog } = require("../../../helper/writeLogHelper");
const path = require("path");
const moment = require("moment");
const {
  isSafeStoredFilename,
  removeStoredFile,
} = require("../../../helper/uploadStorageHelper");

const DONATION_PROOF_DIRECTORIES = {
  transfer: path.resolve(__dirname, "../../../uploads/img/donasi/bukti_transfer"),
  cash: path.resolve(__dirname, "../../../uploads/img/donasi/bukti_setoran"),
};

class Model_cud {
  constructor(req) {
    this.req = req;
    this.state = false;
    this.message = null;
    this.t = null;
  }

  async list() {
    try {
      const data = await Riwayat_donasi.findAll({
        include: [
          {
            model: Program_donasi,
            attributes: [
              "id",
              "name",
              "slug",
              "banner",
              "tahun",
              "deskripsi",
              "target_donasi_terkumpul",
              "status",
              "waktu_donasi",
              "createdAt",
              "updatedAt",
            ],
          },
          {
            model: Member,
            attributes: [
              "id",
              "kode",
              "tipe",
              "fullname",
              "nomor_ktp",
              "nomor_kk",
              "whatsapp_number",
              "birth_date",
              "alamat",
              "username",
              "password",
              "createdAt",
              "updatedAt",
            ],
          },
        ],
        order: [["createdAt", "DESC"]],
      });

      this.state = true;
      this.message = "Berhasil mengambil data riwayat donasi";
      return data;
    } catch (err) {
      console.error("List error:", err);
      this.message = err.message || "Gagal mengambil data riwayat donasi";
      this.state = false;
      return [];
    }
  }

  // Hapus data riwayat donasi
  async delete() {
    const { id } = this.req.body;
    this.t = await sequelize.transaction();

    try {
      if (!id) throw new Error("ID wajib diisi");

      const riwayat = await Riwayat_donasi.findByPk(id, {
        transaction: this.t,
      });
      if (!riwayat) throw new Error("Data tidak ditemukan");

      this.filesToDelete = [];
      if (riwayat.bukti_transfer) {
        this.filesToDelete.push({
          directory: DONATION_PROOF_DIRECTORIES.transfer,
          filename: riwayat.bukti_transfer,
        });
      }
      if (riwayat.bukti_setoran) {
        this.filesToDelete.push({
          directory: DONATION_PROOF_DIRECTORIES.cash,
          filename: riwayat.bukti_setoran,
        });
      }
      await riwayat.destroy({ transaction: this.t });

      this.state = true;
      this.message = `Riwayat donasi ID ${id} berhasil dihapus`;
    } catch (err) {
      console.error("Delete error:", err);
      this.message = err.message || "Terjadi kesalahan saat menghapus data";
      this.state = false;
    }
  }

  // async updatestatus() {
  //   const { id, status } = this.req.body;
  //   this.t = await sequelize.transaction();

  //   try {
  //     if (!id || !status) {
  //       throw new Error("ID dan status wajib diisi");
  //     }

  //     const riwayat = await Riwayat_donasi.findByPk(id, { transaction: this.t });
  //     if (!riwayat) {
  //       throw new Error("Data riwayat donasi tidak ditemukan");
  //     }

  //     await Riwayat_donasi.update(
  //       { status: status.toLowerCase() },
  //       {
  //         where: { id },
  //         transaction: this.t,
  //       }
  //     );

  //     await this.t.commit();

  //     this.state = true;
  //     this.message = `Status donasi berhasil diubah menjadi ${status}`;
  //   } catch (error) {
  //     await this.t.rollback();
  //     console.error("❌ Gagal update status:", error);
  //     this.state = false;
  //     this.message = error.message || "Gagal mengubah status donasi";
  //   }
  // }

  async approve_online() {
    // await this.initialize();
    const body = this.req.body;

    const actor = this.req.user;

    try {
      const model_r = new Model_r(this.req);
      const info_riwayat_donasi = await model_r.info_riwayat_donasi(body.id);

      await Riwayat_donasi.update(
        {
          konfirmasi_pembayaran: "sudah_dikirim",
          nama_petugas: actor.name,
          jabatan_petugas: actor.jabatan,
          status: "success",
          updatedAt: new Date(),
        },
        {
          where: { id: body.id },
          transaction: this.t,
        }
      );

      this.message = `Menyetujui Pembayaran donasi Secara Online dengan Nama member Riwayat_donasi: ${info_riwayat_donasi.member_name} dan ID Riwayat donasi: ${info_riwayat_donasi.id}`;
    } catch (error) {
      console.log("GGGG");
      console.log(error);
      console.log("GGGG");
      this.state = false;
    }
  }

  async reject_online() {
    const body = this.req.body;

    const actor = this.req.user;

    try {
      const model_r = new Model_r(this.req);
      const info_riwayat_donasi = await model_r.info_riwayat_donasi(body.id);

      await Riwayat_donasi.update(
        {
          status: "failed",
          alasan_penolakan: body.alasan,
          nama_petugas: actor.name,
          jabatan_petugas: actor.jabatan,
          updatedAt: new Date(),
        },
        {
          where: { id: body.id },
          transaction: this.t,
        }
      );

      this.message = `Menolak Pembayaran Donasi Secara Online  dengan Nama member Riwayat Donasi: ${info_riwayat_donasi.member_name} dan ID Riwayat donasi: ${info_riwayat_donasi.id}`;
    } catch (error) {
      console.log("GGGG");
      console.log(error);
      console.log("GGGG");
      this.state = false;
    }
  }

  async upload_bukti_transfer() {
    const body = this.req.body;

    try {
      const proofPath = this.req.transactionProof?.filename;
      if (
        !isSafeStoredFilename(proofPath, new Set([".jpg"]))
      ) {
        throw new Error("Bukti transfer tidak valid.");
      }
      const model_r = new Model_r(this.req);
      const info_riwayat_donasi = await model_r.info_riwayat_donasi(body.id);

      await Riwayat_donasi.update(
        {
          bukti_transfer: proofPath,
          nominal_transfer: body.nominal_transfer,
          status: "success",
          konfirmasi_pembayaran: "sudah_dikirim",
          updatedAt: new Date(),
        },
        {
          where: { id: body.id },
          transaction: this.t,
        }
      );

      this.state = true;
      this.message = `Mengunggah Bukti Transfer untuk Riwayat donasi dengan Nama member Riwayat donasi: ${info_riwayat_donasi.member_name} dan ID Riwayat donasi: ${info_riwayat_donasi.id}`;
    } catch (error) {
      console.log("DDDDDD");
      console.log(error);
      console.log("DDDDDD");
      this.state = false;
    }
  }

  async upload_bukti_setoran() {
    const body = this.req.body;

    try {
      const proofPath = this.req.transactionProof?.filename;
      if (
        !isSafeStoredFilename(proofPath, new Set([".jpg"]))
      ) {
        throw new Error("Bukti setoran tidak valid.");
      }
      const model_r = new Model_r(this.req);
      const info_riwayat_donasi = await model_r.info_riwayat_donasi(body.id);

      await Riwayat_donasi.update(
        {
          bukti_setoran: proofPath,
          nominal_setoran: body.nominal_setoran,
          status: "success",
          posisi_uang: "bank",
          konfirmasi_pembayaran: "sudah_dikirim",
          updatedAt: new Date(),
        },
        {
          where: { id: body.id },
          transaction: this.t,
        }
      );

      this.state = true;
      this.message = `Mengunggah Bukti Transfer untuk Riwayat donasi dengan Nama member Riwayat donasi: ${info_riwayat_donasi.member_name} dan ID Riwayat donasi: ${info_riwayat_donasi.id}`;
    } catch (error) {
      console.log("=======error2");
      console.log(error);
      console.log("=======error2");
      this.state = false;
    }
  }

  // Response konsisten
  async response(data = null) {
    if (this.state) {
      if (this.t) {
        await writeLog(this.req, this.t, { msg: this.message });
        await this.t.commit();
        for (const file of this.filesToDelete || []) {
          removeStoredFile(file.directory, file.filename, {
            allowedExtensions: new Set([".jpg", ".jpeg", ".png"]),
          });
        }
      }
      return { success: true, message: this.message, data };
    } else {
      if (this.t) await this.t.rollback();
      return { success: false, message: this.message };
    }
  }
}

module.exports = Model_cud;
