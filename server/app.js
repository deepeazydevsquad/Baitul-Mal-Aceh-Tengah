const dotenv = require("dotenv");
const process = require("process");
const express = require("express");
const path = require("path");
const cors = require("cors");
const cookieParser = require("cookie-parser");

dotenv.config();

const { validateSecurityConfiguration } = require("./config/security");
const { protectConfiguredRoutes } = require("./middleware/routeAuthorization");
const {
  PUBLIC_IMAGE_EXTENSIONS,
  restrictPublicImageType,
} = require("./helper/publicAssetHelper");
const {
  clampPaginationMiddleware,
} = require("./helper/paginationHelper");
const {
  createTrustedOriginGuard,
} = require("./middleware/requestOrigin");
const {
  suppressVerboseLogsInProduction,
} = require("./helper/logSafetyHelper");

const arr_router = [
  "documents",
  "auth",
  "administrator",
  "syarat",
  "system_log_surveyor",
  "bank",
  "register",
  "request_keanggotaan",
  "otp",
  "running_text",
  "daftar_grup_acces",
  "daftar_pengguna",
  "daftar_system_log",
  "kecamatan",
  "kegiatan_kesekretariatan",
  "bank_pengumpulan",
  "template_pesan_whatsapp",
  "desa",
  "daftar_keanggotaan",
  "surveyor",
  "pengaturan_umum",
  "pengaturan_whatsapp",
  "pertanyaan_monev",
  "laporan_umum",
  "laporan_tahunan",
  "program_kegiatan_bantuan",
  "daftar_program",
  "laporan_asnaf",
  "program_donasi",
  "tab",
  "riwayat_donasi",
  "daftar_asnaf",
  "monev",
  "riwayat_zakat",
  "urutan_bagian_monev",
  "penetapan",
  "riwayat_infaq",
  "riwayat_pesan_whatsapp",
  "zakat_member",
  "infaq_member",
  "program_bantuan_member",
  "permohonan_bantuan_member",
  "beranda",
  "target_distribusi",
  "target_pengumpulan",
  "permohonan_bantuan",
  "validasi_permohonan_bantuan",
  "kriteria",
  "laporan_pengumpulan",
  "laporan_perencanaan",
  "laporan_kesekretariatan",
  "rekap_pengumpulan",
  "rekap_pengumpulan_per_kecamatan",
  "rekap_distribusi_per_asnaf",
  "rekap_distribusi_per_kode_asnaf",
  "riwayat_permohonan_member",
  "rekap_distribusi_kecamatan",
  "donasi_member",
  "survey_lapangan",
  "bakal_penerima_bantuan",
  "logo",
  "member_area",
  "wakalah",
];

function parseCorsOrigins(env = process.env) {
  const configured = String(env.CORS_ORIGINS || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (configured.length > 0) return configured;
  if (env.NODE_ENV === "production") return [];

  return ["http://localhost:5173", "http://127.0.0.1:5173"];
}

function createApp({ verifySecurity = true } = {}) {
  suppressVerboseLogsInProduction();
  if (verifySecurity) validateSecurityConfiguration();

  const app = express();
  app.disable("x-powered-by");
  const trustProxySetting = String(process.env.TRUST_PROXY || "false");
  app.set(
    "trust proxy",
    /^\d+$/.test(trustProxySetting)
      ? Number(trustProxySetting)
      : trustProxySetting === "true"
  );

  const allowedOrigins = new Set(parseCorsOrigins());
  const noStorePrefixes = [
    "/auth/",
    "/documents/",
    "/survey_lapangan/",
    "/pengaturan_whatsapp/",
    "/pengaturan_umum/",
  ];
  const authOriginGuard = createTrustedOriginGuard({
    allowedOrigins,
    paths: [
      "/auth/login_member",
      "/auth/login_administrator",
      "/auth/member/refresh",
      "/auth/administrator/refresh",
      "/auth/member/logout",
      "/auth/administrator/logout",
      "/survey_lapangan/session",
      "/survey_lapangan/submit",
    ],
  });
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin) return callback(null, true);
        return callback(null, allowedOrigins.has(origin));
      },
      credentials: true,
      methods: ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
      maxAge: 600,
    })
  );

  const compression = require("compression");
  app.use(compression());
  app.use(cookieParser());
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true, limit: "1mb" }));
  app.use(clampPaginationMiddleware);
  app.use(authOriginGuard);

  app.use((req, res, next) => {
    res.set("X-Content-Type-Options", "nosniff");
    res.set("Referrer-Policy", "no-referrer");
    res.set("X-Frame-Options", "DENY");
    res.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    res.set("Content-Security-Policy", "base-uri 'none'; frame-ancestors 'none'; object-src 'none'");
    if (process.env.NODE_ENV === "production") {
      res.set(
        "Strict-Transport-Security",
        "max-age=31536000; includeSubDomains"
      );
    }
    next();
  });
  app.use((req, res, next) => {
    if (noStorePrefixes.some((prefix) => req.path.startsWith(prefix))) {
      res.set("Cache-Control", "no-store");
      res.set("Pragma", "no-cache");
    }
    next();
  });

  const publicImageFolders = [
    "logos",
    "icons",
    "hero",
    "bank",
    "program_donasi",
    "program_kegiatan_bantuan",
  ];
  for (const folder of publicImageFolders) {
    app.use(
      `/uploads/img/${folder}`,
      restrictPublicImageType,
      express.static(path.join(__dirname, "uploads", "img", folder), {
        dotfiles: "deny",
        index: false,
        fallthrough: true,
        maxAge: "1h",
      })
    );
  }
  app.use("/uploads", (req, res) => {
    res.status(404).json({
      error: true,
      error_msg: "Aset tidak ditemukan.",
      code: "FILE_NOT_FOUND",
    });
  });

  protectConfiguredRoutes(app);

  for (const routerName of arr_router) {
    app.use(require(`./router/router_${routerName}`));
  }

  app.use((req, res) => {
    res.status(404).json({
      error: true,
      error_msg: "Endpoint tidak ditemukan.",
      code: "NOT_FOUND",
    });
  });

  app.use((err, req, res, next) => {
    if (res.headersSent) return next(err);
    console.error("Internal Server Error:", err.code || err.name || "unknown");
    return res.status(500).json({
      error: true,
      error_msg: "Terjadi kesalahan pada server.",
    });
  });

  return app;
}

async function startServer() {
  validateSecurityConfiguration();
  const db = require("./models");
  const app = createApp({ verifySecurity: false });
  const port = process.env.PORT || 3001;

  await db.sequelize.authenticate();
  if (process.env.NODE_ENV === "production") {
    const requiredTables = [
      "Users",
      "Members",
      "Auth_sessions",
      "login_rate_limits",
    ];
    for (const table of requiredTables) {
      const [rows] = await db.sequelize.query(
        `SHOW TABLES LIKE '${table}'`
      );
      if (!rows.length) {
        throw new Error(
          "Schema database belum dimigrasikan. Jalankan migration sebelum production."
        );
      }
    }
  } else {
    await db.sequelize.sync();
  }
  return app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}

const app = createApp();

if (require.main === module) {
  startServer().catch(() => {
    console.error("Server gagal dimulai. Periksa konfigurasi dan database.");
    process.exitCode = 1;
  });
}

module.exports = app;
module.exports.createApp = createApp;
module.exports.startServer = startServer;
module.exports.parseCorsOrigins = parseCorsOrigins;
module.exports.PUBLIC_IMAGE_EXTENSIONS = PUBLIC_IMAGE_EXTENSIONS;
module.exports.restrictPublicImageType = restrictPublicImageType;
