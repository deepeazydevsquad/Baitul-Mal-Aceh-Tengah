# Deployment dan Rotasi Keamanan

## Konfigurasi wajib

Server sekarang gagal start jika salah satu konfigurasi berikut kosong, kurang
dari 32 karakter, atau memakai nilai yang sama:

- `ADMINISTRATOR_SECRET_KEY`
- `ADMINISTRATOR_REFRESH_SECRET_KEY`
- `MEMBERSHIP_SECRET_KEY`
- `MEMBERSHIP_REFRESH_SECRET_KEY`
- `OTP_HASH_SECRET`

Isi juga `CORS_ORIGINS` dengan origin frontend HTTPS yang eksplisit. Compose
production memakai `TRUST_PROXY=1` karena server tidak mengekspos port ke host
dan hanya dapat dijangkau melalui Apache reverse proxy. Jangan memakai
`TRUST_PROXY=true` pada service yang masih dapat diakses langsung. Contoh nama
variabel tanpa nilai tersedia di `server/.env.example`.

Password seeder tidak memiliki fallback. Seeder admin/member gagal jika
`SEED_ADMIN_PASSWORD`, `SEED_BENDAHARA_PASSWORD`, atau
`SEED_MEMBER_PASSWORDS` tidak diisi. `SEED_MEMBER_PASSWORDS` harus berupa JSON
object yang memetakan setiap username member ke password unik minimal 12
karakter.

## Urutan rotasi production

1. Siapkan lima secret baru melalui secret manager. Jangan mencetaknya ke log,
   issue, shell history, atau chat.
2. Backup database dan verifikasi prosedur restore.
3. Jalankan migration pada database teruji. Deployment Compose memakai image
   migrasi terpisah:

   ```text
   docker compose up -d mysql
   docker compose --profile tools run --rm migrate
   ```

   Untuk pengembangan lokal, migration juga dapat dijalankan dari `server`
   dengan `npx sequelize-cli db:migrate`. Deployment production tidak boleh
   menjalankan `db:seed:all` otomatis dan tidak boleh membuat ulang database.

4. Pasang konfigurasi secret baru dan origin CORS di deployment.
5. Restart hanya service backend dan frontend yang membutuhkan konfigurasi.
6. Karena token lama tidak memiliki klaim `principal_type`, `token_type`,
   `sid`, dan `jti`, semua sesi lama otomatis ditolak. Minta pengguna login ulang;
   refresh token kunci lama juga tidak akan lolos verifikasi.
7. Verifikasi login/refresh admin dan member, penolakan token lintas principal,
   izin grup terbatas, OTP valid/salah, akses dokumen privat, dan logo publik.
8. Pantau 401/403/429 serta error provider OTP selama periode observasi.

Jangan rollback ke kunci yang pernah bocor. Jika perubahan aplikasi harus
di-rollback, tetap gunakan secret baru yang sudah dirotasi.

## Migration dan rollback database

Migration `20261102090000-secure-auth-and-otp.js`:

- membuat tabel `Auth_sessions` untuk pencabutan sesi dan rotasi refresh token;
- mengubah kolom `Otps.otp` menjadi verifier string;
- menambah `otp_salt`, `purpose`, dan `attempts`;
- menandai seluruh OTP lama sebagai sudah digunakan.

Migrations keamanan tambahan:

- `20261102130000-enforce-unique-account-usernames.js` menangani duplikat
  username lama dan memasang unique index.
- `20261102140000-create-login-rate-limit.js` membuat counter rate limit
  login/OTP lintas instance.
- `20261102150000-disable-legacy-default-passwords.js` menonaktifkan akun yang
  masih memakai hash password default seeder lama dan mencabut session akun
  tersebut.
- `20261102160000-enforce-unique-member-nik.js` menormalisasi NIK, menghentikan
  migration jika masih ada duplikat, lalu memasang unique index
  `members_nomor_ktp_unique`. Migration tidak menggabungkan atau menghapus
  member otomatis; daftar ID konflik harus diselesaikan secara manual.

Production tidak lagi menjalankan `sequelize.sync()`. Server memverifikasi
koneksi dan tabel wajib setelah migration. Startup harus gagal, bukan membuat
atau mengubah schema otomatis, jika tabel keamanan belum tersedia. Development
dan test tetap boleh memakai sync untuk membantu workflow lokal.

Setelah migration terakhir, akun yang terdampak harus direset secara
terkontrol. Gunakan variabel environment, jangan argumen command line:

```text
RESET_PRINCIPAL_TYPE=administrator RESET_USERNAME=admin RESET_PASSWORD='...' node scripts/reset-account-password.js
```

Jangan menyimpan password reset di dokumentasi, log, atau shell history.

## Upgrade MySQL 5.7 ke 8.4

Jangan menggunakan kembali volume data MySQL 5.7 secara langsung untuk container
MySQL 8.4. Lakukan:

1. Backup logis dan fisik; verifikasi restore pada instance terpisah.
2. Hentikan penulisan aplikasi.
3. Buat logical dump dari MySQL 5.7.
4. Siapkan volume MySQL 8.4 baru dengan `lower_case_table_names=1` sejak
   inisialisasi.
5. Import dump ke MySQL 8.4.
6. Jalankan migration aplikasi dan smoke test query/transaksi.
7. Ganti koneksi aplikasi setelah verifikasi.

Rollback dilakukan dengan mengembalikan aplikasi ke instance/volume 5.7 yang
masih utuh atau restore backup terverifikasi. Jangan downgrade volume 8.4.

Migrasi tidak menghapus record permohonan, member, pembayaran, atau file unggahan.
Rollback schema tersedia melalui `npx sequelize-cli db:migrate:undo`, tetapi
rollback aplikasi tidak boleh mengaktifkan kembali secret yang bocor atau OTP
lama. Restore database hanya dilakukan dari backup yang sudah diverifikasi.

Dokumen privat tidak dipindahkan. Static serving sekarang hanya dibuka untuk
folder publik eksplisit di `server/app.js`; dokumen lama tetap berada di lokasi
storage yang sama dan dibaca lewat route berizin `/documents/...`.

## Reverse proxy dan batas operasional

- Port server production tidak dipublikasikan ke host. Apache pada container
  client meneruskan `/api` ke server dan cookie refresh memakai path
  `/api/auth`.
- Host wajib menyediakan TLS termination menuju `127.0.0.1:8089`. Cookie
  `Secure`, HSTS, dan pemeriksaan origin mengandalkan topologi HTTPS tersebut.
- Rate limit login dan endpoint OTP disimpan di database sehingga berlaku
  lintas replica.
- Rotasi kunci tidak dapat menghapus kebocoran dari riwayat Git. Jika repository
  publik atau kunci production pernah terekspos, anggap kunci tersebut
  compromised dan rotasi segera. Penulisan ulang riwayat Git harus dilakukan
  sebagai operasi terkoordinasi setelah semua clone/deployment diketahui.
- File publik lama yang tidak termasuk daftar folder publik tidak lagi dapat
  diakses langsung. Gunakan route dokumen privat untuk preview/download.

## Image, capability survei, dan health check

- `server/.dockerignore` dan `client/.dockerignore` mengecualikan `.env` dari
  build context. Secret runtime harus diberikan oleh secret manager atau
  environment deployment. File `.env` yang pernah masuk image/cache lama tetap
  wajib dianggap bocor dan harus dirotasi.
- Base image Node, MySQL, dan phpMyAdmin dipin dengan digest immutable pada
  Dockerfile/Compose. Saat memperbarui digest, catat tanggal dan perubahan
  versi, lalu uji di staging sebelum production. Image aplikasi hasil build
  juga harus dipromosikan dengan digest, bukan tag mutable.
- Service server berjalan sebagai user `node`, memiliki `cap_drop: ALL`,
  `no-new-privileges`, filesystem read-only, dan volume tulis khusus
  `/apps/uploads` serta `/apps/logs`. Jangan menghapus volume upload saat
  rollback aplikasi.
- Health check server memakai `nc -z 127.0.0.1 3003`. Setelah deploy, verifikasi
  health check, login/refresh, endpoint `/survey_lapangan/session`, upload
  gambar/PDF, dan akses dokumen privat. Rollback aplikasi menggunakan image
  sebelumnya yang masih tersedia; restore database hanya dari backup yang
  sudah diverifikasi.
- Access code survei ditukar melalui `POST /survey_lapangan/session` menjadi
  cookie `survey_capability` ber-HttpOnly, SameSite Strict, Secure di
  production, dan TTL 8 jam. Frontend harus menghapus `?code` atau `#code=...`
  dari address bar setelah pertukaran. Jangan menaruh access code di
  localStorage, query dokumen, atau log.

## Advisory dependency yang tersisa

Audit production backend setelah pembaruan tidak lagi memuat advisory
critical/high. Advisory moderate yang masih dilaporkan berasal dari rantai
`exceljs`/`sequelize` (termasuk util arsip dan UUID) dan tidak memiliki rilis
kompatibel yang lebih baru. Mitigasinya: nama file laporan dibuat server,
input pola glob tidak diterima dari pengguna, dan laporan hanya diproses oleh
route administrator berizin.

Audit client juga tidak lagi memuat advisory critical/high. Advisory low dan
moderate tersisa terutama dari CKEditor predefined build dan utilitas
transitif. Editor hanya tersedia pada route administrator berizin; konten
harus diperlakukan sebagai HTML tidak tepercaya dan disanitasi sebelum
ditampilkan. Advisory harus ditinjau kembali saat upstream merilis build
kompatibel. `npm audit fix --force` tidak boleh dipakai untuk downgrade major.
