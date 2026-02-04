const { Op, sequelize, Wakalah, Desa, Kecamatan } = require("../../../models");
const { get_info_lokasi } = require("../../../helper/locationHelper");
const moment = require("moment");

class Model_r {
  constructor(req) {
    this.req = req;
  }

  async list() {
    const body = this.req.body;
    const limit = parseInt(body.perpage, 10) || 10;
    const page = parseInt(body.pageNumber, 10) || 1;

    const where = body.search
      ? {
          [Op.or]: [
            { fullname: { [Op.like]: `%${body.search}%` } },
            { kode: { [Op.like]: `%${body.search}%` } },
            { jabatan: { [Op.like]: `%${body.search}%` } },
          ],
        }
      : {};

    try {
      const result = await Wakalah.findAndCountAll({
        limit,
        offset: (page - 1) * limit,
        order: [["id", "ASC"]],
        attributes: [
          "id",
          "kode",
          "fullname",
          "jabatan",
          "whatsapp_number",
          "updatedAt",
        ],
        where,
        include: [
          {
            model: Desa,
            attributes: ["id", "name"],
            include: [
              {
                model: Kecamatan,
                attributes: ["id", "name"],
              },
            ],
          },
        ],
      });

      return {
        data: result.rows.map((e) => ({
          id: e.id,
          kode: e.kode,
          fullname: e.fullname,
          jabatan: e.jabatan,
          whatsapp_number: e.whatsapp_number,
          updatedAt: moment(e.updatedAt).format("YYYY-MM-DD HH:mm:ss"),
          desa: e.Desa.name,
          kecamatan: e.Desa.Kecamatan.name,
        })),
        total: result.count,
      };
    } catch (error) {
      console.error("Error fetching daftar_keanggotaan data:", error);
      return { data: [], total: 0 };
    }

    // const body = this.req.body;
    // let where = {};

    // if (body.tahun && body.tahun !== "") {
    //   where.tahun = body.tahun;
    // }

    // if (body.bulan && body.bulan !== "") {
    //   where.bulan = body.bulan;
    // }

    // try {
    //   // ambil semua target distribusi (zakat per asnaf + infaq + donasi)
    //   const q = await Target_distribusi.findAll({
    //     attributes: [
    //       "id",
    //       "tahun",
    //       "bulan",
    //       "tipe",
    //       "asnaf_id",
    //       "target_orang",
    //       "target_rupiah",
    //       "createdAt",
    //       "updatedAt",
    //     ],
    //     include: [
    //       {
    //         model: Asnaf,
    //         attributes: ["id", "name"],
    //         required: false, // biar infaq & donasi tetap bisa (asnaf_id null)
    //       },
    //     ],
    //     where,
    //     order: [
    //       ["tahun", "DESC"],
    //       ["bulan", "DESC"],
    //       ["tipe", "ASC"],
    //       ["asnaf_id", "ASC"],
    //     ],
    //   });

    //   const data = q.map((item) => {
    //     const row = item.toJSON();
    //     return {
    //       id: row.id,
    //       tahun: row.tahun,
    //       bulan: row.bulan,
    //       bulan_name: this.getBulanName(row.bulan),
    //       tipe: row.tipe, // zakat / infaq / donasi
    //       asnaf_id: row.asnaf_id || null,
    //       asnaf_name: row.Asnaf ? row.Asnaf.name : null,
    //       target_orang: parseInt(row.target_orang) || 0,
    //       target_rupiah: parseInt(row.target_rupiah) || 0,
    //       createdAt: row.createdAt,
    //       updatedAt: row.updatedAt,
    //     };
    //   });

    //   return {
    //     state: true,
    //     message: "Berhasil ambil daftar target distribusi",
    //     data,
    //     total: data.length,
    //   };
    // } catch (error) {
    //   console.error("ERROR in daftar target distribusi:", error);
    //   return {
    //     state: false,
    //     message: "Gagal ambil daftar target distribusi",
    //     data: [],
    //     total: 0,
    //   };
    // }
  }

  // async sisa_dana(id) {
  //   try {
  //     const [dataKegiatan, dataPermohonan] = await Promise.all([
  //       Kegiatan.findOne({
  //         where: { id },
  //         attributes: ["jumlah_dana"],
  //         raw: true,
  //       }),
  //       Realisasi_permohonan.findOne({
  //         raw: true,
  //         attributes: [
  //           [
  //             sequelize.fn(
  //               "COALESCE",
  //               sequelize.fn("SUM", sequelize.col("nominal_realisasi")),
  //               0
  //             ),
  //             "total",
  //           ],
  //         ],
  //         include: [
  //           {
  //             model: Permohonan,
  //             where: { kegiatan_id: id },
  //             required: true,
  //             attributes: [],
  //           },
  //         ],
  //       }),
  //     ]);
  //     const totalRealisasi = parseInt(dataPermohonan.total, 10) || 0;
  //     return dataKegiatan.jumlah_dana - totalRealisasi;
  //   } catch (error) {
  //     console.error("Error sisa_dana:", error);
  //     return null;
  //   }
  // }

  // async survey_lapangan() {
  //   const { body } = this.req;

  //   try {
  //     // Query 1: Get surveyor kegiatan info
  //     const dataSurvey = await Surveyor_kegiatan.findOne({
  //       where: { access_code: body.access_code },
  //       attributes: ["id", "access_code", "status", "sk", "kegiatan_id"],
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
  //     });

  //     // Query 2: Get eligible members dengan subquery literal
  //     const dataMember = await Member.findAndCountAll({
  //       attributes: ["id", "fullname", "nomor_ktp"],
  //       where: sequelize.literal(`
  //       EXISTS (
  //         SELECT 1
  //         FROM permohonans p
  //         JOIN realisasi_permohonans rp ON rp.permohonan_id = p.id
  //         WHERE p.member_id = Member.id
  //           AND p.kegiatan_id = ${dataSurvey.kegiatan_id}
  //           AND rp.status = 'process_lapangan'
  //       )
  //       AND NOT EXISTS (
  //         SELECT 1
  //         FROM permohonans p
  //         JOIN survey_permohonans sp ON sp.permohonan_id = p.id
  //         WHERE p.member_id = Member.id
  //           AND sp.surveyor_kegiatan_id = ${dataSurvey.id}
  //       )
  //     `),
  //       order: [["fullname", "ASC"]],
  //     });

  //     console.log("--------------------------");
  //     console.log("dataMember:", dataMember);
  //     console.log("dataSurvey:", dataSurvey.Surveyor);
  //     console.log("dataSurvey:", dataSurvey.Surveyor.name);
  //     // console.log(dataSurvey.Kegiatan.Asnaf);
  //     // console.log(dataSurvey.Kegiatan.Asnaf.name);
  //     console.log("--------------------------");

  //     // Format response
  //     return {
  //       data: {
  //         access_code: dataSurvey.access_code,
  //         status: dataSurvey.status,
  //         surveyor_name: dataSurvey.Surveyor.name,
  //         kegiatan_name: dataSurvey.Kegiatan.nama_kegiatan,
  //         program_name: dataSurvey.Kegiatan.Program.name,
  //         asnaf_name: dataSurvey.Kegiatan.Asnaf?.name,
  //         sk: dataSurvey.sk,
  //         member: dataMember.rows.map((member) => ({
  //           id: member.id,
  //           name: `${member.fullname} - (NIK: ${member.nomor_ktp})`,
  //         })),
  //       },
  //       total: dataMember.count,
  //     };
  //   } catch (error) {
  //     console.log("--------------------------");
  //     console.log(error);
  //     console.log("--------------------------");
  //     // console.error("Error survey_lapangan:", error.message);
  //     return {};
  //   }
  // }

  // // async survey_lapangan() {
  // //   const { body } = this.req;

  // //   try {
  // //     const dataSurvey = await Surveyor_kegiatan.findOne({
  // //       where: { access_code: body.access_code },
  // //       attributes: ["id", "access_code", "status", "sk"],
  // //       include: [
  // //         {
  // //           model: Surveyor,
  // //           attributes: ["id", "name"],
  // //         },
  // //         {
  // //           model: Kegiatan,
  // //           attributes: ["id", "nama_kegiatan"],
  // //           include: [
  // //             {
  // //               model: Asnaf,
  // //               attributes: ["id", "name"],
  // //             },
  // //             {
  // //               model: Program,
  // //               attributes: ["id", "name"],
  // //             },
  // //           ],
  // //         },
  // //       ],
  // //       raw: true,
  // //       nest: true,
  // //     });

  // //     const dataSurveyPermohonan = await Survey_permohonan.findAll({
  // //       where: { surveyor_kegiatan_id: dataSurvey.id },
  // //       include: [
  // //         {
  // //           model: Permohonan,
  // //           attributes: ["id", "member_id"],
  // //         },
  // //       ],
  // //       raw: true,
  // //       nest: true,
  // //     });

  // //     const excludedMemberIds = dataSurveyPermohonan
  // //       .map((e) => e.Permohonan.member_id)
  // //       .filter(Boolean);

  // //     const whereClause = excludedMemberIds.length
  // //       ? { id: { [Op.notIn]: excludedMemberIds } }
  // //       : {}; // kalau kosong, jangan kasih notIn

  // //     const dataRealisasi = await Realisasi_permohonan.findAll({
  // //       where: { status: "process_lapangan" },
  // //       include: [
  // //         {
  // //           model: Permohonan,
  // //           attributes: ["id", "member_id"],
  // //         },
  // //       ],
  // //       raw: true,
  // //       nest: true,
  // //     });

  // //     const excludedMemberIdsRealisasi = dataRealisasi
  // //       .map((e) => e.Permohonan.member_id)
  // //       .filter(Boolean);

  // //     const filteredExcludedMemberIdsRealisasi =
  // //       excludedMemberIdsRealisasi.filter(
  // //         (id) => !excludedMemberIds.includes(id)
  // //       );

  // //     if (excludedMemberIds.length) {
  // //       excludedMemberIds.push(...filteredExcludedMemberIdsRealisasi);
  // //     } else {
  // //       excludedMemberIds = filteredExcludedMemberIdsRealisasi;
  // //     }

  // //     const dataMember = await Member.findAndCountAll({
  // //       where: whereClause,
  // //       attributes: ["id", "fullname", "nomor_ktp"],
  // //       raw: true,
  // //       nest: true,
  // //     });

  // //     return {
  // //       data: {
  // //         access_code: dataSurvey.access_code,
  // //         status: dataSurvey.status,
  // //         surveyor_name: dataSurvey.Surveyor.name,
  // //         kegiatan_name: dataSurvey.Kegiatan.nama_kegiatan,
  // //         program_name: dataSurvey.Kegiatan.Program.name,
  // //         asnaf_name: dataSurvey.Kegiatan.Asnaf.name,
  // //         sk: dataSurvey.sk,
  // //         member: dataMember.rows.map((e) => ({
  // //           id: e.id,
  // //           name: `${e.fullname} - (NIK: ${e.nomor_ktp})`,
  // //         })),
  // //       },
  // //       total: dataMember.count,
  // //     };
  // //   } catch (error) {
  // //     console.error("Error survey_lapangan:", error.message);
  // //     return { error: true, message: error.message };
  // //   }
  // // }

  // async get_info_member() {
  //   const body = this.req.body;

  //   try {
  //     const member = await Member.findOne({
  //       where: { id: body.member_id },
  //       attributes: ["id", "fullname", "tipe", "whatsapp_number", "desa_id"],
  //       raw: true,
  //       nest: true,
  //     });

  //     const dataLokasi = await get_info_lokasi(member.desa_id);
  //     return {
  //       id: member.id,
  //       name: member.fullname,
  //       lokasi: {
  //         kecamatan: dataLokasi.kecamatan_name,
  //         desa: dataLokasi.desa_name,
  //       },
  //     };
  //   } catch (error) {
  //     console.error("Error fetching info for member:", error);
  //     return null;
  //   }
  // }

  // async info_survey_kegiatan(access_code) {
  //   try {
  //     const survey = await Surveyor_kegiatan.findOne({
  //       where: { access_code: access_code },
  //       attributes: ["id", "kegiatan_id", "surveyor_id", "status", "sk"],
  //       raw: true,
  //       nest: true,
  //     });
  //     return survey;
  //   } catch (error) {
  //     console.error("Error fetching info for permohonan:", error);
  //     return null;
  //   }
  // }

  // async info_permohonan_w_member(kegiatan_id, member_id) {
  //   try {
  //     const permohonan = await Permohonan.findOne({
  //       where: { kegiatan_id: kegiatan_id, member_id: member_id },
  //       raw: true,
  //       nest: true,
  //       attributes: ["id", "member_id", "kegiatan_id"],
  //     });
  //     return permohonan;
  //   } catch (error) {
  //     console.error("Error fetching info for permohonan:", error);
  //     return null;
  //   }
  // }

  // async info_permohonan(permohonan_id) {
  //   try {
  //     const permohonan = await Permohonan.findOne({
  //       where: { id: permohonan_id },
  //       raw: true,
  //       nest: true,
  //       attributes: [
  //         "id",
  //         "member_id",
  //         "kegiatan_id",
  //         "bank_id",
  //         "nomor_akun_bank",
  //         "nama_akun_bank",
  //         "status",
  //         "alasan_penolakan",
  //       ],
  //     });
  //     return permohonan;
  //   } catch (error) {
  //     console.error("Error fetching info for permohonan:", error);
  //     return null;
  //   }
  // }

  // async info_kegiatan(kegiatan_id) {
  //   try {
  //     const kegiatan = await Kegiatan.findOne({
  //       where: { id: kegiatan_id },
  //       raw: true,
  //       nest: true,
  //       attributes: [
  //         "id",
  //         "nama_kegiatan",
  //         "jumlah_dana",
  //         "jumlah_maksimal_nominal_bantuan",
  //         "tahun",
  //         "area_penyaluran",
  //         "status_kegiatan",
  //         "periode_bantuan",
  //       ],
  //     });
  //     return kegiatan;
  //   } catch (error) {
  //     console.error("Error fetching info for kegiatan:", error);
  //     return null;
  //   }
  // }

  // async info_member(member_id) {
  //   try {
  //     const member = await Member.findOne({
  //       where: { id: member_id },
  //       raw: true,
  //       nest: true,
  //       attributes: ["id", "fullname", "tipe", "whatsapp_number", "desa_id"],
  //     });
  //     return member;
  //   } catch (error) {
  //     //console.error("Error fetching info for member:", error);
  //     console.log("000000000000000000000000000");
  //     console.log(error);
  //     console.log("000000000000000000000000000");
  //     return null;
  //   }
  // }
}

module.exports = Model_r;
