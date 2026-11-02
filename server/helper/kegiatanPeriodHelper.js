const moment = require("moment");

const ELIGIBLE_KEGIATAN_STATUS = "sedang_berlangsung";

function getCurrentKegiatanPeriod(now = moment()) {
  const current = moment(now);
  return {
    year: current.year(),
    now: current,
  };
}

function validateKegiatanPeriod(kegiatan, now = moment()) {
  if (!kegiatan) {
    return {
      valid: false,
      statusCode: 400,
      message: "Kegiatan tidak terdaftar di pangkalan data.",
    };
  }

  if (kegiatan.status_kegiatan !== ELIGIBLE_KEGIATAN_STATUS) {
    return {
      valid: false,
      statusCode: 409,
      message: "Kegiatan sudah tidak aktif untuk pengajuan.",
    };
  }

  const { year, now: current } = getCurrentKegiatanPeriod(now);
  if (Number(kegiatan.tahun) !== year) {
    return {
      valid: false,
      statusCode: 409,
      message: "Kegiatan berada di luar periode pengajuan saat ini.",
    };
  }

  if (
    kegiatan.start_date &&
    current.isBefore(moment(kegiatan.start_date).startOf("day"))
  ) {
    return {
      valid: false,
      statusCode: 409,
      message: "Periode pengajuan kegiatan belum dimulai.",
    };
  }

  if (
    kegiatan.end_date &&
    current.isAfter(moment(kegiatan.end_date).endOf("day"))
  ) {
    return {
      valid: false,
      statusCode: 409,
      message: "Periode pengajuan kegiatan sudah berakhir.",
    };
  }

  return {
    valid: true,
    statusCode: 200,
    year,
    now: current,
  };
}

function getKegiatanPeriodWhere(now = moment()) {
  return {
    tahun: getCurrentKegiatanPeriod(now).year,
  };
}

module.exports = {
  ELIGIBLE_KEGIATAN_STATUS,
  getCurrentKegiatanPeriod,
  validateKegiatanPeriod,
  getKegiatanPeriodWhere,
};
