const axios = require("axios");
require("dotenv").config();

const Model_r = require("../models/model_r");
const Model_cud = require("../models/model_cud");

const { handleValidationErrors } = require("../../../helper/handleError");

exports.sendOtp = async (req, res) => {
  if (!(await handleValidationErrors(req, res))) return;

  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  const expiredTime = new Date(Date.now() + 24 * 60 * 60 * 1000); // 1 hari
  const now = new Date();
  const startOfDay = new Date(now.setHours(0, 0, 0, 0));

  try {
    const { whatsappNumber } = req.body;

    const model_r = new Model_r(req);
    const otpCount = await model_r.countOtp(startOfDay);

    if (otpCount >= 2) {
      return res.status(429).json({
        error: "Batas maksimal OTP tercapai. Coba lagi besok.",
        code: "OTP_LIMIT_REACHED",
      });
    }

    const wapiSetting = await model_r.wapisender_api_device_key();

    if (!wapiSetting["api_key"] || !wapiSetting["device_key"]) {
      return res.status(500).json({
        error: "API Key atau Device Key tidak ditemukan",
        code: "API_KEY_MISSING",
      });
    }

    const message = `Kode OTP Anda adalah ${otpCode}`;
    const wapisenderResponse = await axios.post(
      "https://wapisender.id/api/v5/message/text",
      {
        api_key: wapiSetting["api_key"],
        device_key: wapiSetting["device_key"],
        destination: whatsappNumber,
        message: message,
      },
    );

    if (wapisenderResponse.data.status !== "ok") {
      return res.status(500).json({
        error: "Gagal mengirim OTP",
        code: "OTP_SEND_FAILED",
        detail: wapisenderResponse.data,
      });
    } else {
      const model_cud = new Model_cud(req);
      // insert
      await model_cud.savedOtp({
        otp_code: otpCode,
        expired_time: expiredTime,
        whatsapp_number: whatsappNumber,
      });

      if (model_cud.response()) {
        return res.json({
          status: "OTP berhasil dikirim",
          otp: otpCode,
        });
      } else {
        return res.status(500).json({
          error: "Terjadi kesalahan saat mengirim/simpan OTP",
        });
      }
    }
  } catch (error) {
    return res.status(500).json({
      error: "Terjadi kesalahan saat mengirim/simpan OTP",
      code: "INTERNAL_SERVER_ERROR",
      detail: error.message || error,
    });
  }
};
