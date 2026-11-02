const { Op, Setting } = require("../../../models");
const axios = require("axios");

function maskSecret(value) {
  const text = String(value || "");
  if (!text) return "";
  if (text.length <= 4) return "*".repeat(text.length);
  return `${"*".repeat(Math.min(12, text.length - 4))}${text.slice(-4)}`;
}

class Model_r {
  constructor(req) {
    this.req = req;
  }

  async initialize() {
    //
  }

  async get_start() {
    const settingsArray = await Setting.findAll({
      where: {
        name: { [Op.in]: ["api_key", "device_key", "whatsapp_number"] },
      },
      attributes: ["name", "value"],
    });

    const settings = {};
    settingsArray.forEach((s) => (settings[s.name] = s.value));

    if (!settings.api_key || !settings.device_key) {
      throw new Error("api_key / device_key belum ada di database");
    }

    try {
      const url = "https://wapisender.id/api/v5/device/start";
      const response = await axios.post(
        url,
        {
          api_key: settings.api_key,
          device_key: settings.device_key,
        },
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      const result = response.data;
      console.log("Start Device Response:", result);

      if (result?.data?.todo === "scan") {
        const qrResponse = await axios.get(
          "https://wapisender.id/api/v5/device/qr",
          {
            params: {
              api_key: settings.api_key,
              device_key: settings.device_key,
            },
            responseType: "arraybuffer",
            timeout: 10000,
            maxContentLength: 1024 * 1024,
          }
        );
        const contentType = String(qrResponse.headers?.["content-type"] || "");
        if (!contentType.startsWith("image/")) {
          throw new Error("Provider mengembalikan QR yang tidak valid");
        }
        return {
          status: result.status,
          message: result.message,
          todo: "scan",
          qr_image: `data:${contentType};base64,${Buffer.from(
            qrResponse.data
          ).toString("base64")}`,
        };
      }

      return {
        status: result.status,
        message: result.message,
        todo: "connected",
      };
    } catch (error) {
      console.error(
        "Error start device:",
        error?.response?.data || error.message
      );
      throw new Error("Gagal mengaktifkan perangkat WhatsApp");
    }
  }

  async get_konfigurasi() {
    await this.initialize();
    const data = await Setting.findAll({
      where: {
        name: { [Op.in]: ["api_key", "device_key", "whatsapp_number"] },
      },
      attributes: ["name", "value"],
    });
    return {
      data: data.map((e) => ({
        name: e.name,
        value:
          e.name === "api_key" || e.name === "device_key" ? "" : e.value,
        configured:
          e.name === "api_key" || e.name === "device_key"
            ? Boolean(e.value)
            : true,
      })),
    };
  }

  async get_info_pengaturan_whatsapp() {
    const mappingKey = ["api_key", "device_key", "whatsapp_number"];

    try {
      const where = {
        name: {
          [Op.in]: mappingKey,
        },
      };

      const result = await Setting.findAll({
        where,
        attributes: ["id", "name", "value"],
      });

      // ubah array jadi object key-value
      const settings = result.reduce((acc, row) => {
        acc[row.name] = row.value;
        return acc;
      }, {});

      // panggil API Wapisender
      const wapisenderResponse = await axios.post(
        "https://wapisender.id/api/v5/device/info",
        {
          api_key: settings["api_key"],
          device_key: settings["device_key"],
        },
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      let vr = {
        device_key: maskSecret(settings["device_key"]),
        whatsapp_number: settings["whatsapp_number"] || null,
      };

      if (wapisenderResponse.data.status == "ok") {
        return {
          ...vr,
          ...{
            ["status"]: wapisenderResponse.data.status || null,
            ["created_at"]: wapisenderResponse.data.created_at || null,
            ["expired_at"]: wapisenderResponse.data.expired_at || null,
          },
        };
      } else {
        return {
          ...vr,
          ...{
            ["status"]: wapisenderResponse.data.status,
            ["created_at"]: wapisenderResponse.data.created_at,
            ["expired_at"]: wapisenderResponse.data.expired_at,
          },
        };
      }
    } catch (error) {
      console.error("Error fetching data settings:", error);
      return {};
    }
  }
}

module.exports = Model_r;
