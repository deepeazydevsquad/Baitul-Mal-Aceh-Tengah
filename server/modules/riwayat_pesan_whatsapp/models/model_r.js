const {
  Op,
  Setting,
  Whatsapp_template,
  Whatsapp_message,
  Surveyor,
  Riwayat_pengumpulan,
  Member,
} = require("../../../models");
const moment = require("moment");
const { convertToRP } = require("../../../helper/currencyHelper");
const {
  whatsapp_number,
} = require("../../../validation/riwayat_pesan_whatsapp");

class Model_r {
  constructor(req) {
    this.req = req;
  }

  // ambil data untuk template pesan
  async jenis_pesan() {
    try {
      // ambil nomor asal
      const jenisPesan = await Whatsapp_message.findAll({
        attributes: ["name", "message"],
      });
      console.log(jenisPesan);
    } catch (error) {
      console.error("Error fetching Whatsapp_template data:", error);
      return {
        jenis_pesan: ["name", "message"],
      };
    }
  }

  async get_template_pesan_whatsapp() {
    try {
      let data = [];
      // ambil nomor asal
      await Whatsapp_template.findAll({
        where: { type: this.req.body.type },
      }).then(async (value) => {
        await Promise.all(
          await value.map(async (e) => {
            data.push({ id: e.id, name: e.name });
          })
        );
      });
      return data;
    } catch (error) {
      console.error("Error fetching Whatsapp_template data:", error);
      return {};
    }
  }

  async get_pesan_template_pesan_whatsapp() {
    try {
      var q = await Whatsapp_template.findOne({
        where: {
          id: this.req.body.template_id,
        },
      });
      return { message: q.message, variable: JSON.parse(q.variable) };
    } catch (error) {
      console.error("Error:", error);
      return "";
    }
  }

  async get_parameter_setting() {
    try {
      var data = {};
      await Setting.findAll({
        where: {
          name: { [Op.in]: ["api_key", "device_key", "whatsapp_number"] },
        },
      }).then(async (value) => {
        await Promise.all(
          await value.map(async (e) => {
            if (e.name == "api_key") {
              data["api_key"] = e.value;
            }
            if (e.name == "device_key") {
              data["device_key"] = e.value;
            }
            if (e.name == "whatsapp_number") {
              data["whatsapp_number"] = e.value;
            }
          })
        );
      });
      return data;
    } catch (error) {
      console.error("Error:", error);
      return {};
    }
  }

  async get_info_template() {
    try {
      var q = await Whatsapp_template.findOne({
        where: {
          id: this.req.body.template_id,
        },
      });
      return {
        message: q.message,
        variable: JSON.parse(q.variable),
      };
    } catch (error) {
      console.error("Error:", error);
      return {};
    }
  }

  async get_info_surveyor() {
    try {
      var data = [];
      await Surveyor.findAll().then(async (value) => {
        await Promise.all(
          await value.map(async (e) => {
            data.push({
              nama_surveyor: e.name,
              nomor_identitas: e.nik,
              nomor_whatsapp: e.whatsapp_number,
            });
          })
        );
      });
      return data;
    } catch (error) {
      return [];
    }
  }

  async get_info_munfiq() {
    try {
      var data = {};
      await Riwayat_pengumpulan.findAll({
        where: { tipe: "infaq" },
        include: {
          required: true,
          model: Member,
        },
      }).then(async (value) => {
        // essage: 'Halo {{nama_munfiq}}, nomor identitas kamu {{nomor_identitas}} dan jumlah infaq kamu sebesar 200000202.'
        await Promise.all(
          await value.map(async (e) => {
            if (data[e.member_id] == undefined) {
              data = {
                ...data,
                ...{
                  [e.member_id]: {
                    nama_munfiq: e.Member.fullname,
                    nomor_identitas: e.Member.nomor_ktp,
                    whatsapp_number: e.Member.whatsapp_number,
                    jumlah_infaq: e.nominal + e.kode,
                  },
                },
              };
            } else {
              data[e.member_id].jumlah_infaq =
                data[e.member_id].jumlah_infaq + e.nominal + e.kode;
            }
          })
        );
      });
      var feedBack = [];
      for (let x in data) {
        feedBack.push({
          nama_munfiq: data[x].nama_munfiq,
          nomor_identitas: data[x].nomor_identitas,
          whatsapp_number: data[x].whatsapp_number,
          jumlah_infaq: await convertToRP(data[x].jumlah_infaq),
        });
      }
      return feedBack;
    } catch (error) {
      return [];
    }
  }

  async get_info_muzakki() {
    try {
      var data = {};
      await Riwayat_pengumpulan.findAll({
        where: {
          tipe: {
            [Op.ne]: "infaq",
          },
        },
        include: {
          required: true,
          model: Member,
        },
      }).then(async (value) => {
        await Promise.all(
          await value.map(async (e) => {
            if (data[e.member_id] == undefined) {
              data = {
                ...data,
                ...{
                  [e.member_id]: {
                    nama_muzakki: e.Member.fullname,
                    nomor_identitas: e.Member.nomor_ktp,
                    whatsapp_number: e.Member.whatsapp_number,
                    jumlah_zakat: e.nominal + e.kode,
                  },
                },
              };
            } else {
              data[e.member_id].jumlah_zakat =
                data[e.member_id].jumlah_zakat + e.nominal + e.kode;
            }
          })
        );
      });
      var feedBack = [];
      for (let x in data) {
        feedBack.push({
          nama_muzakki: data[x].nama_muzakki,
          nomor_identitas: data[x].nomor_identitas,
          whatsapp_number: data[x].whatsapp_number,
          jumlah_zakat: await convertToRP(data[x].jumlah_zakat),
        });
      }
      return feedBack;
    } catch (error) {
      return [];
    }
  }

  // ambil data untuk Jenis pesan, status dan tanggal pengiriman
  async list() {
    const body = this.req.body;
    const limit = parseInt(body.perpage, 10) || 10;
    const page =
      body.pageNumber && body.pageNumber !== "0"
        ? parseInt(body.pageNumber, 10)
        : 1;
    const where = body.search
      ? {
          [Op.or]: [
            { sender_number: { [Op.like]: `%${body.search}%` } },
            { destination_number: { [Op.like]: `%${body.search}%` } },
          ],
        }
      : {};

    try {
      // ambil info pesan whatsapp
      const whatsapp_message = await Whatsapp_message.findAndCountAll({
        limit,
        offset: (page - 1) * limit,
        order: [["id", "ASC"]],
        attributes: [
          "id",
          "sender_number",
          "destination_number",
          "message",
          "updatedAt",
          "status",
          "type",
        ],
        where,
      });

      return {
        data: whatsapp_message.rows.map((e) => ({
          id: e.id,
          sender_number: e.sender_number,
          destination_number: e.destination_number,
          message: e.message,
          status: e.status,
          type: e.type,
          updatedAt: moment(e.updatedAt).format("YYYY-MM-DD HH:mm:ss"),
        })),
        total: whatsapp_message.count,
      };
    } catch (error) {
      console.error("Error fetching Whatsapp_message data:", error);
      return { data: [], total: 0 };
    }
  }
}

module.exports = Model_r;
