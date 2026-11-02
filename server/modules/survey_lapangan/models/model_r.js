const {
  Op,
  sequelize,
  Realisasi_permohonan,
  Asnaf,
  Program,
  Permohonan,
  Member,
  Kegiatan,
  Surveyor_kegiatan,
  Surveyor,
  Survey_permohonan,
} = require("../../../models");
const { get_info_lokasi } = require("../../../helper/locationHelper");

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

  async survey_lapangan() {
    const capabilityId = Number(this.req.surveyCapability?.id);

    try {
      // Query 1: Get surveyor kegiatan info
      const dataSurvey = await Surveyor_kegiatan.findOne({
        where: { id: capabilityId, status: "active" },
        attributes: ["id", "access_code", "status", "sk", "kegiatan_id"],
        include: [
          {
            model: Surveyor,
            attributes: ["id", "name"],
          },
          {
            model: Kegiatan,
            attributes: ["id", "nama_kegiatan"],
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
          },
        ],
      });

      // Query 2: Get eligible members dengan subquery literal
      const dataMember = await Member.findAndCountAll({
        attributes: ["id", "fullname", "nomor_ktp"],
        where: sequelize.literal(`
        EXISTS (
          SELECT 1
          FROM permohonans p
          JOIN realisasi_permohonans rp ON rp.permohonan_id = p.id
          WHERE p.member_id = Member.id
            AND p.kegiatan_id = ${dataSurvey.kegiatan_id}
            AND rp.status = 'process_lapangan'
        )
        AND NOT EXISTS (
          SELECT 1
          FROM permohonans p
          JOIN survey_permohonans sp ON sp.permohonan_id = p.id
          WHERE p.member_id = Member.id
            AND sp.surveyor_kegiatan_id = ${dataSurvey.id}
        )
      `),
        order: [["fullname", "ASC"]],
      });

      // Format response
      return {
        data: {
          surveyor_kegiatan_id: dataSurvey.id,
          status: dataSurvey.status,
          surveyor_name: dataSurvey.Surveyor.name,
          kegiatan_name: dataSurvey.Kegiatan.nama_kegiatan,
          program_name: dataSurvey.Kegiatan.Program.name,
          asnaf_name: dataSurvey.Kegiatan.Asnaf?.name,
          sk: dataSurvey.sk,
          member: dataMember.rows.map((member) => ({
            id: member.id,
            name: `${member.fullname} - (NIK: ${member.nomor_ktp})`,
          })),
        },
        total: dataMember.count,
      };
    } catch (error) {
      console.error("Gagal mengambil data survei.");
      // console.error("Error survey_lapangan:", error.message);
      return {};
    }
  }

  // async survey_lapangan() {
  //   const { body } = this.req;

  //   try {
  //     const dataSurvey = await Surveyor_kegiatan.findOne({
  //       where: { access_code: body.access_code },
  //       attributes: ["id", "access_code", "status", "sk"],
  //       include: [
  //         {
  //           model: Surveyor,
  //           attributes: ["id", "name"],
  //         },
  //         {
  //           model: Kegiatan,
  //           attributes: ["id", "nama_kegiatan"],
  //           include: [
  //             {
  //               model: Asnaf,
  //               attributes: ["id", "name"],
  //             },
  //             {
  //               model: Program,
  //               attributes: ["id", "name"],
  //             },
  //           ],
  //         },
  //       ],
  //       raw: true,
  //       nest: true,
  //     });

  //     const dataSurveyPermohonan = await Survey_permohonan.findAll({
  //       where: { surveyor_kegiatan_id: dataSurvey.id },
  //       include: [
  //         {
  //           model: Permohonan,
  //           attributes: ["id", "member_id"],
  //         },
  //       ],
  //       raw: true,
  //       nest: true,
  //     });

  //     const excludedMemberIds = dataSurveyPermohonan
  //       .map((e) => e.Permohonan.member_id)
  //       .filter(Boolean);

  //     const whereClause = excludedMemberIds.length
  //       ? { id: { [Op.notIn]: excludedMemberIds } }
  //       : {}; // kalau kosong, jangan kasih notIn

  //     const dataRealisasi = await Realisasi_permohonan.findAll({
  //       where: { status: "process_lapangan" },
  //       include: [
  //         {
  //           model: Permohonan,
  //           attributes: ["id", "member_id"],
  //         },
  //       ],
  //       raw: true,
  //       nest: true,
  //     });

  //     const excludedMemberIdsRealisasi = dataRealisasi
  //       .map((e) => e.Permohonan.member_id)
  //       .filter(Boolean);

  //     const filteredExcludedMemberIdsRealisasi =
  //       excludedMemberIdsRealisasi.filter(
  //         (id) => !excludedMemberIds.includes(id)
  //       );

  //     if (excludedMemberIds.length) {
  //       excludedMemberIds.push(...filteredExcludedMemberIdsRealisasi);
  //     } else {
  //       excludedMemberIds = filteredExcludedMemberIdsRealisasi;
  //     }

  //     const dataMember = await Member.findAndCountAll({
  //       where: whereClause,
  //       attributes: ["id", "fullname", "nomor_ktp"],
  //       raw: true,
  //       nest: true,
  //     });

  //     return {
  //       data: {
  //         access_code: dataSurvey.access_code,
  //         status: dataSurvey.status,
  //         surveyor_name: dataSurvey.Surveyor.name,
  //         kegiatan_name: dataSurvey.Kegiatan.nama_kegiatan,
  //         program_name: dataSurvey.Kegiatan.Program.name,
  //         asnaf_name: dataSurvey.Kegiatan.Asnaf.name,
  //         sk: dataSurvey.sk,
  //         member: dataMember.rows.map((e) => ({
  //           id: e.id,
  //           name: `${e.fullname} - (NIK: ${e.nomor_ktp})`,
  //         })),
  //       },
  //       total: dataMember.count,
  //     };
  //   } catch (error) {
  //     console.error("Error survey_lapangan:", error.message);
  //     return { error: true, message: error.message };
  //   }
  // }

  async get_info_member() {
    const body = this.req.body;

    try {
      const member = await Member.findOne({
        where: { id: body.member_id },
        attributes: ["id", "fullname", "tipe", "whatsapp_number", "desa_id"],
        raw: true,
        nest: true,
      });

      const dataLokasi = await get_info_lokasi(member.desa_id);
      return {
        id: member.id,
        name: member.fullname,
        lokasi: {
          kecamatan: dataLokasi.kecamatan_name,
          desa: dataLokasi.desa_name,
        },
      };
    } catch (error) {
      console.error("Error fetching info for member:", error);
      return null;
    }
  }

  async info_survey_kegiatan(surveyorKegiatanId) {
    try {
      const survey = await Surveyor_kegiatan.findOne({
        where: {
          id: Number(surveyorKegiatanId),
          status: "active",
        },
        attributes: ["id", "kegiatan_id", "surveyor_id", "status", "sk"],
        raw: true,
        nest: true,
      });
      return survey;
    } catch (error) {
      console.error("Error fetching info for permohonan:", error);
      return null;
    }
  }

  async info_permohonan_w_member(kegiatan_id, member_id) {
    try {
      const permohonan = await Permohonan.findOne({
        where: { kegiatan_id: kegiatan_id, member_id: member_id },
        raw: true,
        nest: true,
        attributes: ["id", "member_id", "kegiatan_id"],
      });
      return permohonan;
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
        attributes: ["id", "fullname", "tipe", "whatsapp_number", "desa_id"],
      });
      return member;
    } catch (error) {
      //console.error("Error fetching info for member:", error);
      console.log("000000000000000000000000000");
      console.log(error);
      console.log("000000000000000000000000000");
      return null;
    }
  }
}

module.exports = Model_r;
