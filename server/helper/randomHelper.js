const {
  Member,
  Riwayat_donasi,
  Riwayat_pengumpulan,
  Pembayaran_gaji,
  Wakalah,
} = require("../models");

const helper = {};

/**
 * Generate random string dengan karakter tertentu
 * @param {number} length - Panjang string yang diinginkan
 * @param {string} chars - Karakter yang akan digunakan
 * @returns {Promise<string>} Random string
 */
helper.randomString = async (length, chars) => {
  let result = "";
  for (let i = length; i > 0; i--) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
};

/**
 * Generate kode wakalah yang unik
 * @returns {Promise<string>} Kode wakalah unik
 */
helper.generateKodeWakalah = async () => {
  let rand;
  let isExists = true;

  while (isExists) {
    rand = await helper.randomString(6, "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ");
    const check = await Wakalah.findOne({
      where: { kode: rand },
    });
    isExists = !!check;
  }

  return rand;
};

/**
 * Generate kode anggota yang unik
 * @returns {Promise<string>} Kode anggota unik
 */
helper.generateKodeKeanggotaan = async () => {
  let rand;
  let isExists = true;

  while (isExists) {
    rand = await helper.randomString(6, "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ");
    const check = await Member.findOne({
      where: { kode: rand },
    });
    isExists = !!check;
  }

  return rand;
};

/**
 * Generate invoice pembayaran gaji yang unik
 * @returns {Promise<string>} Invoice pembayaran gaji unik
 */
helper.menghasilkan_invoice_pembayaran_gaji = async () => {
  let rand;
  let isExists = true;

  while (isExists) {
    rand = await helper.randomString(6, "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ");
    const check = await Pembayaran_gaji.findOne({
      where: { invoice: rand },
    });
    isExists = !!check;
  }

  return rand;
};

/**
 * Generate kode pembayaran zakat/infaq yang unik
 * @returns {Promise<string|null>} Kode pembayaran zakat/infaq unik
 */
helper.kode_pembayaran_zakat_infaq = async () => {
  try {
    let kode;
    let isExists = true;

    // Ulang generate sampai dapat kode unik
    while (isExists) {
      const randomNumber = Math.floor(Math.random() * 900) + 100;
      kode = randomNumber.toString();

      // Cek ke DB apakah kode sudah pernah dipakai
      const check = await Riwayat_pengumpulan.findOne({
        where: { kode: kode },
      });

      isExists = !!check;
    }

    return kode;
  } catch (error) {
    console.error("Error generating kode pembayaran zakat/infaq:", error);
    return null;
  }
};

/**
 * Generate kode pembayaran donasi yang unik
 * @returns {Promise<string|null>} Kode pembayaran donasi unik
 */
helper.kode_pembayaran_donasi = async () => {
  try {
    let kode;
    let isExists = true;

    // Ulang generate sampai dapat kode unik
    while (isExists) {
      const randomNumber = Math.floor(Math.random() * 900) + 100;
      kode = randomNumber.toString();

      // Cek ke DB apakah kode sudah pernah dipakai
      const check = await Riwayat_donasi.findOne({
        where: { kode: kode },
      });

      isExists = !!check;
    }

    return kode;
  } catch (error) {
    console.error("Error generating kode pembayaran donasi:", error);
    return null;
  }
};

module.exports = helper;
