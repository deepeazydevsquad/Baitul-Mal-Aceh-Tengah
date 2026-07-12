const { Op, Riwayat_pengumpulan, Member, Setting, Wakalah } = require("../../../models");
const moment = require("moment");
const { get_info_lokasi } = require("../../../helper/locationHelper");

class Model_r {
  constructor(req) {
    this.req = req;
  }

  async initialize() {
    //
  }

  async gen_invoie() {
    let invoice;
    let exists = true;

    do {
      // 4 huruf random (A-Z)
      const letters = Array.from({ length: 4 }, () =>
        String.fromCharCode(65 + Math.floor(Math.random() * 26))
      ).join("");

      // 6 angka random
      const numbers = Math.floor(100000 + Math.random() * 900000);

      invoice = `${letters}${numbers}`;

      exists = await Riwayat_pengumpulan.findOne({ where: { invoice } });
    } while (exists);

    return invoice;
  }

  async member() {
    const result = await Member.findAndCountAll();

    const data = result.rows.map((e) => ({
      id: e.id,
      name: e.fullname,
    }));

    return { data, total: result.count };
  }

  async riwayat_infaq() {
    const body = this.req.body;
    const limit = parseInt(body.perpage, 10) || 10;
    const page =
      body.pageNumber && body.pageNumber !== "0"
        ? parseInt(body.pageNumber, 10)
        : 1;

    const where = body.search
      ? {
          [Op.or]: [
            { fullname: { [Op.like]: `%${body.search}%` } },
            { nomor_ktp: { [Op.like]: `%${body.search}%` } },
            { kode: { [Op.like]: `%${body.search}%` } },
          ],
        }
      : {};

    const typeFilter = {};
    if (body.status) {
      typeFilter.status = body.status;
    }

    // filter tipe pembayaran
    if (body.tipe_pembayaran && body.tipe_pembayaran !== "") {
      typeFilter.tipe_pembayaran = body.tipe_pembayaran;
    }

    if (body.konfirmasi_pembayaran) {
      typeFilter.konfirmasi_pembayaran = body.konfirmasi_pembayaran;
    }

    try {
      const result = await Riwayat_pengumpulan.findAndCountAll({
        limit,
        offset: (page - 1) * limit,
        order: [["id", "DESC"]],
        attributes: [
          "id",
          "member_id",
          "invoice",
          "tipe",
          "alasan_penolakan",
          "tipe_pembayaran",
          "nominal_transfer",
          "bukti_transfer",
          "nominal_setoran",
          "bukti_setoran",
          "posisi_uang",
          "nama_petugas",
          "jabatan_petugas",
          "nominal",
          "kode",
          "status",
          "konfirmasi_pembayaran",
          "updatedAt",
        ],
        where: { ...typeFilter, tipe: "infaq" },
        include: [
          {
            model: Member,
            attributes: ["fullname", "nomor_ktp", "kode"],
            where: where,
            required: true,
          },
          {
            model: Wakalah,
            attributes: ["id", "nama", "nik"],
            required: false,
          }
        ],
      });

      let total_saldo_dikantor = 0;
      let pembayaran_online_dikirim = 0;
      await Riwayat_pengumpulan.findAll({
        where: {
          tipe: "infaq",
        },
      }).then(async (value) => {
        await Promise.all(
          await value.map(async (e) => {
            if (e.posisi_uang === "kantor_baitulmal") {
              total_saldo_dikantor =
                total_saldo_dikantor + (parseInt(e.nominal) + parseInt(e.kode));
            }
            if (
              e.status === "process" &&
              e.tipe_pembayaran === "online" &&
              e.konfirmasi_pembayaran === "sudah_dikirim"
            ) {
              pembayaran_online_dikirim = pembayaran_online_dikirim + 1;
            }
          })
        );
      });

      return {
        data: {
          list: result.rows.map((e) => ({
            id: e.id,
            member_id: e.member_id,
            member_name: e.Member?.fullname,
            member_nik: e.Member?.nomor_ktp,
            wakalah_id: e.Wakalah?.id || null,
            wakalah_nama: e.Wakalah?.nama || null,
            wakalah_nik: e.Wakalah?.nik || null,
            invoice: e.invoice,
            tipe: e.tipe,
            nominal: e.nominal,
            kode: e.kode,
            status: e.status,
            alasan_penolakan: e.alasan_penolakan,
            konfirmasi_pembayaran: e.konfirmasi_pembayaran,
            tipe_pembayaran: e.tipe_pembayaran,
            nominal_transfer: e.nominal_transfer,
            bukti_transfer: e.bukti_transfer,
            nominal_setoran: e.nominal_setoran,
            bukti_setoran: e.bukti_setoran,
            posisi_uang: e.posisi_uang,
            nama_petugas: e.nama_petugas,
            jabatan_petugas: e.jabatan_petugas,

            datetimes: moment(e.updatedAt).format("YYYY-MM-DD HH:mm:ss"),
          })),
          total_saldo_dikantor: total_saldo_dikantor,
          pembayaran_online_dikirim: pembayaran_online_dikirim,
        },
        total: result.count,
      };
    } catch (error) {
      console.error("Error fetching riwayat data infaq:", error);
      return { data: [], total: 0 };
    }
  }

  async info_bukti_setoran() {
    const body = this.req.body;

    try {
      const [buktiData, settings] = await Promise.all([
        Riwayat_pengumpulan.findByPk(body.id, {
          attributes: [
            "kode",
            "nominal",
            "tipe",
            "nama_petugas",
            "jabatan_petugas",
          ],
          include: [
            {
              model: Member,
              attributes: ["fullname", "desa_id", "alamat", "whatsapp_number"],
              required: true,
            },
          ],
          raw: true,
          nest: true,
        }),
        Setting.findAll({
          where: {
            name: {
              [Op.in]: ["nama_kabupaten_kota", "alamat"],
            },
          },
          attributes: ["name", "value"],
          raw: true,
        }),
      ]);

      const settingMap = Object.fromEntries(
        settings.map((s) => [s.name, s.value])
      );

      return {
        waktu: {
          tanggal: moment().format("DD"),
          bulan_str: moment().format("MMMM"),
          bulan_num: moment().format("M"),
          tahun_lng: moment().format("YYYY"),
          tahun_shrt: moment().format("YY"),
        },
        member_fullname: buktiData.Member.fullname,
        alamat: buktiData.Member.alamat,
        whatsapp_number: buktiData.Member.whatsapp_number,
        bukti_setoran: buktiData.bukti_setoran,
        kode: String(buktiData.kode),
        tipe: buktiData.tipe,
        nominal: buktiData.nominal,
        nama_petugas: buktiData.nama_petugas,
        jabatan_petugas: buktiData.jabatan_petugas,
        lokasi: await get_info_lokasi(buktiData.Member.desa_id),
        lokasi_kantor: {
          nama_kabupaten_kota: settingMap.nama_kabupaten_kota,
          alamat: settingMap.alamat,
        },
      };
    } catch (error) {
      console.error("Error fetching riwayat zakat data:", error);
      return {};
    }
  }

  async info_riwayat_infaq(id) {
    try {
      const result = await Riwayat_pengumpulan.findByPk(id, {
        include: [
          {
            model: Member,
            attributes: ["fullname", "nomor_ktp", "kode"],
          },
        ],
      });
      return {
        id: result.id,
        invoice: result.invoice,
        tipe: result.tipe,
        nominal: result.nominal,
        kode: result.kode,
        status: result.status,
        konfirmasi_pembayaran: result.konfirmasi_pembayaran,
        tipe_pembayaran: result.tipe_pembayaran,
        bukti_transfer: result.bukti_transfer,
        bukti_setoran: result.bukti_setoran,
        member_id: result.member_id,
        member_name: result.Member?.fullname,
        member_nik: result.Member?.nomor_ktp,
        datetime: moment(result.updatedAt).format("YYYY-MM-DD HH:mm:ss"),
      };
    } catch (error) {
      console.error("Error fetching bank data:", error);
      return {};
    }
  }
}

module.exports = Model_r;
