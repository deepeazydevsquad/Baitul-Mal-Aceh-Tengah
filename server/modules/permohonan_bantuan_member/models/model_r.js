const { where } = require("sequelize");
const {
  Sequelize,
  Op,
  Syarat,
  Syarat_kegiatan,
  Kriteria,
  Kegiatan,
  Permohonan,
  Realisasi_permohonan,
  Kecamatan_area_kegiatan,
  Desa_area_kegiatan,
  Desa,
  Kecamatan,
  Member,
  Bank,
} = require("../../../models");

const { get_member_id } = require("../../../helper/memberHelper");

class Model_r {
  constructor(req) {
    this.req = req;
    this.member_id = null;
  }

  async initialize() {
    this.member_id = await get_member_id(this.req);
  }

  async info_kegiatan(kegiatan_id) {
    try {
      const kegiatan = await Kegiatan.findOne({
        where: { id: kegiatan_id },
        raw: true,
        nest: true,
        attributes: [
          "id",
          "nama_kegiatan",
          "jumlah_dana",
          "jumlah_maksimal_nominal_bantuan",
          "tahun",
          "area_penyaluran",
          "status_kegiatan",
          "periode_bantuan",
        ],
      });
      return kegiatan;
    } catch (error) {
      console.error("Error fetching info for kegiatan:", error);
      return null;
    }
  }

  async info_member_cud(member_id) {
    try {
      const member = await Member.findOne({
        where: { id: member_id },
        raw: true,
        nest: true,
        attributes: ["id", "fullname", "tipe", "desa_id"],
      });
      return member;
    } catch (error) {
      console.error("Error fetching info for member:", error);
      return null;
    }
  }

  async get_info_member() {
    await this.initialize();
    try {
      const data = await Member.findOne({
        where: {
          id: this.member_id,
        },
        attributes: ["id", "fullname", "nomor_ktp", "whatsapp_number"],
      });
      return {
        member_id: data.id,
        nama_pemohon: data.fullname,
        nomor_ktp: data.nomor_ktp,
        whatsapp_number: data.whatsapp_number,
      };
    } catch (error) {
      console.error("Error fetching data:", error);
      return {};
    }
  }

  async get_syarat() {
    const body = this.req.body;
    try {
      const data = await Syarat_kegiatan.findAll({
        where: {
          kegiatan_id: body.kegiatan_id,
        },
        include: [
          {
            model: Syarat,
            attributes: ["id", "name"],
          },
        ],
      });

      const hasil = data.map((item) => ({
        id: item.Syarat?.id,
        name: item.Syarat?.name,
      }));

      return {
        success: true,
        data: hasil,
        message: "Data berhasil diambil",
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: error.message,
      };
    }
  }

  async get_kriteria() {
    const body = this.req.body;
    try {
      const result = await Kriteria.findAll({
        attributes: ["id", "name"],
        where: {
          kegiatan_id: body.kegiatan_id,
        },
      });
      const hasil = result.map((item) => ({
        id: item.id,
        name: item.name,
      }));
      return {
        success: true,
        data: hasil,
        message: "Data berhasil diambil",
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: error.message,
      };
    }
  }

  async get_desc() {
    const body = this.req.body;
    try {
      const result = await Kegiatan.findOne({
        attributes: ["id", "desc", "nama_kegiatan", "banner"],
        where: {
          id: body.kegiatan_id,
        },
      });
      return {
        success: true,
        data: result,
        message: "Data berhasil diambil",
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: error.message,
      };
    }
  }

  async get_info() {
    const body = this.req.body;
    try {
      const sudah_realisasi = "sudah_direalisasi";

      const permohonanIds = await Permohonan.findAll({
        where: { kegiatan_id: body.kegiatan_id },
        attributes: ["id"],
        raw: true,
      });

      console.log("✅ permohonanIds:", permohonanIds);

      const listId = permohonanIds.map((p) => p.id);
      console.log("✅ listId:", listId);

      if (listId.length === 0) {
        console.log("⚠️ gak ada data permohonan");
        return {
          success: true,
          data: {
            jumlah_permohonan: 0,
            jumlah_penerima: 0,
            jumlah_realisasi: 0,
          },
          message: "Belum ada data permohonan untuk kegiatan ini",
        };
      }

      const jumlah_permohonan = listId.length;
      console.log("✅ jumlah_permohonan:", jumlah_permohonan);

      const jumlah_penerima = await Realisasi_permohonan.count({
        where: {
          permohonan_id: listId,
          status_realisasi: sudah_realisasi,
        },
      });
      console.log("✅ jumlah_penerima:", jumlah_penerima);

      const resultRealisasi = await Realisasi_permohonan.findOne({
        where: {
          permohonan_id: listId,
          status_realisasi: sudah_realisasi,
        },
        attributes: [
          [
            Sequelize.fn("SUM", Sequelize.col("biaya_disetujui")),
            "total_biaya",
          ],
        ],
        raw: true,
      });

      console.log("✅ resultRealisasi:", resultRealisasi);

      const jumlah_realisasi = resultRealisasi?.total_biaya || 0;

      console.log("✅ jumlah_realisasi:", jumlah_realisasi);

      return {
        success: true,
        data: { jumlah_permohonan, jumlah_penerima, jumlah_realisasi },
        message: "Data berhasil diambil",
      };
    } catch (error) {
      console.error("❌ error di get_info:", error);
      return {
        success: false,
        data: null,
        message: error.message,
      };
    }
  }

  async get_lokasi() {
    const body = this.req.body;
    try {
      const kegiatan = await Kegiatan.findOne({
        attributes: ["area_penyaluran"],
        where: {
          id: body.kegiatan_id,
        },
      });

      if (!kegiatan) {
        return {
          success: false,
          data: null,
          message: "Kegiatan tidak ditemukan",
        };
      }

      const area_penyaluran = kegiatan.area_penyaluran;

      if (area_penyaluran === "kabupaten") {
        return {
          success: true,
          data: { name: "Kabupaten" },
          message: "Data berhasil diambil",
        };
      } else if (area_penyaluran === "kecamatan") {
        const data = await Kecamatan_area_kegiatan.findAll({
          where: { kegiatan_id: body.kegiatan_id },
          include: [
            {
              model: Kecamatan,
              attributes: ["id", "name"],
            },
          ],
        });

        const hasil = data.map((item) => ({
          id: item.Kecamatan?.id,
          name: item.Kecamatan?.name,
          kuota: item.kuota,
        }));

        return {
          success: true,
          data: hasil,
          message: "Data berhasil diambil",
        };
      } else if (area_penyaluran === "desa") {
        const data = await Desa_area_kegiatan.findAll({
          where: { kegiatan_id: body.kegiatan_id },
          include: [
            {
              model: Desa,
              attributes: ["id", "name"],
            },
          ],
        });

        const hasil = data.map((item) => ({
          id: item.Desa?.id,
          name: item.Desa?.name,
          kuota: item.kuota,
        }));

        return {
          success: true,
          data: hasil,
          message: "Data berhasil diambil",
        };
      } else {
        return {
          success: false,
          data: null,
          message: "Area penyaluran tidak dikenali",
        };
      }
    } catch (error) {
      return {
        success: false,
        data: null,
        message: error.message,
      };
    }
  }

  async list_bank() {
    try {
      const banks = await Bank.findAndCountAll({ attributes: ["id", "name"] });
      return {
        data: banks.rows.map((e) => ({
          id: e.id,
          name: e.name,
        })),
        total: banks.count,
      };
    } catch (error) {
      console.error("Error fetching info for bank:", error);
      return { banks: [], members: [] };
    }
  }

  async daftar_syarat() {
    try {
      const syarat = await Syarat_kegiatan.findAll({
        where: {
          kegiatan_id: this.req.body.kegiatan_id,
        },
        include: [
          {
            model: Syarat,
            attributes: ["id", "name"],
          },
        ],
      });

      const data = syarat.map((item) => ({
        id: item.Syarat.id,
        name: item.Syarat.name,
        path: item.Syarat.path,
      }));

      return {
        success: true,
        data: data,
        message: "Data berhasil diambil",
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: error.message,
      };
    }
  }
}

module.exports = Model_r;
