const axios = require("axios");
const Model_r = require("../models/model_r");
const Model_cud = require("../models/model_cud");
const { handleValidationErrors } = require("../../../helper/handleError");
const {
  normalizeWhatsAppNumber,
  generateOtpCode,
} = require("../../../helper/otpHelper");

exports.sendOtp = async (req, res) => {
  if (!(await handleValidationErrors(req, res))) return;

  const whatsappNumber = normalizeWhatsAppNumber(req.body.whatsappNumber);
  if (!whatsappNumber) {
    return res.status(400).json({
      error: true,
      error_msg: "Nomor WhatsApp tidak valid.",
      code: "INVALID_WHATSAPP_NUMBER",
    });
  }

  const modelCud = new Model_cud(req);
  try {
    const otpCode = generateOtpCode();
    await modelCud.createOtp({
      whatsapp_number: whatsappNumber,
      purpose: "registration",
      otp_code: otpCode,
    });
    if (!(await modelCud.response())) throw new Error("OTP_COMMIT_FAILED");

    const modelR = new Model_r(req);
    const setting = await modelR.wapisender_api_device_key();
    if (!setting.api_key || !setting.device_key) {
      await modelCud.markFailed();
      return res.status(503).json({
        error: true,
        error_msg: "Layanan OTP belum dikonfigurasi.",
        code: "OTP_PROVIDER_UNAVAILABLE",
      });
    }

    const providerResponse = await axios.post(
      "https://wapisender.id/api/v5/message/text",
      {
        api_key: setting.api_key,
        device_key: setting.device_key,
        destination: whatsappNumber,
        message: `Kode OTP Anda adalah ${otpCode}. Kode berlaku 5 menit.`,
      },
      { timeout: 10000 }
    );

    if (providerResponse.data?.status !== "ok") {
      await modelCud.markFailed();
      return res.status(502).json({
        error: true,
        error_msg: "OTP gagal dikirim.",
        code: "OTP_SEND_FAILED",
      });
    }

    return res.status(200).json({
      error: false,
      status: "OTP berhasil dikirim.",
      expires_in_seconds: 300,
    });
  } catch (error) {
    if (error.code === "OTP_SEND_LIMIT") {
      await modelCud.response();
      return res.status(429).json({
        error: true,
        error_msg: "Batas pengiriman OTP tercapai. Coba lagi besok.",
        code: "OTP_SEND_LIMIT",
      });
    }

    if (modelCud.record) {
      await modelCud.markFailed();
    }
    await modelCud.response();
    return res.status(500).json({
      error: true,
      error_msg: "Terjadi kesalahan saat mengirim OTP.",
      code: "OTP_SEND_FAILED",
    });
  }
};
