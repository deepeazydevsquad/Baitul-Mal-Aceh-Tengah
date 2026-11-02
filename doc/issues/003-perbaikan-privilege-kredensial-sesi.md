# Issue 003 — Privilege admin, kredensial, identitas, dan sesi

- Status: IMPLEMENTED LOCALLY — siap review.
- Prioritas: TINGGI / P1.
- Tanggal: 2026-11-02.
- Pendahulu: Issue 001 dan 002.

## Temuan yang ditutup

| ID | Tingkat | Temuan | Perbaikan |
| --- | --- | --- | --- |
| SEC-11 | Tinggi | Pengelola pengguna dapat mereset password akun setara/lebih tinggi. | Hierarki permission diterapkan. Admin non-super hanya dapat mengelola grup dengan permission subset ketat; grup `1` hanya untuk superadmin. |
| SEC-12 | Tinggi | Pengelola grup dapat menambah permission ke grupnya sendiri, mengubah grup `1`, atau menghapus grup superadmin. | Perubahan privilege sendiri dan pengelolaan privilege setara/lebih tinggi ditolak. Grup `1` tidak dapat dihapus. Grup yang masih memiliki pengguna tidak dapat dihapus. |
| SEC-13 | Tinggi | Kredensial WhatsApp masuk log dan URL klien. | API/device key tidak lagi dicetak, dikembalikan mentah, atau ditempel pada URL QR klien. QR diproksikan server sebagai data gambar; pengiriman memakai body POST. |
| SEC-14 | Tinggi | Refresh token tersimpan di `localStorage`. | Refresh token dipindahkan ke cookie `HttpOnly`, `SameSite=Strict`, `Secure` di production. Access token hanya berada di memori browser. |
| SEC-15 | Sedang | Reuse refresh token tidak mencabut session family. | Replay refresh token sekarang mencabut session terkait. |
| SEC-16 | Sedang | Username tidak unik dan approval request dapat diulang. | Validasi username registrasi, unique index `Users`/`Members`, lock request, cek idempotensi, dan konflik username saat approval. |
| SEC-17 | Sedang | Validasi self-profile administrator mempercayai `body.id`. | Validasi username self-profile selalu memakai ID principal terautentikasi. |
| SEC-18 | Sedang | Kredensial database statis terdapat pada file tracked. | `server/config/config.json` berisi password statis dihapus; runtime tetap menggunakan environment. |
| SEC-19 | Sedang | Rate limit per proses mudah dibanjiri dan phpMyAdmin terbuka ke semua interface. | Batas IP dan akun ditambahkan, kapasitas map dibatasi, serta port phpMyAdmin di-bind ke `127.0.0.1`. |
| SEC-20 | Sedang | Pagination tanpa batas atas. | `perpage`/`pageSize` dibatasi maksimum 100 dan nomor halaman dinormalisasi. |
| SEC-21 | Tinggi | Jalur delete pengguna belum memakai hierarki permission. | Delete sekarang memakai pemeriksaan target dan permission yang sama dengan update. |
| SEC-22 | Sedang | List/detail akun dan grup membocorkan privilege setara/lebih tinggi. | Read scope dibatasi ke grup sendiri dan permission subset ketat. |
| SEC-23 | Sedang | Login rentan login CSRF karena menerima form-urlencoded dan memasang cookie. | Origin/Referer/Fetch-Site guard diterapkan sebelum rate limiter dan handler login/refresh/logout. |
| SEC-24 | Sedang | Rate limit hanya berlaku per proses. | Counter login/OTP dipindahkan ke tabel `login_rate_limits` dengan update atomik. |
| SEC-25 | Sedang | Password member minimum enam karakter dan password umum diterima. | Password member minimum 8 karakter, admin minimum 12, serta daftar password umum ditolak. |
| SEC-26 | Sedang | Body request berisi PII dicetak ke log. | Log body/WhatsApp sensitif dihapus dan verbose log dinonaktifkan pada production. |
| SEC-27 | Sedang | Produksi memakai mode development, HTTP langsung, tanpa reverse proxy/header. | Compose produksi memakai Node production, cookie Secure path `/api/auth`, port hanya localhost, Apache reverse proxy `/api`, CSP/HSTS/Permissions Policy, dan trust proxy hop terbatas. |
| SEC-28 | Kritis | Seeder admin/member memakai password default yang mudah ditebak. | Seeder mewajibkan password dari environment, username seed dibuat unik, dan migration menonaktifkan akun lama yang masih memakai hash default. |
| SEC-29 | Tinggi | CSRF origin guard dapat dilewati dengan trailing slash. | Path guard dinormalisasi sama seperti router/route policy dan diuji untuk trailing slash. |
| SEC-30 | Sedang | Pemeriksaan hierarki pengguna tidak mengunci baris grup/user sehingga rentan TOCTOU. | Akun, grup aktor, grup target, dan grup tujuan dikunci dalam urutan ID stabil. |
| SEC-31 | Rendah | Response API dicetak ke console browser. | Verbose browser log dinonaktifkan pada build production; log server production juga dibatasi. |

## Verifikasi

- `npm.cmd test -- --runInBand` di `server`: **19 suite, 118 tes lulus**.
- Tes baru mencakup takeover/hapus/read akun administrator, self privilege escalation, penghapusan grup istimewa, approval ganda, konflik username, replay refresh token, cookie `HttpOnly`, batas pagination, CSRF origin termasuk trailing slash, password policy, rate limit database, password seed default, dan row lock hierarki.
- `docker compose -f docker-compose.yml config --no-interpolate`: valid.
- `npm.cmd run build` terakhir di `client`: berhasil, **1.816 modul**.
- `npm.cmd run type-check`: tetap gagal hanya pada error parser lama `src/modules/template_table.vue:53`, tidak menunjuk file Issue 003.
- `node --check` untuk helper, model, controller, router, migration, dan `app.js` yang berubah: lulus.
- `git diff --check`: tidak ada whitespace error; hanya peringatan konversi LF/CRLF dari Git.

## Deployment wajib

1. Backup database, lalu jalankan `npx sequelize-cli db:migrate` untuk membuat username unik, mengganti nama duplikat lama secara deterministik, dan membuat tabel rate limit login.
2. Migration `20261102150000-disable-legacy-default-passwords.js` menonaktifkan akun lama yang masih memakai hash default. Reset akun terkontrol memakai `scripts/reset-account-password.js` melalui environment, bukan argumen shell.
3. Isi `SEED_ADMIN_PASSWORD`, `SEED_BENDAHARA_PASSWORD`, dan `SEED_MEMBER_PASSWORD` hanya pada lingkungan seed. Seeder gagal bila nilainya kosong.
4. Rotasi WAPISender API/device key dan password database karena nilai lama pernah berada di source/log.
5. Pasang TLS termination di host reverse proxy menuju `127.0.0.1:8089`. Apache container meneruskan `/api` ke server; cookie memakai path `/api/auth`.
6. Set `CORS_ORIGINS` ke origin HTTPS frontend final. `TRUST_PROXY=1` hanya aman karena port server tidak lagi diekspos ke host.
7. Invalidasi seluruh session lama saat deploy karena frontend tidak lagi mengirim refresh token melalui body.
8. Jalankan smoke test login admin/member, refresh setelah reload, logout, CSRF origin, pengelolaan pengguna/grup, dan pengaturan WhatsApp.
