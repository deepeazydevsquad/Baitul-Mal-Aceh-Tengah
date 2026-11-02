const axios = require("axios");
const jwt = require("jsonwebtoken");

const secret = process.env.ADMINISTRATOR_SECRET_KEY;
if (!secret) {
  throw new Error("ADMINISTRATOR_SECRET_KEY wajib diisi melalui environment.");
}

const token = jwt.sign(
  {
    sub: "1",
    principal_type: "administrator",
    token_type: "access",
    sid: "manual-test-session",
  },
  secret,
  {
    algorithm: "HS256",
    issuer: "baitulmal-api",
    audience: "baitulmal-administrator",
    expiresIn: "1h",
  }
);

async function test() {
  try {
    const response = await axios.get(
      "http://localhost:3003/rekap_distribusi_per_asnaf/list?year=2026",
      {
        headers: { Authorization: `Bearer ${token}` },
        validateStatus: () => true,
      }
    );
    console.log(response.status);
  } catch {
    console.error("Permintaan pemeriksaan API gagal.");
  }
}

test();
