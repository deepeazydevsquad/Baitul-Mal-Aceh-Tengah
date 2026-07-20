const {
  Op,
  Kegiatan,
  Kecamatan,
  Desa,
  Asnaf,
  Program,
  Realisasi_permohonan,
  Desa_area_kegiatan,
  Kecamatan_area_kegiatan,
  Permohonan,
} = require("../../../models");
const moment = require("moment");

class Model_r {
  constructor(req) {
    this.req = req;
  }

  async initialize() {
    //
  }

  async generateYears(start) {
    const current = new Date().getFullYear();
    const years = [];
    for (let y = start; y <= current; y++) {
      years.push({ value: y.toString(), label: `Tahun ${y}` });
    }
    return years;
  }

  async get_filter_type() {
    const [type_year, type_asnaf_id, type_program_id] = await Promise.all([
      this.generateYears(2024),
      Asnaf.findAll({
        attributes: ["id", "name", "tipe"],
        group: ["id"],
        raw: true,
      }),
      Program.findAll({
        attributes: ["id", "name"],
        group: ["id"],
        raw: true,
      }),
    ]);

    console.log("==> type_asnaf_id from db:", type_asnaf_id);

    return {
      type_year,
      type_asnaf_id: type_asnaf_id.map((item) => ({
        value: item.id.toString(),
        label: item.name,
        tipe: item.tipe,
      })),
      type_program_id: type_program_id.map((item) => ({
        value: item.id.toString(),
        label: `Program ${item.name}`,
      })),
    };
  }

  async generate_kode() {
    let kode;
    let exists = true;

    do {
      // 2 huruf random (A-Z)
      const letters = Array.from({ length: 3 }, () =>
        String.fromCharCode(65 + Math.floor(Math.random() * 26))
      ).join("");

      // 4 angka random
      const numbers = Math.floor(1000 + Math.random() * 9000);

      kode = `${letters}-${numbers}`;

      exists = await Kegiatan.findOne({ where: { kode } });
    } while (exists);

    return kode;
  }

  async generate_slug() {
    const body = this.req.body;
    const baseSlug = body.nama_kegiatan
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    try {
      // Cari semua slug yang mirip
      const results = await Kegiatan.findAll({
        where: {
          slug: {
            [Op.like]: `${baseSlug}%`,
          },
        },
        attributes: ["slug"],
      });

      if (results.length === 0) {
        return baseSlug;
      }

      const existingSlugs = results.map((r) => r.slug);
      let maxSuffix = 0;

      existingSlugs.forEach((s) => {
        const match = s.match(new RegExp(`^${baseSlug}-(\\d+)$`));
        if (match) {
          const num = parseInt(match[1], 10);
          if (num > maxSuffix) maxSuffix = num;
        } else if (s === baseSlug) {
          maxSuffix = Math.max(maxSuffix, 0);
        }
      });

      console.log("maxSuffix", maxSuffix);
      console.log("baseSlug", baseSlug);
      console.log("result", `${baseSlug}-${maxSuffix + 1}`);

      return `${baseSlug}-${maxSuffix + 1}`;
    } catch (error) {
      console.error("Error generating slug:", error);
      return null;
    }
  }

  async daftar_desa() {
    try {
      const sql = await Desa.findAll({
        include: [
          {
            model: Kecamatan,
            attributes: ["name"],
          },
        ],
      });

      const data = sql.map((d) => ({
        id: d.id,
        name: `${d.name} (${d.Kecamatan.name})`,
      }));
      return data;
    } catch (error) {
      console.error("Gagal ambil daftar desa:", error);
      return [];
    }
  }

  async daftar_kecamatan() {
    try {
      const sql = await Kecamatan.findAll({});

      const data = sql.map((d) => ({
        id: d.id,
        name: d.name,
      }));
      return data;
    } catch (error) {
      console.error("Gagal ambil daftar kecamatan:", error);
      return [];
    }
  }

  async program_kegiatan_bantuan() {
    const body = this.req.body;
    console.log(body);
    const limit = parseInt(body.perpage, 10) || 10;
    const page =
      body.pageNumber && body.pageNumber !== "0"
        ? parseInt(body.pageNumber, 10)
        : 1;

    // search filter
    const where = body.search
      ? {
          [Op.or]: [{ nama_kegiatan: { [Op.like]: `%${body.search}%` } }],
        }
      : {};

    // Tipe filter (ASNAF, PROGRAM, STATUS_KEGIATAN, TAHUN) yang dinamis
    const typeFilter = {};
    if (body.type_status_kegiatan) {
      typeFilter.status_kegiatan = body.type_status_kegiatan;
    }
    if (body.type_asnaf_id) {
      typeFilter.asnaf_id = body.type_asnaf_id;
    }
    if (body.type_program_id) {
      typeFilter.program_id = body.type_program_id;
    }
    if (body.type_year) {
      typeFilter.tahun = body.type_year;
    }

    try {
      const result = await Kegiatan.findAndCountAll({
        limit,
        offset: (page - 1) * limit,
        order: [["id", "DESC"]],
        attributes: [
          "id",
          "asnaf_id",
          "program_id",
          "kode",
          "nama_kegiatan",
          "slug",
          "status_tampil",
          "jumlah_dana",
          "jumlah_maksimal_nominal_bantuan",
          "jumlah_target_penerima",
          "sumber_dana",
          "area_penyaluran",
          "jenis_penyaluran",
          "status_kegiatan",
          "tahun",
          "banner",
          "desc",
          "updatedAt",
        ],
        where: { ...where, ...typeFilter },
        include: [
          {
            model: Asnaf,
            attributes: ["id", "name"],
          },
          {
            model: Program,
            attributes: ["id", "name"],
          },
        ],
      });

      return {
        data: result.rows.map((item) => ({
          id: item.id,
          asnaf_id: item.asnaf_id,
          program_id: item.program_id,
          kategori_asnaf: item.Asnaf?.name || null,
          kategori_program: item.Program?.name || null,
          kode: item.kode,
          nama_kegiatan: item.nama_kegiatan,
          slug: item.slug,
          status_tampil: item.status_tampil,
          jumlah_dana: item.jumlah_dana,
          jumlah_maksimal_nominal_bantuan: item.jumlah_maksimal_nominal_bantuan,
          jumlah_target_penerima: item.jumlah_target_penerima,
          sumber_dana: item.sumber_dana,
          area_penyaluran: item.area_penyaluran,
          jenis_penyaluran: item.jenis_penyaluran,
          status_kegiatan: item.status_kegiatan === "selesai",
          tahun: item.tahun,
          banner: item.banner,
          desc: item.desc,
          datetimes: moment(item.updatedAt).format("YYYY-MM-DD HH:mm:ss"),
        })),
        total: result.count,
      };
    } catch (error) {
      console.error("Error fetching kegiatan data:", error);
      return { data: [], total: 0 };
    }
  }

  async get_info_edit_program_kegiatan_bantuan() {
    const body = this.req.body;
    try {
      const result = await Kegiatan.findByPk(body.id, {
        attributes: [
          "asnaf_id",
          "program_id",
          "kode",
          "nama_kegiatan",
          "status_tampil",
          "jumlah_dana",
          "jumlah_maksimal_nominal_bantuan",
          "jumlah_target_penerima",
          "sumber_dana",
          "area_penyaluran",
          "jenis_penyaluran",
          "tahun",
          "start_date",
          "end_date",
          "banner",
          "desc",
        ],
      });

      const get_desa_penyaluran = async () => {
        const result = await Desa_area_kegiatan.findAll({
          where: { kegiatan_id: body.id },
          attributes: ["desa_id", "kuota"],
        });
        return result.length > 0 ? result : [];
      };

      const get_kecamatan_penyaluran = async () => {
        const result = await Kecamatan_area_kegiatan.findAll({
          where: { kegiatan_id: body.id },
          attributes: ["kecamatan_id", "kuota"],
        });
        return result.length > 0 ? result : [];
      };

      const [desa_penyaluran, kecamatan_penyaluran] = await Promise.all([
        get_desa_penyaluran(),
        get_kecamatan_penyaluran(),
      ]);

      return {
        id: result.id,
        asnaf_id: result.asnaf_id || "",
        program_id: result.program_id,
        kode: result.kode,
        nama_kegiatan: result.nama_kegiatan,
        status_tampil: result.status_tampil === "tampil",
        jumlah_dana: result.jumlah_dana,
        jumlah_maksimal_nominal_bantuan: result.jumlah_maksimal_nominal_bantuan,
        jumlah_target_penerima: result.jumlah_target_penerima,
        sumber_dana: result.sumber_dana,
        area_penyaluran: result.area_penyaluran,
        desa_penyaluran: desa_penyaluran,
        kecamatan_penyaluran: kecamatan_penyaluran,
        jenis_penyaluran: result.jenis_penyaluran,
        tahun: result.tahun,
        date_range:
          result.start_date && result.end_date
            ? {
                start: moment(result.start_date).format("YYYY-MM-DD"),
                end: moment(result.end_date).format("YYYY-MM-DD"),
              }
            : null,
        banner: result.banner,
        desc: result.desc,
      };
    } catch (error) {
      console.error("Error fetching program kegiatan bantuan data:", error);
      return { data: [] };
    }
  }

  async get_edit_status_program_bantuan() {
    const body = this.req.body;
    try {
      const result = await Kegiatan.findByPk(body.id, {
        attributes: ["id", "status_kegiatan"],
      });
      return {
        id: result.id,
        status_kegiatan: result.status_kegiatan === "selesai",
      };
    } catch (error) {
      console.error("Error fetching program kegiatan bantuan data:", error);
      return { data: [] };
    }
  }

  async info_program_kegiatan_bantuan(id) {
    try {
      const result = await Kegiatan.findByPk(id, {
        attributes: [
          "id",
          "asnaf_id",
          "program_id",
          "kode",
          "nama_kegiatan",
          "slug",
          "status_tampil",
          "jumlah_dana",
          "jumlah_maksimal_nominal_bantuan",
          "jumlah_target_penerima",
          "sumber_dana",
          "area_penyaluran",
          "jenis_penyaluran",
          "status_kegiatan",
          "tahun",
          "banner",
          "desc",
        ],
      });
      return {
        id: result.id,
        asnaf_id: result.asnaf_id,
        program_id: result.program_id,
        kode: result.kode,
        nama_kegiatan: result.nama_kegiatan,
        slug: result.slug,
        status_tampil: result.status_tampil === "tampil",
        jumlah_dana: result.jumlah_dana,
        jumlah_maksimal_nominal_bantuan: result.jumlah_maksimal_nominal_bantuan,
        jumlah_target_penerima: result.jumlah_target_penerima,
        sumber_dana: result.sumber_dana,
        area_penyaluran: result.area_penyaluran,
        jenis_penyaluran: result.jenis_penyaluran,
        status_kegiatan: result.status_kegiatan,
        tahun: result.tahun,
        banner: result.banner,
        desc: result.desc,
      };
    } catch (error) {
      console.error("Error fetching bank data:", error);
      return {};
    }
  }
}

module.exports = Model_r;
