const {
  Op,
  Kegiatan,
  Syarat,
  Surveyor,
  Syarat_kegiatan,
  Kriteria,
  Surveyor_kegiatan,
  Asnaf,
  Program,
  Setting,
} = require("../../../models");

const moment = require("moment");

const axios = require("axios");
const FormData = require("form-data");

class Model_r {
  constructor(req) {
    this.req = req;
  }

  async daftar_syarat() {
    const data = await Syarat.findAll({
      attributes: ["id", "name"],
      order: [["id", "ASC"]],
    });

    return {
      success: true,
      data: data,
      message: "Data berhasil diambil",
    };
  }

  async detail_syarat() {
    const body = this.req.body;
    const data = await Syarat_kegiatan.findAll({
      where: { kegiatan_id: body.kegiatan_id },
      include: [
        {
          model: Syarat,
          attributes: ["id", "name"],
        },
      ],
    });

    const hasil = data.map((item) => ({
      id: item.Syarat.id,
      name: item.Syarat.name,
    }));

    return {
      success: true,
      data: hasil,
      message: "Data berhasil diambil",
    };
  }

  async detail_kriteria() {
    const body = this.req.body;
    const data = await Kriteria.findAll({
      where: { kegiatan_id: body.kegiatan_id },
    });

    return {
      success: true,
      data: data,
      message: "Data berhasil diambil",
    };
  }

  async daftar_surveyor() {
    const data = await Surveyor.findAll({
      attributes: ["id", "name"],
      order: [["id", "ASC"]],
    });

    return {
      success: true,
      data: data,
      message: "Data berhasil diambil",
    };
  }

  async detail_surveyor() {
    const body = this.req.body;

    // ambil kegiatan dulu biar tetep ada walaupun ga ada surveyor
    const kegiatan = await Kegiatan.findByPk(body.kegiatan_id, {
      attributes: ["id", "nama_kegiatan"],
    });

    if (!kegiatan) {
      return {
        success: false,
        data: [],
        message: "Kegiatan tidak ditemukan",
      };
    }

    // ambil surveyor yang terkait
    const data = await Surveyor_kegiatan.findAll({
      where: { kegiatan_id: body.kegiatan_id },
      include: [
        {
          model: Surveyor,
          attributes: ["id", "name"],
        },
      ],
    });

    let hasil = [];

    if (data.length > 0) {
      hasil = data.map((item) => ({
        id: item.Surveyor.id,
        surveyor_kegiatan_id: item.id,
        name: item.Surveyor.name,
        kegiatan: kegiatan.nama_kegiatan,
        sk: item.sk,
      }));
    } else {
      // kalau ga ada surveyor, tetep return nama kegiatan
      hasil.push({
        id: null,
        name: null,
        kegiatan: kegiatan.nama_kegiatan,
      });
    }

    return {
      success: true,
      data: hasil,
      message: "Data berhasil diambil",
    };
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
        attributes: ["id", "name"],
        group: ["id"],
        raw: true,
      }),
      Program.findAll({
        attributes: ["id", "name"],
        group: ["id"],
        raw: true,
      }),
    ]);

    return {
      type_year,
      type_asnaf_id: type_asnaf_id.map((item) => ({
        value: item.id.toString(),
        label: item.name,
      })),
      type_program_id: type_program_id.map((item) => ({
        value: item.id.toString(),
        label: `Program ${item.name}`,
      })),
    };
  }

  async program_kegiatan_bantuan() {
    const body = this.req.body;
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
        distinct: true,
        limit,
        offset: (page - 1) * limit,
        order: [["id", "ASC"]],
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
          {
            model: Syarat_kegiatan,
            include: {
              model: Syarat,
              attributes: ["id", "name"],
            },
          },
          {
            model: Kriteria,
            attributes: ["id", "name"],
          },
          {
            model: Surveyor_kegiatan,
            attributes: ["id", "sk", "access_code"],
            include: [
              {
                model: Surveyor,
                attributes: ["id", "name"],
              },
            ],
          },
        ],
      });


      return {
        data: result.rows.map((item) => ({
          id: item.id,
          asnaf_id: item.asnaf_id,
          program_id: item.program_id,
          kategori_asnaf: item.Asnaf?.name,
          kategori_program: item.Program?.name,
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
          syarat:
            item.Syarat_kegiatans?.map((syk) => ({
              id: syk.Syarat.id,
              name: syk.Syarat.name,
            })) || [],
          kriteria:
            item.Kriteria?.map((k) => ({
              id: k.id,
              name: k.name,
            })) || [],
          // 🟢 List semua kegiatan
          kegiatans:
            item.Surveyor_kegiatans?.map((sk) => ({
              id: sk.id,
              sk: sk.sk,
            })) || [],

          // 🟢 List semua surveyor
          surveyors:
            item.Surveyor_kegiatans?.map((sk) => ({
              id: sk.Surveyor.id,
              name: sk.Surveyor.name,
              access_code: sk.access_code,
            })) || [],
        })),
        total: result.count,
      };
    } catch (error) {
      console.error("Error fetching kegiatan data:", error);
      return { data: [], total: 0 };
    }
  }

  async kirim_pesan_wa() {
    const body = this.req.body;

    // Ambil nomor surveyor sesuai kegiatan
    const get_number = await Surveyor_kegiatan.findAll({
      where: { kegiatan_id: body.kegiatan_id },
      attributes: ["access_code"],
      include: [
        {
          model: Surveyor,
          attributes: ["whatsapp_number"],
        },
      ],
    });

    // Ambil setting dari DB
    const settingsArray = await Setting.findAll({
      where: {
        name: { [Op.in]: ["api_key", "device_key", "whatsapp_number"] },
      },
      attributes: ["name", "value"],
    });

    const settings = {};
    settingsArray.forEach((s) => (settings[s.name] = s.value));

    if (!settings.api_key || !settings.device_key) {
      throw new Error("api_key / device_key belum ada di database");
    }

    // Loop kirim ke semua surveyor
    for (const item of get_number) {
      try {
        const acces_code = item.access_code;
        const formData = new FormData();
        formData.append("api_key", settings.api_key);
        formData.append("device_key", settings.device_key);
        formData.append("destination", item.Surveyor.whatsapp_number);
        const surveyBaseUrl = String(
          process.env.SURVEY_BASE_URL || "https://localhost:5173"
        ).replace(/\/+$/, "");
        formData.append(
          "message",
          `ini adalah link survey anda ${surveyBaseUrl}/survey#code=${encodeURIComponent(
            acces_code
          )}`
        );

        const response = await axios.post(
          "https://wapisender.id/api/v5/message/text",
          formData,
          {
            headers: formData.getHeaders(),
          }
        );

        console.log("WhatsApp survey invitation sent successfully.");

        // Debug response dari WapiSender
        console.log("✅ Sukses kirim WA ke:", item.Surveyor.whatsapp_number);
        console.log("📩 Response data:", response.data);
        console.log("🔢 Status code:", response.status);
      } catch (error) {
        console.error("❌ Gagal kirim WA ke:", item.Surveyor.whatsapp_number);
        if (error.response) {
          console.error("📩 Error response:", error.response.data);
          console.error("🔢 Status code:", error.response.status);
        } else {
          console.error("⚠️ Error message:", error.message);
        }
      }
    }

    return { status: "success", total: get_number.length };
  }
}
module.exports = Model_r;
