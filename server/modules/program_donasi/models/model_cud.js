const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");
const {
  sequelize,
  Program_donasi,
  Riwayat_donasi,
} = require("../../../models");
const { writeLog } = require("../../../helper/writeLogHelper");
const moment = require("moment");

class Model_cud {
  constructor(req) {
    this.req = req;
  }

  async initialize() {
    this.t = await sequelize.transaction();
    this.state = true;
  }

  async generateSlug(name) {
    return name
      .replace(/\s+/g, "-")
      .replace(/[^a-zA-Z0-9-]/g, "")
      .replace(/-+/g, "-")
      .toLowerCase();
  }

  async add() {
    await this.initialize();
    const myDate = moment(new Date()).format("YYYY-MM-DD HH:mm:ss");
    const body = this.req.body;
    try {
      const insert = await Program_donasi.create(
        {
          name: body.name,
          slug: await this.generateSlug(body.name),
          banner: body.photoPath,
          tahun: body.tahun,
          deskripsi: body.deskripsi,
          target_donasi_terkumpul: body.target_donasi_terkumpul,
          status: "sedang_berlangsung",
          waktu_donasi: body.waktu_donasi,
          createdAt: myDate,
          updatedAt: myDate,
        },
        {
          transaction: this.t,
        },
      );
      this.message = `Menambahkan Program Donasi Baru dengan Nama Program Donasi: ${body.name} dan ID Program Donasi: ${insert.id}`;
    } catch (error) {
      this.state = false;
      console.log(error);
    }
  }

  async edit() {
    await this.initialize();
    const myDate = moment(new Date()).format("YYYY-MM-DD HH:mm:ss");
    const body = this.req.body;

    try {
      // Ambil data lama
      const program = await Program_donasi.findByPk(body.id, {
        transaction: this.t,
      });

      if (!program) throw new Error("Data Program Donasi tidak ditemukan");

      let newBanner = program.banner;

      // CASE 1: Upload banner baru
      if (body.photoPath) {
        if (program.banner) {
          const oldFile = path.join(
            __dirname,
            "../../../uploads/img/program_donasi/",
            program.banner,
          );
          if (fs.existsSync(oldFile)) fs.unlinkSync(oldFile);
        }
        newBanner = body.photoPath;
      }
      // CASE 2: Hanya ganti nama program
      else if (body.name && body.name !== program.name && program.banner) {
        const oldPath = path.join(
          __dirname,
          "../../../uploads/img/program_donasi/",
          program.banner,
        );
        const ext = path.extname(program.banner);
        const safeName = body.name.toLowerCase().replace(/\s+/g, "_");
        const newFilename = `${safeName}${ext}`;
        const newPath = path.join(
          __dirname,
          "../../../uploads/img/program_donasi/",
          newFilename,
        );

        if (fs.existsSync(oldPath)) {
          fs.renameSync(oldPath, newPath);
          newBanner = newFilename;
        }
      }

      // Update ke DB
      await program.update(
        {
          name: body.name,
          slug: await this.generateSlug(body.name),
          banner: newBanner,
          tahun: body.tahun,
          deskripsi: body.deskripsi,
          target_donasi_terkumpul: body.target_donasi_terkumpul,
          status: body.status ?? program.status,
          waktu_donasi: body.waktu_donasi,
          updatedAt: myDate,
        },
        { transaction: this.t },
      );

      this.message = `Memperbaharui Program Donasi dengan ID: ${body.id}, Nama Lama: ${program.name}, menjadi Nama Baru: ${body.name}`;
    } catch (error) {
      this.state = false;
      this.message = error.message;
      console.log(error);
    }
  }

  async kode() {
    const digits = "0123456789";
    let result = "";
    for (let i = 0; i < 6; i++) {
      result += digits.charAt(Math.floor(Math.random() * digits.length));
    }
    return Promise.resolve(result);
  }

  // 6 angka + huruf kapital
  async invoice() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return Promise.resolve(result);
  }

  async add_donasi() {
    await this.initialize();
    const myDate = moment(new Date()).format("YYYY-MM-DD HH:mm:ss");
    const body = this.req.body;

    const authHeader = this.req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    const decoded = jwt.decode(token);

    try {
      const payload = {
        program_donasi_id: body.program_donasi_id,
        member_id: body.member_id,
        invoice: await this.invoice(),
        nominal: body.nominal,
        kode: "000",
        tipe_pembayaran: body.tipe_pembayaran,
        konfirmasi_pembayaran: "belum_dikirim",
        posisi_uang:
          body.tipe_pembayaran == "cash" ? "kantor_baitulmal" : "bank",
        nama_petugas: decoded.name,
        jabatan_petugas: decoded.jabatan,
        createdAt: myDate,
        updatedAt: myDate,
      };

      if (body.wakalah_id && body.wakalah_id != 0) {
        payload["wakalah_id"] = body.wakalah_id ?? null;
      }

      const insert = await Riwayat_donasi.create(payload, {
        transaction: this.t,
      });

      this.message = `Menambahkan Riwayat Donasi Baru dengan Nominal Donasi: ${body.nominal} dan ID Riwayat Donasi: ${insert.id}`;
    } catch (error) {
      this.state = false;
      console.log(error);
    }
  }

  async close() {
    await this.initialize();
    const myDate = moment(new Date()).format("YYYY-MM-DD HH:mm:ss");
    const body = this.req.body;

    try {
      const program = await Program_donasi.findByPk(body.id, {
        transaction: this.t,
      });

      if (!program) throw new Error("Data Program Donasi tidak ditemukan");

      await program.update(
        {
          status: "ditutup",
          updatedAt: myDate,
        },
        { transaction: this.t },
      );

      this.message = `Program Donasi dengan ID: ${body.id} berhasil ditutup`;
    } catch (error) {
      this.state = false;
      this.message = error.message;
      console.log(error);
    }
  }

  async delete() {
    await this.initialize();
    const body = this.req.body;

    try {
      const program = await Program_donasi.findByPk(body.id, {
        transaction: this.t,
      });

      if (!program) throw new Error("Data Program Donasi tidak ditemukan");

      // Hapus file banner jika ada
      if (program.banner) {
        const filePath = path.join(
          __dirname,
          "../../../uploads/img/program_donasi/",
          program.banner,
        );
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }

      await program.destroy({ transaction: this.t });

      this.message = `Program Donasi dengan ID: ${body.id} berhasil dihapus`;
    } catch (error) {
      this.state = false;
      this.message = error.message;
      console.log(error);
    }
  }

  // response
  async response() {
    if (!this.t) return false; // pastikan transaksi ada
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
