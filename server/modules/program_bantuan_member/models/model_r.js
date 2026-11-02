const {
  Realisasi_permohonan,
  Permohonan,
  Kegiatan,
  Program,
  Sequelize,
  Op,
} = require("../../../models");
const moment = require("moment");

class Model_r {
  constructor(req) {
    this.req = req;
  }

  async getLaporan() {
    try {
      const { tahun } = this.req.body || {};
      const selectedYear = tahun || new Date().getFullYear();

      // === Ambil data semua program + kegiatan + permohonan + realisasi ===
      const programs = await Program.findAll({
        attributes: ["id", "name"],
        include: [
          {
            model: Kegiatan,
            attributes: ["id", "sumber_dana", "tahun", "jumlah_dana"],
            required: true,
            where: { tahun: selectedYear },
            include: [
              {
                model: Permohonan,
                attributes: ["id", "kegiatan_id", "createdAt"],
                include: [
                  {
                    model: Realisasi_permohonan,
                    attributes: ["biaya_disetujui", "status_realisasi"],
                  },
                ],
              },
            ],
          },
        ],
      });

      // === Olah data per program ===
      const laporan = programs.map((program) => {
        let totalDana = 0;
        let sudahRealisasi = 0;
        let totalPenerima = 0;

        program.Kegiatans.forEach((kegiatan) => {
          totalDana += kegiatan.jumlah_dana || 0;

          kegiatan.Permohonans.forEach((perm) => {
            let isSudahRealisasi = false;

            perm.Realisasi_permohonans.forEach((real) => {
              if (real.status_realisasi === "sudah_direalisasi") {
                sudahRealisasi += real.biaya_disetujui || 0;
                isSudahRealisasi = true;
              }
            });

            // Hitung orang terbantu (permohonan yg sudah direalisasi)
            if (isSudahRealisasi) totalPenerima += 1;
          });
        });

        const belumRealisasi = totalDana - sudahRealisasi;
        const persentase =
          totalDana > 0 ? ((sudahRealisasi / totalDana) * 100).toFixed(2) : 0;

        return {
          program: program.name,
          tahun: selectedYear,
          total_dana: totalDana,
          sudah_direalisasi: sudahRealisasi,
          belum_direalisasi: belumRealisasi,
          total_penerima: totalPenerima, // ✅ jumlah orang terbantu
          persentase_realisasi: parseFloat(persentase),
        };
      });

      // === Hitung total keseluruhan (buat summary kalau mau ditampilkan di frontend) ===
      const totalSemua = laporan.reduce(
        (acc, curr) => {
          acc.sudah_direalisasi += curr.sudah_direalisasi;

          acc.total_penerima += curr.total_penerima;
          return acc;
        },
        {
          total_dana: 0,
          sudah_direalisasi: 0,
          belum_direalisasi: 0,
          total_penerima: 0,
        }
      );

      return {
        tahun: selectedYear,
        total: totalSemua,
        data: laporan,
      };
    } catch (err) {
      console.error("❌ ERROR getLaporan:", err);
      return { error: true, message: err.message };
    }
  }

  async get_program_by_tipe() {
    const body = this.req.body;

    const limit = parseInt(body.perpage, 10) || 10;
    const page =
      body.pageNumber && body.pageNumber !== "0"
        ? parseInt(body.pageNumber, 10)
        : 1;

    const filterTanggal =
      body.type_date?.start && body.type_date?.end
        ? {
            [Op.and]: [
              // Cari kegiatan yang start_date-nya <= input end_date
              {
                start_date: {
                  [Op.lte]: moment(body.type_date.end).format("YYYY-MM-DD"),
                },
              },
              // Dan end_date-nya >= input start_date
              {
                end_date: {
                  [Op.gte]: moment(body.type_date.start).format("YYYY-MM-DD"),
                },
              },
              { status_kegiatan: "sedang_berlangsung" },
            ],
          }
        : { status_kegiatan: "sedang_berlangsung" };

    try {
      const programs = await Program.findAll({
        where: {
          name: { [Op.like]: `%${body.name.replace("Program ", "")}%` },
        },
        attributes: ["id", "name"],
        include: [
          {
            model: Kegiatan,
            attributes: ["id", "nama_kegiatan", "desc", "banner"],
            where: filterTanggal,
            required: true, // ubah ke false dulu kalau mau ngetes tanpa filter relasi
            include: [
              {
                model: Permohonan,
                attributes: ["id"],
                include: [
                  {
                    model: Realisasi_permohonan,
                    attributes: ["biaya_disetujui", "status_realisasi"],
                  },
                ],
              },
            ],
          },
        ],
        limit,
        offset: (page - 1) * limit,
        logging: console.log, // biar semua query SQL-nya tampil
      }).catch((err) => {
        console.error("🔥 Sequelize error (catch di findAll):", err);
        throw err;
      });

      if (!programs || programs.length === 0) {
        console.warn("⚠️ Tidak ada data ditemukan di tabel Program / Kegiatan");
        return { data: {}, total: { jumlah_kegiatan: 0 } };
      }

      console.log("🔥 RESULT PROGRAMS:", JSON.stringify(programs, null, 2));

      const program = programs[0];
      let orangTerbantu = 0;
      let jumlahRealisasi = 0;
      let idKegiatan = null;
      let namaKegiatan = "";
      let banner = "";

      // Hitung total kegiatan (buat pagination total count)
      const totalKegiatan = program.Kegiatans?.length || 0;
      console.log("📊 Total kegiatan:", totalKegiatan);

      // Hitung orang & realisasi dari kegiatan yang diambil di halaman ini
      program.Kegiatans?.forEach((kegiatan) => {
        idKegiatan = kegiatan.id;
        namaKegiatan = kegiatan.nama_kegiatan;
        banner = kegiatan.banner;

        kegiatan.Permohonans?.forEach((perm) => {
          perm.Realisasi_permohonans?.forEach((real) => {
            if (real.status_realisasi === "sudah_direalisasi") {
              orangTerbantu += 1;
              jumlahRealisasi += real.biaya_disetujui || 0;
            }
          });
        });
      });

      console.log("✅ Perhitungan selesai");
      console.log("👥 Orang terbantu:", orangTerbantu);
      console.log("💰 Jumlah realisasi:", jumlahRealisasi);

      return {
        data: {
          id_program: program.id,
          id_kegiatan: idKegiatan,
          nama_kegiatan: namaKegiatan,
          banner: banner,
          orang_terbantu: orangTerbantu,
          jumlah_realisasi: jumlahRealisasi,
        },
        total: {
          jumlah_kegiatan: totalKegiatan,
          page,
          perpage: limit,
        },
      };
    } catch (error) {
      console.error("❌ ERROR get_program_by_tipe:", error);
      return { data: {}, total: { jumlah_kegiatan: 0 } };
    }
  }
}

module.exports = Model_r;
