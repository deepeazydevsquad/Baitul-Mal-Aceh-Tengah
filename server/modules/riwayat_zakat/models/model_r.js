const {
  Op,
  Riwayat_pengumpulan,
  Member,
  Setting,
  Kecamatan,
  Desa,
  Wakalah,
} = require("../../../models");
const moment = require("moment");
const { get_info_lokasi } = require("../../../helper/locationHelper");

class Model_r {
  constructor(req) {
    this.req = req;
  }

  async list_desa() {
    const result = await Desa.findAndCountAll({
      where: { kecamatan_id: this.req.body.kecamatan_id },
    });

    const data = result.rows.map((e) => ({
      id: e.id,
      name: e.name,
    }));

    return data;
  }

  async list_kecamatan() {
    const result = await Kecamatan.findAndCountAll();

    const data = result.rows.map((e) => ({
      id: e.id,
      name: e.name,
    }));

    return data;
  }

  async list_wakalah() {
    const result = await Wakalah.findAndCountAll({
      where: { desa_id: this.req.body.desa_id },
    });

    const data = result.rows.map((e) => ({
      id: e.id,
      name: e.fullname,
    }));

    return { data };
  }

  async list_member() {
    const result = await Member.findAndCountAll({
      where: { desa_id: this.req.body.desa_id },
    });

    const data = result.rows.map((e) => ({
      id: e.id,
      name: e.fullname,
    }));

    return { data, total: result.count };
  }

  async list_riwayat_zakat() {
    const body = this.req.body;
    const limit = parseInt(body.perpage, 10) || 10;
    const page =
      body.pageNumber && body.pageNumber !== "0"
        ? parseInt(body.pageNumber, 10)
        : 1;

    let where = {
      tipe: { [Op.not]: "infaq" }, // ❌ exclude infaq
    };

    // filter status
    if (body.status && body.status !== "") {
      where.status = body.status;
    }

    // filter tipe pembayaran
    if (body.tipe_pembayaran && body.tipe_pembayaran !== "") {
      where.tipe_pembayaran = body.tipe_pembayaran;
    }

    // filter konfirmasi
    if (body.konfirmasi_pembayaran && body.konfirmasi_pembayaran !== "") {
      where.konfirmasi_pembayaran = body.konfirmasi_pembayaran;
    }

    // filter search (di relasi Member)
    let memberWhere = {};
    if (body.search && body.search !== "") {
      memberWhere = {
        [Op.or]: [
          { fullname: { [Op.like]: `%${body.search}%` } },
          { nomor_ktp: { [Op.like]: `%${body.search}%` } }, // ✅ typo diperbaiki
          { kode: { [Op.like]: `%${body.search}%` } },
        ],
      };
    }

    const sql = {
      limit,
      offset: (page - 1) * limit,
      order: [["id", "DESC"]],
      attributes: [
        "id",
        "invoice",
        "status",
        "alasan_penolakan",
        "nominal",
        "kode",
        "konfirmasi_pembayaran",
        "tipe",
        "tipe_pembayaran",
        "nominal_transfer",
        "bukti_transfer",
        "nominal_setoran",
        "bukti_setoran",
        "posisi_uang",
        "nama_petugas",
        "jabatan_petugas",
        "createdAt",
        "updatedAt",
      ],
      include: [
        {
          model: Member,
          attributes: ["id", "fullname", "nomor_ktp"],
          where: memberWhere,
        },
      ],
      where,
    };

    try {
      const q = await Riwayat_pengumpulan.findAndCountAll(sql);
      const total = q.count;

      const list = q.rows.map((item) => {
        const row = item.toJSON();
        return {
          id: row.id,
          invoice: row.invoice,
          status: row.status,
          alasan_penolakan: row.alasan_penolakan,
          nominal: row.nominal,
          kode: row.kode,
          konfirmasi_pembayaran: row.konfirmasi_pembayaran,
          tipe: row.tipe,
          tipe_pembayaran: row.tipe_pembayaran,
          nominal_transfer: row.nominal_transfer,
          bukti_transfer: row.bukti_transfer,
          nominal_setoran: row.nominal_setoran,
          bukti_setoran: row.bukti_setoran,
          posisi_uang: row.posisi_uang,
          nama_petugas: row.nama_petugas,
          jabatan_petugas: row.jabatan_petugas,
          datetimes: moment(row.updatedAt).format("YYYY-MM-DD HH:mm:ss"),
          member_id: row.Member?.id,
          member_name: row.Member?.fullname,
          member_nik: row.Member?.nomor_ktp,
        };
      });

      let total_saldo_dikantor = 0;
      let pembayaran_online_dikirim = 0;
      await Riwayat_pengumpulan.findAll({
        where: {
          tipe: { [Op.ne]: "infaq" },
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
          }),
        );
      });

      return {
        data: {
          list: list,
          total_saldo_dikantor: total_saldo_dikantor,
          pembayaran_online_dikirim: pembayaran_online_dikirim,
        },
        total,
      };
    } catch (error) {
      console.error("ERROR in daftar riwayat zakat:", error);
      return {
        data: {
          list: [],
          total_saldo_dikantor: 0,
          pembayaran_online_dikirim: 0,
        },
        total: 0,
      };
    }
  }

  async info_bukti_setoran() {
    const body = this.req.body;

    try {
      const [buktiData, settings] = await Promise.all([
        Riwayat_pengumpulan.findByPk(body.id, {
          attributes: [
            "wakalah_id",
            "invoice",
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
            {
              model: Wakalah,
              attributes: ["fullname", "jabatan"],
              required: false,
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
        settings.map((s) => [s.name, s.value]),
      );

      return {
        waktu: {
          tanggal: moment().format("DD"),
          bulan_str: moment().format("MMMM"),
          bulan_num: moment().format("M"),
          tahun_lng: moment().format("YYYY"),
          tahun_shrt: moment().format("YY"),
        },
        invoice: buktiData.invoice,
        member_fullname: buktiData.Member.fullname,
        alamat: buktiData.Member.alamat,
        whatsapp_number: buktiData.Member.whatsapp_number,
        wakalah: buktiData.Wakalah?.fullname,
        jabatan_wakalah: buktiData.Wakalah?.jabatan,
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

  async info_riwayat_zakat(id) {
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
      console.error("Error fetching riwayat zakat data:", error);
      return {};
    }
  }

  async gen_invoice() {
    let invoice;
    let exists = true;

    do {
      // 4 huruf random (A-Z)
      const letters = Array.from({ length: 4 }, () =>
        String.fromCharCode(65 + Math.floor(Math.random() * 26)),
      ).join("");

      // 6 angka random
      const numbers = Math.floor(100000 + Math.random() * 900000);

      invoice = `${letters}${numbers}`;

      exists = await Riwayat_pengumpulan.findOne({ where: { invoice } });
    } while (exists);

    return invoice;
  }
}

module.exports = Model_r;
