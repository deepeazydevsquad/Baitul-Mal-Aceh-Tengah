const fs = require("fs");
const path = require("path");
const {
  sequelize,
  Program_donasi,
  Riwayat_donasi,
} = require("../../../models");
const { writeLog } = require("../../../helper/writeLogHelper");
const moment = require("moment");

const BANNER_DIRECTORY = path.resolve(
  __dirname,
  "../../../uploads/img/program_donasi"
);
const SAFE_BANNER_EXTENSIONS = new Set([".jpeg", ".jpg", ".png", ".webp"]);

function isPathInsideDirectory(directory, targetPath) {
  const relativePath = path.relative(
    path.resolve(directory),
    path.resolve(targetPath)
  );
  return (
    relativePath !== "" &&
    relativePath !== ".." &&
    !relativePath.startsWith(`..${path.sep}`) &&
    !path.isAbsolute(relativePath)
  );
}

function resolveBannerPath(filename, directory = BANNER_DIRECTORY) {
  if (typeof filename !== "string" || !filename || filename !== filename.trim()) {
    return null;
  }
  if (
    filename.includes("\0") ||
    filename.includes("/") ||
    filename.includes("\\") ||
    path.basename(filename) !== filename ||
    !SAFE_BANNER_EXTENSIONS.has(path.extname(filename).toLowerCase())
  ) {
    return null;
  }

  const root = path.resolve(directory);
  let targetPath;
  try {
    const realRoot = fs.realpathSync(root);
    targetPath = path.resolve(realRoot, filename);
    if (!isPathInsideDirectory(realRoot, targetPath)) return null;
  } catch (error) {
    if (error?.code !== "ENOENT") return null;
    targetPath = path.resolve(root, filename);
    if (!isPathInsideDirectory(root, targetPath)) return null;
  }

  return targetPath;
}

function removeBannerFile(filename, directory = BANNER_DIRECTORY) {
  const targetPath = resolveBannerPath(filename, directory);
  if (!targetPath) return false;

  try {
    const stat = fs.lstatSync(targetPath);
    if (!stat.isFile() && !stat.isSymbolicLink()) return false;
    fs.unlinkSync(targetPath);
    return true;
  } catch (error) {
    return false;
  }
}

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

  getServerUploadedBanner() {
    const filename = this.req.programDonasiBanner;
    if (!resolveBannerPath(filename)) {
      if (filename) {
        throw new Error("Referensi banner tidak valid.");
      }
      return null;
    }
    return filename;
  }

  removeNewUploadedBanner() {
    removeBannerFile(this.req.programDonasiBanner);
  }

  async add() {
    const myDate = moment(new Date()).format("YYYY-MM-DD HH:mm:ss");
    const body = this.req.body;
    try {
      await this.initialize();
      const insert = await Program_donasi.create(
        {
          name: body.name,
          slug: await this.generateSlug(body.name),
          banner: this.getServerUploadedBanner(),
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
        }
      );
      this.message = `Menambahkan Program Donasi Baru dengan Nama Program Donasi: ${body.name} dan ID Program Donasi: ${insert.id}`;
    } catch (error) {
      this.state = false;
      this.removeNewUploadedBanner();
      console.log(error);
    }
  }

  async edit() {
    const myDate = moment(new Date()).format("YYYY-MM-DD HH:mm:ss");
    const body = this.req.body;

    try {
      await this.initialize();
      // Ambil data lama
      const program = await Program_donasi.findByPk(body.id, {
        transaction: this.t,
      });

      if (!program) throw new Error("Data Program Donasi tidak ditemukan");

      let newBanner = program.banner;
      const uploadedBanner = this.getServerUploadedBanner();

      // CASE 1: Upload banner baru
      if (uploadedBanner) {
        this.oldBannerToRemove = program.banner;
        newBanner = uploadedBanner;
      }
      // CASE 2: Hanya ganti nama program
      else if (body.name && body.name !== program.name && program.banner) {
        const oldPath = resolveBannerPath(program.banner);
        const ext = path.extname(program.banner);
        const safeName = body.name.toLowerCase().replace(/[^a-z0-9]/g, "_");
        const newFilename = `${safeName}-${body.id}${ext}`;
        const newPath = resolveBannerPath(newFilename);

        if (
          oldPath &&
          newPath &&
          !fs.existsSync(newPath) &&
          fs.existsSync(oldPath)
        ) {
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
        { transaction: this.t }
      );

      this.message = `Memperbaharui Program Donasi dengan ID: ${body.id}, Nama Lama: ${program.name}, menjadi Nama Baru: ${body.name}`;
    } catch (error) {
      this.state = false;
      this.message = error.message;
      this.removeNewUploadedBanner();
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

    const actor = this.req.user;

    try {
      const insert = await Riwayat_donasi.create(
        {
          program_donasi_id: body.program_donasi_id,
          member_id: body.member_id,
          invoice: await this.invoice(),
          nominal: body.nominal,
          kode: "000",
          tipe_pembayaran: body.tipe_pembayaran,
          konfirmasi_pembayaran: "belum_dikirim",
          posisi_uang:
            body.tipe_pembayaran == "cash" ? "kantor_baitulmal" : "bank",
          nama_petugas: actor.name,
          jabatan_petugas: actor.jabatan,
          createdAt: myDate,
          updatedAt: myDate,
        },
        {
          transaction: this.t,
        }
      );

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
        { transaction: this.t }
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

      await program.destroy({ transaction: this.t });
      this.bannerToRemoveAfterCommit = program.banner;

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
      if (this.oldBannerToRemove) {
        removeBannerFile(this.oldBannerToRemove);
      }
      if (this.bannerToRemoveAfterCommit) {
        removeBannerFile(this.bannerToRemoveAfterCommit);
      }
      return true;
    } else {
      await this.t.rollback();
      this.removeNewUploadedBanner();
      return false;
    }
  }
}

Model_cud.BANNER_DIRECTORY = BANNER_DIRECTORY;
Model_cud.resolveBannerPath = resolveBannerPath;
Model_cud.removeBannerFile = removeBannerFile;

module.exports = Model_cud;
