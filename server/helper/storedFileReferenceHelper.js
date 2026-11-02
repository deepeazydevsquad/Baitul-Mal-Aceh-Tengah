const {
  Op,
  Realisasi_permohonan,
  Validasi_syarat_permohonan,
  Survey_permohonan,
} = require("../models");

async function findStoredFileReferences(filename, options = {}) {
  const transaction = options.transaction;
  const [realisasi, validasi, survey] = await Promise.all([
    Realisasi_permohonan.findAll({
      where: {
        [Op.or]: [
          { berita_acara: filename },
          { bukti_transfer: filename },
          { mou: filename },
        ],
      },
      attributes: ["id"],
      limit: 1,
      transaction,
      raw: true,
    }),
    Validasi_syarat_permohonan.findAll({
      where: { path: filename },
      attributes: ["id"],
      limit: 1,
      transaction,
      raw: true,
    }),
    Survey_permohonan.findAll({
      where: {
        [Op.or]: [
          { form_survey: filename },
          { berita_acara: filename },
          { dokumentasi: { [Op.like]: `%${filename}%` } },
        ],
      },
      attributes: ["id"],
      limit: 1,
      transaction,
      raw: true,
    }),
  ]);

  return {
    realisasi: realisasi.length > 0,
    validasi: validasi.length > 0,
    survey: survey.length > 0,
  };
}

async function isStoredFileReferenced(filename, options = {}) {
  const references = await findStoredFileReferences(filename, options);
  return Object.values(references).some(Boolean);
}

module.exports = {
  findStoredFileReferences,
  isStoredFileReferenced,
};
