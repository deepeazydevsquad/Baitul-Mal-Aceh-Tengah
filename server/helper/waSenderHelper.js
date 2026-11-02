const { Op, Setting } = require("../models");
const axios = require("axios");

const helper = {};

helper.sendWhatsApp = async (phone, message) => {
  try {
    // Format nomor telepon (hapus leading 0, tambah 62)
    let formattedPhone = phone.replace(/^0/, "62");
    if (!formattedPhone.startsWith("62")) {
      formattedPhone = "62" + formattedPhone;
    }

    // Ambil setting dari database
    const settings = await Setting.findAll({
      where: {
        name: {
          [Op.in]: ["api_key", "device_key", "whatsapp_number"],
        },
      },
      attributes: ["name", "value"],
      raw: true,
    });

    const config = Object.fromEntries(settings.map((s) => [s.name, s.value]));

    if (!config.api_key || !config.device_key) {
      console.error("<!> Missing api_key or device_key in settings.");
      return {
        error: false,
        error_msg: "Missing API credentials.",
      };
    }

    // Kirim pesan via WAPISender
    const url = "https://wapisender.id/api/v5/message/text";
    const params = {
      api_key: config.api_key,
      device_key: config.device_key,
      destination: formattedPhone,
      message,
    };

    const response = await axios.post(url, params, { timeout: 10000 });

    // Handle response
    if (response.data?.status === "ok") {
      console.log("WhatsApp sent successfully:", response.data.data);
      return {
        success: true,
        data: response.data.data,
      };
    } else {
      console.warn("WhatsApp API responded with an error:", response.data);
      return {
        error: false,
        error_msg: response.data?.message || "Unknown response from API.",
        raw: response.data,
      };
    }
  } catch (error) {
    console.error(
      "Error sending WhatsApp:",
      error.response?.data || error.message
    );
    return {
      error: false,
      error_msg: error.response?.data?.message || error.message,
      raw: error.response?.data || null,
    };
  }
};

module.exports = helper;
