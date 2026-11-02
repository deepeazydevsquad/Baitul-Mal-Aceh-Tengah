const {
  Op,
  sequelize,
  Validasi_syarat_permohonan,
  Realisasi_permohonan,
  Permohonan,
  Member,
  Kegiatan,
  Kriteria,
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

  async permohonan_bantuan() {
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
    if (body.type_kegiatan) {
      typeFilterKegiatan.id = body.type_kegiatan;
    }
    if (body.type_status_kegiatan) {
      typeFilterKegiatan.status_kegiatan = body.type_status_kegiatan;
    }

    try {
      const currentYear = moment().year();
      const currentMonth = moment().month() + 1; // 1-12

      // STEP 1: Query utama
      let result = await Realisasi_permohonan.findAll({
        order: [["id", "DESC"]],
        attributes: [
          "id",
          "status_realisasi",
          "status",
          "biaya_disetujui",
          "nominal_realisasi",
          "bulan",
        ],
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
      const [kriteria, desa, sisaDanaList] = await Promise.all([
        Kriteria.findAll({
          where: { kegiatan_id: kegiatanIds },
          attributes: ["id", "kegiatan_id", "name"],
          raw: true,
        }),
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

      const kriteriaByKegiatan = kriteria.reduce((acc, k) => {
        if (!acc[k.kegiatan_id]) acc[k.kegiatan_id] = [];
        acc[k.kegiatan_id].push({ id: k.id, name: k.name });
        return acc;
      }, {});

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
        const sisa_jumlah_dana = sisaDanaMap[kegiatanId] || 0;

        return {
          id: r.id,
          bulan: r.bulan,
          status: r.status,
          biaya_disetujui: r.biaya_disetujui,
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
              sisa_jumlah_dana,
              jumlah_dana: r.Permohonan?.Kegiatan?.jumlah_dana,
              sumber_dana: r.Permohonan?.Kegiatan?.sumber_dana,
              area_penyaluran: r.Permohonan?.Kegiatan?.area_penyaluran,
              status_kegiatan: r.Permohonan?.Kegiatan?.status_kegiatan,
              tahun: r.Permohonan?.Kegiatan?.tahun,
              kriteria: kriteriaByKegiatan[kegiatanId] || [],
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

  async list_kegiatan() {
    try {
      // STEP 1: Ambil semua kegiatan tahun ini yg sedang berlangsung
      const allKegiatan = await Permohonan.findAll({
        attributes: ["kegiatan_id"],
        include: [
          {
            model: Kegiatan,
            attributes: [
              "id",
              "nama_kegiatan",
              "tahun",
              "area_penyaluran",
              "status_kegiatan",
            ],
            where: {
              tahun: moment().format("YYYY"),
              status_kegiatan: "sedang_berlangsung",
            },
            required: true,
          },
        ],
      });

      // STEP 2: Helper buat filter kuota
      async function filterKuota(modelArea, kegiatanId) {
        // total kapasitas kuota
        const total = await modelArea.findOne({
          attributes: [
            [sequelize.fn("SUM", sequelize.col("kuota")), "total_kuota"],
          ],
          where: { kegiatan_id: kegiatanId },
          raw: true,
        });

        const totalKuota = Number(total?.total_kuota || 0);

        // total terpakai (permohonan yg sudah direalisasi)
        const used = await Realisasi_permohonan.count({
          where: {
            status_realisasi: "sudah_direalisasi", // field yg menandakan udah kepake
          },
          include: [
            {
              model: Permohonan,
              where: { kegiatan_id: kegiatanId },
              required: true,
              attributes: [], // agar tidak mengambil data redundant
            },
          ],
        });

        return totalKuota - used > 0;
      }

      // STEP 3: Filter kegiatan paralel
      const results = await Promise.all(
        allKegiatan.map(async (p) => {
          const kegiatan = p.Kegiatan;
          const area = kegiatan.area_penyaluran;

          if (area === "desa") {
            const ok = await filterKuota(Desa_area_kegiatan, kegiatan.id);
            return ok ? kegiatan.id : null;
          } else if (area === "kecamatan") {
            const ok = await filterKuota(Kecamatan_area_kegiatan, kegiatan.id);
            return ok ? kegiatan.id : null;
          } else {
            return kegiatan.id;
          }
        })
      );

      let finalIds = results.filter(Boolean);
      finalIds = [...new Set(finalIds)];

      if (!finalIds.length) {
        return { data: [], total: 0 };
      }

      // STEP 4: Ambil detail kegiatan final
      const kegiatan = await Kegiatan.findAndCountAll({
        attributes: ["id", "nama_kegiatan", "tahun", "area_penyaluran"],
        order: [["nama_kegiatan", "ASC"]],
        where: { id: finalIds },
      });

      return {
        data: kegiatan.rows.map((e) => ({
          id: e.id,
          name: `(${e.tahun}) ${e.nama_kegiatan}`,
        })),
        total: kegiatan.count,
      };
    } catch (error) {
      console.error("Error fetching info for kegiatan:", error);
      return { data: [], total: 0 };
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

  async list_member() {
    try {
      const permohonan = await Realisasi_permohonan.findAll({
        attributes: [],
        where: {
          status_realisasi: "belum_direalisasi",
        },
        include: [
          {
            model: Permohonan,
            attributes: ["member_id"],
            required: true,
          },
        ],
      });
      const memberIds = permohonan
        .map((r) => r.Permohonan.member_id)
        .filter(Boolean); // untuk exclude member yang sudah ada permohonan di tahun yang sama
      const members = await Member.findAndCountAll({
        attributes: ["id", "fullname", "tipe"],
        order: [["fullname", "ASC"]],
        where: {
          id: { [Op.notIn]: memberIds },
          tipe: "perorangan",
        },
      });

      return {
        data: members.rows.map((e) => ({ id: e.id, name: e.fullname })),
        total: members.count,
      };
    } catch (error) {
      console.error("Error fetching info for member:", error);
      return { data: [], total: 0 };
    }
  }

  async list_kriteria_syarat() {
    const body = this.req.body;

    try {
      const [kriteria, syarat] = await Promise.all([
        Kriteria.findAndCountAll({
          attributes: ["id", "name"],
          where: { kegiatan_id: body.kegiatan_id },
          order: [["name", "ASC"]],
        }),
        Syarat_kegiatan.findAndCountAll({
          attributes: ["id"],
          where: { kegiatan_id: body.kegiatan_id },
          include: [{ model: Syarat, attributes: ["name", "path"] }],
          order: [[Syarat, "name", "ASC"]],
          raw: true,
          nest: true,
        }),
      ]);

      return {
        data: {
          kriteria: kriteria.rows.map((e) => ({ id: e.id, name: e.name })),
          syarat: syarat.rows.map((e) => ({
            id: e.id,
            name: e.Syarat.name,
            path: e.Syarat.path,
          })),
        },
      };
    } catch (error) {
      console.error("Error fetching info for syarat:", error);
      return { data: [], total: 0 };
    }
  }

  async get_info_edit() {
    const body = this.req.body;
    try {
      const realisasi = await Realisasi_permohonan.findByPk(body.id, {
        attributes: ["id", "permohonan_id"],
      });
      const permohonan = await this.info_permohonan(realisasi.permohonan_id);
      const member = await this.info_member(permohonan.member_id);

      // --- Ambil syarat
      const syaratData = await Syarat_kegiatan.findAll({
        attributes: ["id", "kegiatan_id"],
        where: { kegiatan_id: permohonan.kegiatan_id },
        include: [{ model: Syarat, attributes: ["id", "name", "path"] }],
        order: [[Syarat, "name", "ASC"]],
        raw: true,
        nest: true,
      });

      // --- Ambil validasi
      const validasiData = await Validasi_syarat_permohonan.findAll({
        attributes: ["id", "file_name", "path"],
        where: { realisasi_permohonan_id: body.id },
        raw: true,
        nest: true,
      });

      // --- Index validasi by file_name (path)
      const validasiByPath = {};
      validasiData.forEach((v) => {
        validasiByPath[v.file_name] = {
          id: v.id,
          path: v.path,
        };
      });

      console.log("===========================");
      console.log(syaratData);
      console.log(validasiByPath);
      console.log("===========================");

      // --- Gabung syarat + validasi
      const syarat = syaratData.map((e) => {
        const v = validasiByPath[e.Syarat.path] || {}; // ambil validasi kalau ada
        return {
          id: v.id || null,
          name: e.Syarat.name,
          path: e.Syarat.path,
          file_path: v.path || null,
        };
      });

      return { permohonan, member, syarat };
    } catch (error) {
      console.error("Error fetching info for permohonan:", error);
      return null;
    }
  }

  async get_info_persetujuan() {
    const body = this.req.body;

    try {
      const permohonan = await this.info_permohonan(body.id);
      const kegiatan = await this.info_kegiatan(permohonan.kegiatan_id);
      const sisa_dana = await this.sisa_dana(permohonan.kegiatan_id);

      let data = {
        jumlah_maksimal_nominal_bantuan:
          kegiatan.jumlah_maksimal_nominal_bantuan,
        sisa_dana,
      };

      return data;
    } catch (error) {
      console.error("Error fetching info for permohonan:", error);
      return null;
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
