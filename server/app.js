// ===== IMPORTS =====
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const express = require("express");
const path = require("path");
const session = require("express-session");
const cors = require("cors");
const cookieParser = require("cookie-parser");

// Load environment variables
dotenv.config();

// ===== INITIALIZE =====
const app = express();
const PORT = process.env.PORT || 3001;
const SESSION_DURATION = 3600000; // 1 hour

// ===== ALLOWED ORIGINS =====
const ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "http://ziwahbenermeriah.org",
  "https://ziwahbenermeriah.org",
  "http://api.ziwahbenermeriah.org",
  "https://api.ziwahbenermeriah.org",
];

// ===== MIDDLEWARES =====

/**
 * CORS Configuration
 */
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests without origin (Postman, curl, server-to-server)
      if (!origin) {
        return callback(null, true);
      }

      if (ALLOWED_ORIGINS.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

/**
 * Body Parser
 */
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/**
 * Session Configuration
 */
app.use(
  session({
    secret: process.env.SESSION_SECRET || "OutletTacob4",
    name: "amra_sessid",
    resave: false,
    saveUninitialized: false,
    cookie: {
      expires: new Date(Date.now() + SESSION_DURATION),
      maxAge: SESSION_DURATION,
    },
  }),
);

/**
 * Static files
 */
app.set("view engine", "ejs");
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ===== ROUTES =====

/**
 * Load routers dynamically
 */
const ROUTER_LIST = [
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
];

const routers = {};

ROUTER_LIST.forEach((routerName) => {
  if (
    typeof routerName === "object" &&
    Object.keys(routerName.list).length > 0
  ) {
    routerName.list.forEach((item) => {
      routers[`router_${item}`] = require(
        `./router/${routerName.folder}/${item}/index`,
      );
    });
  } else {
    routers[`router_${routerName}`] = require(`./router/router_${routerName}`);
  }
});

// Register all routers
Object.values(routers).forEach((router) => {
  app.use(router);
});

// ===== DATABASE =====

/**
 * Initialize database
 */
const db = require("./models");

(async () => {
  try {
    await db.sequelize.sync();
    console.log("Database synchronized");
  } catch (error) {
    console.error("Database sync error:", error);
  }
})();

// ===== ERROR HANDLING =====

/**
 * Global error handler middleware
 */
app.use((err, req, res, next) => {
  console.error("Internal Server Error:", err.stack);
  res.status(err.status || 500).json({
    message: err.message || "Something went wrong!",
    status: err.status || 500,
  });
});

/**
 * 404 Not Found handler
 */
app.use((req, res) => {
  res.status(404).json({
    message: "Route not found",
    status: 404,
  });
});

// ===== START SERVER =====

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
});

module.exports = app;
