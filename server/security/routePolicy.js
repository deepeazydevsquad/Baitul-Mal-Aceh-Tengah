const permissionRules = [
  {
    match: /^\/daftar_pengguna/,
    permission: { menuId: 6, submenuId: 17 },
  },
  {
    match: /^\/grup_akses/,
    permission: { menuId: 6, submenuId: 16 },
  },
  {
    match: /^\/pengaturan_umum/,
    permission: { menuId: 6, submenuId: 15 },
  },
  {
    match: /^\/(pengaturan_whatsapp|template_pesan_whatsapp)/,
    permission: { menuId: 6, submenuId: 19 },
  },
  {
    match: /^\/(daftar_system_log|system_log_surveyor)/,
    permission: { menuId: 6, submenuId: 20 },
  },
  {
    match: /^\/(daftar_keanggotaan|request_keanggotaan)/,
    permission: { menuId: 3, submenuId: 5 },
  },
  {
    match: /^\/daftar_asnaf/,
    permission: { menuId: 4, submenuId: 6 },
  },
  {
    match: /^\/daftar_program/,
    permission: { menuId: 4, submenuId: 7 },
  },
  {
    match: /^\/(kecamatan|desa)/,
    permission: { menuId: 4, submenuId: 8 },
  },
  {
    match: /^\/(bank|bank_pengumpulan|daftar_bank)/,
    permission: { menuId: 4, submenuId: 9 },
  },
  {
    match:
      /^\/(permohonan_bantuan|validasi_permohonan_bantuan|bakal_penerima_bantuan|program_kegiatan_bantuan|penetapan|surveyor|monev|pertanyaan-monev|urutan-monev|kriteria|syarat|target_distribusi|program_donasi|tab|wakalah)/,
    permission: { menuId: 2, submenuId: 3 },
  },
  {
    match:
      /^\/(riwayat_zakat|riwayat_infaq|riwayat_donasi|target_pengumpulan)/,
    permission: { menuId: 2, submenuId: 1 },
  },
  {
    match: /^\/(laporan_|rekap_)/,
    permission: { menuId: 5 },
  },
  {
    match:
      /^\/(download_excel_laporan_|tanda_tangan\/|asnaf_tahun\/|fn_asnaf|info_laporan_umum\/)/,
    permission: { menuId: 5 },
  },
  {
    match: /^\/beranda/,
    permission: { menuId: 1 },
  },
  {
    match: /^\/administrator/,
    permission: { menuId: 1 },
  },
  {
    match: /^\/kegiatan_kesekretariatan/,
    permission: { menuId: 2, submenuId: 4 },
  },
  {
    match: /^\/riwayat_pesan_whatsapp/,
    permission: { menuId: 6, submenuId: 19 },
  },
  {
    match: /^\/(running_text|image\/logo)/,
    permission: { menuId: 6, submenuId: 18 },
  },
  {
    match: /^\/system_log/,
    permission: { menuId: 6, submenuId: 20 },
  },
];

const memberRoutePrefixes = [
  "/zakat_member",
  "/infaq_member",
  "/donasi_member",
  "/permohonan_member",
  "/permohonan_bantuan_member",
  "/riwayat_permohonan_member",
  "/program_bantuan_member",
  "/member_area",
];

const memberSelfProfilePaths = new Set([
  "/auth/member/edit_profile_member",
  "/auth/member/get_info_edit_profile_member",
]);

const administratorSelfProfilePaths = new Set([
  "/auth/administrator/edit_profile",
  "/auth/administrator/get_info_edit_profile",
]);

const publicPostPaths = new Set([
  "/auth/login_member",
  "/auth/login_administrator",
  "/auth/administrator/refresh",
  "/auth/member/refresh",
  "/auth/member/logout",
  "/auth/administrator/logout",
  "/send_otp",
  "/register",
  "/register/daftar_desa",
  "/survey_lapangan/session",
  "/survey_lapangan/info",
  "/survey_lapangan/info_member",
  "/survey_lapangan/submit",
]);

const publicGetPaths = new Set([
  "/register/daftar_kecamatan",
  "/running_text/active",
  "/running_text/speed",
]);

function normalizeRoutePath(value) {
  const pathname = String(value || "/").split("?")[0];
  const withLeadingSlash = pathname.startsWith("/") ? pathname : `/${pathname}`;
  const withoutTrailingSlash = withLeadingSlash.replace(/\/+$/, "") || "/";
  return withoutTrailingSlash.toLowerCase();
}

function getRoutePolicy(method, path) {
  const normalizedMethod = String(method || "").toUpperCase();
  const normalizedPath = normalizeRoutePath(path);
  const isPublic =
    (normalizedMethod === "POST" && publicPostPaths.has(normalizedPath)) ||
    (normalizedMethod === "GET" && publicGetPaths.has(normalizedPath));

  if (isPublic) {
    return {
      access: "public-or-capability",
      permission: null,
      normalizedPath,
    };
  }

  if (normalizedPath.startsWith("/documents/")) {
    return {
      access: "document-owner-or-capability",
      permission: { recordScope: true },
      normalizedPath,
    };
  }

  if (
    memberSelfProfilePaths.has(normalizedPath) ||
    memberRoutePrefixes.some((prefix) => normalizedPath.startsWith(prefix))
  ) {
    return {
      access: "member",
      permission: { ownerScope: true },
      normalizedPath,
    };
  }

  if (administratorSelfProfilePaths.has(normalizedPath)) {
    return {
      access: "admin",
      permission: null,
      authOnly: true,
      normalizedPath,
    };
  }

  const rule = permissionRules.find(({ match }) => match.test(normalizedPath));
  if (rule) {
    return {
      access: "admin",
      permission: rule.permission,
      normalizedPath,
    };
  }

  return { access: "unmapped", permission: null, normalizedPath };
}

module.exports = {
  permissionRules,
  memberRoutePrefixes,
  memberSelfProfilePaths,
  administratorSelfProfilePaths,
  publicPostPaths,
  publicGetPaths,
  normalizeRoutePath,
  getRoutePolicy,
};
