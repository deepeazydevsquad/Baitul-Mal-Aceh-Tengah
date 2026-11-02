const { getCompanyIdByCode } = require("../../../helper/companyHelper");
const { Company } = require("../../../models/");
const axios = require("axios");
const FormData = require("form-data");
class Model_r {
  constructor(req) {
    this.req = req;
    this.company_id = null;
  }
  async initialize() {
    this.company_id = await getCompanyIdByCode(this.req);
  }
  async get_key() {
    await this.initialize();
    const data = await Company.findOne({
      where: { id: this.company_id },
      attributes: [
        "whatsapp_device_number",
        "whatsapp_device_key",
        "whatsapp_api_key",
      ],
    });
    return data;
  }
  async cek_koneksi_device() {
    try {
      const data = await this.get_key();
      console.log("memulai cek koneksi");
      if (!data) {
        throw new Error("Company not found atau belum setup WhatsApp API-nya.");
      }
      const { whatsapp_device_key: device_key, whatsapp_api_key: api_key } =
        data;
      const form = new FormData();
      form.append("device_key", device_key);
      form.append("api_key", api_key);
      const infoRes = await axios.post(
        "https://wapisender.id/api/v5/device/info",
        form,
        { headers: form.getHeaders() }
      );
      const responseData = infoRes.data?.data;
      return {
        phone_number: responseData.phone_number || null,
        device_key_configured: Boolean(responseData.id || device_key),
        tanggal_berlangganan: responseData.created_at || null,
        tanggal_expired: responseData.expired_at || null,
        status_langganan: responseData.status || null,
      };
    } catch (err) {
      console.log(err.response?.data || err.message);
      return {
        error: true,
        message: err.response?.data || err.message,
      };
    }
  }
}
module.exports = Model_r;
