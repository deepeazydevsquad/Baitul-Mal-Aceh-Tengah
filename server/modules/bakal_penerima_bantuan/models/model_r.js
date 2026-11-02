const {
  Op,
  sequelize,
  Validasi_syarat_permohonan,
  Realisasi_permohonan,
  Permohonan,
  Member,
  Kegiatan,
  Syarat_kegiatan,
  Syarat,
  Bank,
  Desa_area_kegiatan,
  Kecamatan_area_kegiatan,
} = require("../../../models");
const { get_info_lokasi_list } = require("../../../helper/locationHelper");
const moment = require("moment");

class Model_r {
  constructor(req) {
    this.req = req;
  }

  async initialize() {
    //
  }

  async sisa_dana(id) {
    try {
      const [dataKegiatan, dataPermohonan] = await Promise.all([
        Kegiatan.findOne({
          where: { id },
          attributes: ["jumlah_dana"],
          raw: true,
        }),
        Realisasi_permohonan.findOne({
          raw: true,
          attributes: [
            [
              sequelize.fn(
                "COALESCE",
                sequelize.fn("SUM", sequelize.col("nominal_realisasi")),
                0
              ),
              "total",
            ],
          ],
          include: [
            {
              model: Permohonan,
              where: { kegiatan_id: id },
              required: true,
              attributes: [],
            },
          ],
        }),
      ]);
      const totalRealisasi = parseInt(dataPermohonan.total, 10) || 0;
      return dataKegiatan.jumlah_dana - totalRealisasi;
    } catch (error) {
      console.error("Error sisa_dana:", error);
      return null;
    }
  }

  async get_filter_type() {
    try {
      const data = await Kegiatan.findAndCountAll({
        attributes: ["id", "nama_kegiatan", "tahun"],
        raw: true,
        where: {
          tahun: {
            [Op.gte]: new Date().getFullYear() - 4,
          },
        },
        order: [["tahun", "DESC"]],
      });
      return {
        data: data.rows.map((e) => ({
          value: e.id,
          label: `[${e.tahun}] ${e.nama_kegiatan}`,
        })),
        total: data.total,
      };
    } catch (error) {
      console.error("Error get_filter_type:", error);
      return null;
    }
  }

  async bakal_penerima_bantuan() {
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
          ],
        }
      : {};

    const typeFilterKegiatan = {};
    const typeFilterRealisasi = {};
    if (body.type_kegiatan) {
      typeFilterKegiatan.id = body.type_kegiatan;
    }
    if (body.type_status_kegiatan) {
      typeFilterKegiatan.status_kegiatan = body.type_status_kegiatan;
    }
    if (body.type_status_realisasi) {
      typeFilterRealisasi.status_realisasi = body.type_status_realisasi;
    }

    try {
      const currentYear = moment().year();
      const currentMonth = moment().month() + 1; // 1-12

      // STEP 1: Query utama
      let result = await Realisasi_permohonan.findAll({
        order: [["id", "ASC"]],
        attributes: [
          "id",
          "status_realisasi",
          "status",
          "biaya_disetujui",
          "nominal_realisasi",
          "tipe",
          "tanggal_realisasi",
          "bukti_transfer",
          "berita_acara",
          "mou",
          "bulan",
        ],
        where: { ...typeFilterRealisasi, status: "approve" },
        include: [
          {
            model: Permohonan,
            required: true,
            attributes: ["id", "nomor_akun_bank", "nama_akun_bank", "status"],
            include: [
              { model: Bank, attributes: ["name"], required: true },
              {
                model: Member,
                attributes: ["fullname", "tipe", "desa_id"],
                where,
                required: true,
              },
              {
                model: Kegiatan,
                attributes: [
                  "id",
                  "nama_kegiatan",
                  "jumlah_dana",
                  "sumber_dana",
                  "area_penyaluran",
                  "status_kegiatan",
                  "tahun",
                ],
                where: typeFilterKegiatan,
                required: true,
              },
            ],
          },
        ],
        raw: true,
        nest: true,
      });

      // STEP 2: Filter dan group berdasarkan logika bulan
      const grouped = {};

      for (const r of result) {
        const kegiatanId = r.Permohonan?.Kegiatan?.id;
        const tahunKegiatan = r.Permohonan?.Kegiatan?.tahun;

        if (!kegiatanId) continue;

        // Buat unique key: kegiatan_id + member_id (untuk handle multi member dalam 1 kegiatan)
        const memberId = r.Permohonan?.Member?.id;
        const groupKey = `${kegiatanId}_${memberId}`;

        if (!grouped[groupKey]) {
          grouped[groupKey] = {
            tahunKegiatan,
            rows: [],
          };
        }
        grouped[groupKey].rows.push(r);
      }

      // STEP 3: Pilih data yang tepat berdasarkan bulan dan tahun
      let filtered = [];

      Object.values(grouped).forEach(({ tahunKegiatan, rows }) => {
        // Cek apakah ada data bulanan
        const hasBulanan = rows.some((r) => r.bulan !== null);

        if (!hasBulanan) {
          // Jika tahunan (bulan = null), ambil saja
          filtered.push(rows[0]);
        } else {
          // Jika bulanan
          const rowsBulanan = rows.filter((r) => r.bulan !== null);

          if (currentYear === tahunKegiatan) {
            // Tahun sama: tampilkan data bulan sekarang
            const currentMonthRow = rowsBulanan.find(
              (r) => r.bulan === currentMonth
            );

            if (currentMonthRow) {
              filtered.push(currentMonthRow);
            } else {
              // Jika bulan sekarang belum ada, ambil bulan terakhir yang ada
              const sortedRows = rowsBulanan.sort((a, b) => b.bulan - a.bulan);
              const lastAvailableRow = sortedRows.find(
                (r) => r.bulan <= currentMonth
              );
              filtered.push(
                lastAvailableRow || sortedRows[sortedRows.length - 1]
              );
            }
          } else if (currentYear > tahunKegiatan) {
            // Tahun sudah lewat: tampilkan bulan 12 saja
            const bulan12Row = rowsBulanan.find((r) => r.bulan === 12);
            filtered.push(bulan12Row || rowsBulanan[rowsBulanan.length - 1]);
          } else {
            // Tahun belum sampai: ambil data pertama
            const sortedRows = rowsBulanan.sort((a, b) => a.bulan - b.bulan);
            filtered.push(sortedRows[0]);
          }
        }
      });

      // STEP 4: Apply pagination setelah filtering
      const total = filtered.length;
      const paginatedResult = filtered.slice((page - 1) * limit, page * limit);

      // STEP 5: Kumpulin IDs dari data yang sudah di-paginate
      const kegiatanIds = [
        ...new Set(
          paginatedResult.map((r) => r.Permohonan?.Kegiatan?.id).filter(Boolean)
        ),
      ];

      const desaIds = [
        ...new Set(
          paginatedResult
            .map((r) => r.Permohonan?.Member?.desa_id)
            .filter(Boolean)
        ),
      ];

      // STEP 6: Query tambahan (parallel)
      const [desa, sisaDanaList] = await Promise.all([
        get_info_lokasi_list(desaIds),
        Promise.all(
          kegiatanIds.map(async (id) => ({
            id,
            sisa: await this.sisa_dana(id),
          }))
        ),
      ]);

      // STEP 7: Mapping helper
      const sisaDanaMap = Object.fromEntries(
        sisaDanaList.map((d) => [d.id, d.sisa])
      );

      const desaById = desa.reduce((acc, d) => {
        acc[d.id] = {
          desa_name: d.desa_name,
          kecamatan_name: d.kecamatan_name,
        };
        return acc;
      }, {});

      // STEP 8: Gabungkan ke setiap row
      const finalData = paginatedResult.map((r) => {
        const kegiatanId = r.Permohonan?.Kegiatan?.id;
        const desaId = r.Permohonan?.Member?.desa_id;

        return {
          id: r.id, // id realisasi
          bulan: r.bulan,
          status: r.status,
          status_realisasi: r.status_realisasi,
          tipe: r.tipe,
          bukti_transfer: r.bukti_transfer,
          mou: r.mou,
          berita_acara: r.berita_acara,
          tanggal_realisasi: r.tanggal_realisasi
            ? moment(r.tanggal_realisasi).format("YYYY-MM-DD")
            : null,
          biaya_disetujui: r.biaya_disetujui,
          nominal_realisasi: r.nominal_realisasi,
          Permohonan: {
            id: r.Permohonan?.id,
            bank_name: r.Permohonan?.Bank?.name,
            nomor_akun_bank: r.Permohonan?.nomor_akun_bank,
            nama_akun_bank: r.Permohonan?.nama_akun_bank,
            status: r.Permohonan?.status,
            member_name: r.Permohonan?.Member?.fullname,
            member_tipe: r.Permohonan?.Member?.tipe,
            desa_name: desaById[desaId]?.desa_name || null,
            kecamatan_name: desaById[desaId]?.kecamatan_name || null,
            Kegiatan: {
              id: r.Permohonan?.Kegiatan?.id,
              nama_kegiatan: r.Permohonan?.Kegiatan?.nama_kegiatan,
              jumlah_dana: r.Permohonan?.Kegiatan?.jumlah_dana,
              sumber_dana: r.Permohonan?.Kegiatan?.sumber_dana,
              sisa_dana: sisaDanaMap[kegiatanId],
              area_penyaluran: r.Permohonan?.Kegiatan?.area_penyaluran,
              status_kegiatan: r.Permohonan?.Kegiatan?.status_kegiatan,
              tahun: r.Permohonan?.Kegiatan?.tahun,
            },
          },
        };
      });

      return {
        data: finalData,
        total,
      };
    } catch (error) {
      console.error("Error fetching data:", error);
      return { data: [], total: 0 };
    }
  }

  async get_info_permohonan() {
    const body = this.req.body;

    try {
      const dataRealisasi = await Realisasi_permohonan.findOne({
        where: { id: body.id, status_realisasi: "belum_direalisasi" },
        attributes: ["id", "biaya_disetujui"],
        raw: true,
        nest: true,
        include: [
          {
            model: Permohonan,
            required: true,
            include: [
              {
                model: Member,
                attributes: ["id", "fullname"],
                required: true,
              },
              {
                model: Kegiatan,
                attributes: ["id", "nama_kegiatan"],
                required: true,
              },
            ],
          },
        ],
      });

      return {
        id: dataRealisasi.id,
        kegiatan_id: dataRealisasi.Permohonan.kegiatan_id,
        biaya_disetujui: dataRealisasi.biaya_disetujui,
        member_name: dataRealisasi.Permohonan.Member.fullname,
        kegiatan_name: dataRealisasi.Permohonan.Kegiatan.nama_kegiatan,
      };
    } catch (error) {}
  }

  async get_info_upload_berita_acara() {
    const body = this.req.body;

    try {
      const dataRealisasi = await Realisasi_permohonan.findOne({
        where: { id: body.id, status_realisasi: "sudah_direalisasi" },
        attributes: ["id"],
        raw: true,
        nest: true,
        include: [
          {
            model: Permohonan,
            required: true,
            include: [
              {
                model: Member,
                attributes: ["id", "fullname"],
                required: true,
              },
              {
                model: Kegiatan,
                attributes: ["id", "nama_kegiatan"],
                required: true,
              },
            ],
          },
        ],
      });


      return {
        id: dataRealisasi.id,
        kegiatan_id: dataRealisasi.Permohonan.kegiatan_id,
        member_name: dataRealisasi.Permohonan.Member.fullname,
        kegiatan_name: dataRealisasi.Permohonan.Kegiatan.nama_kegiatan,
      };
    } catch (error) {
      console.error("Error fetching data:", error);
      return null;
    }
  }

  async list_belum_upload_berita_acara() {
    const body = this.req.body;

    try {
      const whereKegiatan = {};
      if (body.kegiatan_id) {
        whereKegiatan.id = body.kegiatan_id;
      } else {
        whereKegiatan.tahun = moment().year();
        whereKegiatan.status_kegiatan = "sedang_berlangsung";
      }

      // Query: ambil realisasi yang sudah approve tapi belum upload berita acara
      const result = await Realisasi_permohonan.findAll({
        where: {
          status: "approve",
          status_realisasi: "sudah_direalisasi",
          berita_acara: null,
          [Op.or]: [
            { bukti_transfer: { [Op.not]: null } },
            { mou: { [Op.not]: null } },
          ],
        },
        attributes: ["id", "biaya_disetujui", "bulan"],
        include: [
          {
            model: Permohonan,
            required: true,
            attributes: ["id"],
            include: [
              {
                model: Member,
                required: true,
                attributes: ["id", "fullname", "nomor_ktp"],
              },
              {
                model: Kegiatan,
                required: true,
                where: whereKegiatan,
                attributes: ["id", "nama_kegiatan", "tahun"],
              },
            ],
          },
        ],
        order: [["id", "ASC"]],
        raw: true,
        nest: true,
      });

      // Format data untuk frontend
      const data = result.map((r) => ({
        id: r.id,
        nama_pemohon: r.Permohonan?.Member?.fullname || "-",
        nomor_ktp: r.Permohonan?.Member?.nomor_ktp || "-",
        nominal_bantuan: r.biaya_disetujui || 0,
        nama_kegiatan: r.Permohonan?.Kegiatan?.nama_kegiatan || "-",
        tahun: r.Permohonan?.Kegiatan?.tahun || moment().year(),
        bulan: r.bulan,
      }));

      return {
        data,
        total: data.length,
      };
    } catch (error) {
      console.error("Error list belum upload berita acara:", error);
      return { data: [], total: 0 };
    }
  }

  async info_realisasi(realisasi_id) {
    try {
      const realisasi = await Realisasi_permohonan.findOne({
        order: [["id", "ASC"]],
        where: { id: realisasi_id },
        raw: true,
        nest: true,
      });
      return realisasi;
    } catch (error) {
      console.error("Error fetching info for permohonan:", error);
      return null;
    }
  }

  async info_permohonan(permohonan_id) {
    try {
      const permohonan = await Permohonan.findOne({
        where: { id: permohonan_id },
        raw: true,
        nest: true,
        attributes: [
          "id",
          "member_id",
          "kegiatan_id",
          "bank_id",
          "nomor_akun_bank",
          "nama_akun_bank",
          "status",
          "alasan_penolakan",
        ],
      });
      return permohonan;
    } catch (error) {
      console.error("Error fetching info for permohonan:", error);
      return null;
    }
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

  async info_member(member_id) {
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
}

module.exports = Model_r;
