# Issue 004 — Session default account, endpoint publik, superadmin terakhir, dan deployment

- Nomor issue: **004**
- Status: **IMPLEMENTED LOCALLY — siap review**
- Prioritas: **TINGGI / P1**
- Tanggal audit: 2026-11-02
- Pendahulu:
  - [Issue 001](001-perbaikan-keamanan-endpoint.md)
  - [Issue 002](002-perbaikan-bypass-izin-xss-dan-upload-survei.md)
  - [Issue 003](003-perbaikan-privilege-kredensial-sesi.md)
- Lingkup: backend Express, frontend Vue, migration, seeder, script operasional, Docker Compose, dan dokumentasi deployment.

## 1. Instruksi utama untuk AI pelaksana

1. Langsung kerjakan issue ini sampai seluruh bagian implementasi lokal selesai. Jangan berhenti pada analisis atau rencana.
2. Jangan terlalu banyak bertanya. Tanya hanya jika:
   - akan mengubah database production;
   - akan menghapus atau menulis ulang riwayat Git;
   - akan merotasi credential production;
   - ada konflik perubahan pengguna yang tidak dapat diselesaikan dengan aman.
3. Semua path di issue ini relatif terhadap root repository.
4. Workspace memiliki banyak perubahan belum di-commit. Jangan reset, stash-drop, checkout paksa, atau menimpa perubahan pengguna.
5. Telusuri `route -> middleware -> validator -> controller -> model -> migration/script` sebelum mengubah kode.
6. Gunakan dependency dan pola yang sudah ada. Jangan menambahkan Redis, framework baru, atau layanan eksternal untuk rate limit karena tabel database sudah tersedia.
7. Gunakan data sintetis. Jangan:
   - menjalankan migration pada database production;
   - mengirim WhatsApp;
   - memakai kredensial asli;
   - mencetak password, token, OTP, API key, atau PII ke output;
   - melakukan deployment.
8. Mulai dari baseline saat ini:
   - backend: 19 suite, 118 tes lulus;
   - build frontend terakhir berhasil;
   - type-check masih gagal karena parser lama `client/src/modules/template_table.vue:53`.
9. Boleh jalankan tes terarah selama implementasi. Setelah semua perubahan backend selesai, jalankan satu kali suite backend penuh:

   ```text
   npm.cmd test -- --runInBand
   ```

10. **JANGAN build frontend sebelum semua perubahan frontend selesai.**
11. Setelah semua perubahan selesai, tes lulus, dan diff sudah diperiksa, jalankan build frontend **tepat satu kali**:

    ```text
    npm.cmd run build
    ```

12. Jangan menjalankan dua atau tiga build, jangan menjalankan `build-only` setelah `build`, dan jangan melakukan Docker build sebagai build tambahan.
13. Jika satu build final gagal, perbaiki penyebab yang dapat dibuktikan menggunakan pemeriksaan terarah. Jangan melakukan build kedua dalam issue ini. Laporkan bahwa build setelah perbaikan terakhir belum diverifikasi.
14. Jangan menjalankan auto-fix lint untuk seluruh repository.
15. Perbarui bagian progres di akhir issue setelah selesai dengan hasil tes, build, migration, dan pekerjaan eksternal yang tersisa.

## 2. Ringkasan temuan

| ID | Tingkat | Temuan | Akibat |
| --- | --- | --- | --- |
| SEC-32 | Tinggi | Password default dinonaktifkan, tetapi session lama tidak dicabut | Access/refresh token lama tetap berlaku |
| SEC-33 | Sedang | Konflik username register diperiksa sebelum OTP valid | Username dapat dienumerasi tanpa OTP |
| SEC-34 | Sedang | `/register` dan endpoint refresh belum dibatasi | Public endpoint dapat dipakai untuk DoS database/CPU |
| SEC-35 | Sedang | Superadmin terakhir dapat menurunkan dirinya sendiri | Sistem dapat kehilangan seluruh superadmin |
| SEC-36 | Rendah-sedang | Respons QR WhatsApp tidak selalu `no-store` | QR pairing dapat tersimpan di cache |
| SEC-37 | Sedang | MySQL 5.7 sudah EOL dan image phpMyAdmin memakai tag mutable | Tidak ada security update dan build tidak reproducible |
| SEC-38 | Rendah | Semua akun member seeder memakai satu password | Kompromi satu akun dummy membuka akun dummy lain |
| SEC-39 | Rendah | Banyak `console.log(response/body)` masih ada di source | PII dapat terlihat di console pada lingkungan non-production |

## 3. Step 1 — Baseline dan pemetaan pemanggil

1. Baca:
   - `server/app.js`
   - `server/helper/rateLimitHelper.js`
   - `server/helper/tokenHelper.js`
   - `server/middleware/requestOrigin.js`
   - `server/modules/register/models/model_cud.js`
   - `server/validation/register.js`
   - `server/router/router_register.js`
   - `server/router/router_auth.js`
   - kedua controller login/member
   - `server/modules/daftar_pengguna/models/model_cud.js`
   - `server/migrations/20261102150000-disable-legacy-default-passwords.js`
   - `server/scripts/reset-account-password.js`
   - `server/seeders/*`
   - `docker-compose.yml`
   - `mysql_config/my.cnf`
   - `doc/security/deployment-security.md`
2. Cari pemanggil `revokeAllSessions`, `Auth_session.update`, `disable-legacy-default`, `reset-account-password`, dan `createPersistentRateLimiter`.
3. Catat file yang akan diubah.
4. Jangan jalankan server utama karena startup memanggil `sequelize.sync()`.
5. Jangan menganggap route mapping atau 118 tes saat ini membuktikan temuan di issue ini sudah tertutup.

## 4. Step 2 — Cabut session saat akun default dinonaktifkan

### Akar masalah

`server/migrations/20261102150000-disable-legacy-default-passwords.js` mengganti password akun default, tetapi tidak mencabut `Auth_sessions`. Script reset juga mengganti password tanpa revoke session.

Saat access token berumur 15 menit dan refresh token berumur tujuh hari, attacker yang sudah memiliki token lama dapat terus memakai akun tersebut.

### Implementasi migration

1. Sebelum update password, ambil ID akun yang memakai hash default:

   ```text
   SELECT id FROM Users
   WHERE password IN (legacyAdminHash, legacyMemberHash)
   ```

   Lakukan hal yang sama untuk tabel `Members`.
2. Ganti seluruh password default dalam transaction migration.
3. Cabut session berdasarkan ID yang sudah diambil:

   - `principal_type = 'administrator'` untuk `Users`;
   - `principal_type = 'member'` untuk `Members`.
4. Gunakan satu waktu server yang sama untuk password/revoke.
5. Jangan mengandalkan query `JOIN` setelah password diganti karena hash lama dapat sudah tidak dapat diidentifikasi.
6. Jangan membuat rollback yang mengaktifkan kembali password default.
7. Jika migration ini sudah pernah diterapkan pada database test, buat migration follow-up yang dokumentasinya jelas. Jangan mengedit migration yang sudah tercatat sebagai applied di database test tanpa prosedur khusus.

### Implementasi reset script

1. `server/scripts/reset-account-password.js` harus:
   - membuka transaction;
   - mencari akun berdasarkan username dengan `LOCK.UPDATE`;
   - memastikan tepat satu akun ditemukan;
   - update password;
   - mencabut semua `Auth_sessions` milik principal tersebut;
   - commit;
   - rollback pada semua kegagalan.
2. Output hanya boleh menyebut tipe principal dan username yang direset, bukan password.
3. Pastikan script menutup koneksi sequelize pada success maupun failure.

### Tes wajib

- Migration mengambil ID sebelum update.
- Session administrator dan member terdampak dicabut.
- Session akun dengan password yang tidak default tidak tersentuh.
- Reset script mencabut seluruh session akun target.
- Kegagalan update/revoke melakukan rollback.
- `down()` tidak mengaktifkan kembali kredensial default.

## 5. Step 3 — Hilangkan enumerasi username register

### Akar masalah

`server/router/router_register.js` memanggil `validation.check_username` sebelum OTP diverifikasi. Validator langsung query `Member` dan `Request_member`.

Request dengan OTP salah tetap dapat membedakan:

- username sudah ada;
- username belum ada;
- OTP salah.

### Implementasi

1. Di validator route register, hanya validasi format:
   - string;
   - trim;
   - panjang 3–100;
   - pola karakter yang disepakati.
2. Hapus query database username dari validator yang berjalan sebelum OTP.
3. Di `server/modules/register/models/model_cud.js`, cek konflik username hanya setelah:
   - record OTP ditemukan;
   - status OTP valid;
   - percobaan belum melewati batas;
   - verifier OTP berhasil;
   - username memenuhi format.
4. Lakukan query konflik di transaction yang sama dengan konsumsi OTP.
5. Respons konflik harus generik, misalnya:

   ```text
   Registrasi tidak dapat diproses.
   ```

   Jangan mengembalikan `USERNAME_CONFLICT` atau pesan “username sudah digunakan”.
6. OTP yang valid tetapi username konflik harus ditangani dengan kebijakan anti-enumerasi:
   - utamakan konsumsi OTP setelah verifier valid;
   - user harus meminta OTP baru untuk mencoba username lain;
   - kode error publik tidak boleh membedakan akun terdaftar dan request pending.
7. Jangan melakukan query `Member` atau `Request_member` sebelum OTP berhasil diverifikasi.

### Tes wajib

- OTP invalid/salah/kedaluwarsa tidak memicu query username.
- OTP valid dengan username konflik menghasilkan respons generik.
- OTP valid dengan username tersedia tetap membuat request.
- Dua request paralel tidak membuat dua request member untuk username yang sama.
- Response tidak mengungkap status ketersediaan username.

## 6. Step 4 — Rate limit register dan refresh

### Register

1. Tambahkan persistent limiter ke `POST /register` menggunakan `createPersistentRateLimiter`.
2. Gunakan batas IP yang wajar, misalnya 10 request per 15 menit.
3. Pasang limiter sebelum controller dan setelah body parser.
4. Jangan memakai rate limit sebagai pengganti validasi OTP.

### Refresh

1. Tambahkan limiter ke:
   - `POST /auth/administrator/refresh`
   - `POST /auth/member/refresh`
2. Batasi berdasarkan IP, misalnya 30 request per 15 menit.
3. Origin guard tetap harus berjalan sebelum limiter.
4. Jangan menambahkan limiter baru ke endpoint yang sudah memiliki limiter login berlapis.

### Tes wajib

- Request melewati batas menghasilkan 429.
- Handler register/refresh tidak dipanggil ketika 429.
- Limit disimpan di database, bukan `Map` proses.
- Request dengan origin tidak sah tetap 403 sebelum query rate limit.

## 7. Step 5 — Lindungi superadmin terakhir

### Akar masalah

`assertManageTarget` membolehkan superadmin mengubah grup akun sendiri. Jika tidak ada superadmin lain, sistem kehilangan seluruh akses grup `1`.

### Implementasi

1. Dalam transaction update pengguna, jika target saat ini berada di grup `1` dan grup tujuan bukan `1`:
   - lock akun-akun grup `1` dalam urutan ID stabil;
   - hitung superadmin lain;
   - tolak perubahan jika target adalah superadmin terakhir.
2. Aturan yang sama harus berlaku bila delete pengguna grup `1` dapat menyisakan nol superadmin.
3. Jangan hanya mengandalkan frontend.
4. Error harus memiliki status 409 atau 400 dan code stabil, misalnya `LAST_SUPERADMIN_PROTECTED`.
5. Pastikan perubahan grup superadmin biasa tetap diperbolehkan ketika masih ada superadmin lain.

### Tes wajib

- Superadmin terakhir tidak dapat menurunkan dirinya sendiri.
- Superadmin terakhir tidak dapat dihapus.
- Superadmin masih dapat diturunkan/dihapus jika minimal satu superadmin tetap ada.
- Pemeriksaan menggunakan row lock dan tidak rentan dua demotion paralel.

## 8. Step 6 — `no-store` untuk QR dan pengaturan sensitif

1. Perluas middleware `Cache-Control` di `server/app.js` agar mencakup:
   - `/auth/*`
   - `/documents/*`
   - `/pengaturan_whatsapp/*`
   - endpoint lain yang mengembalikan pairing code, token, API key metadata, atau PII.
2. Pastikan respons QR pairing memiliki:

   ```text
   Cache-Control: no-store
   Pragma: no-cache
   ```

3. Jangan menambahkan header tersebut ke aset publik statis.
4. Tes response `/pengaturan_whatsapp/start` atau controller dengan mock provider dan pastikan header ada.

## 9. Step 7 — Upgrade database dan pin image

### MySQL

1. Ganti `mysql:5.7` dengan MySQL LTS yang masih didukung, targetkan `mysql:8.4`.
2. Sesuaikan `mysql_config/my.cnf`:
   - hapus opsi query cache yang sudah tidak ada di MySQL 8;
   - pertahankan `utf8mb4`, `utf8mb4_unicode_ci`, strict SQL mode, dan InnoDB settings yang valid;
   - verifikasi `lower_case_table_names=1` sebelum membuat volume baru.
3. Jangan upgrade volume production secara in-place tanpa backup dan compatibility test.
4. Dokumentasikan:
   - backup;
   - uji restore;
   - MySQL 5.7 -> 8.4 upgrade path;
   - smoke test query/transaksi;
   - rollback melalui restore backup, bukan downgrade volume.

### phpMyAdmin dan image lain

1. Pin `phpmyadmin/phpmyadmin` ke versi yang diuji, bukan tag mutable `latest`.
2. Pertimbangkan menghapus phpMyAdmin dari Compose production; port localhost bukan pengganti patch management.
3. Pin image Node/httpd produksi ke versi atau digest yang disetujui.
4. Jangan melakukan pull/build image sebagai bagian tes issue ini jika membutuhkan network tanpa izin.

### Tes/metadata

- `docker compose -f docker-compose.yml config --no-interpolate` harus valid.
- Pastikan port server tidak kembali diekspos ke host.
- Pastikan client tetap hanya bind ke `127.0.0.1`.
- Dokumentasikan compatibility check dan jangan mengklaim migration production dijalankan.

## 10. Step 8 — Password unik untuk akun seed

1. Jangan memakai satu `SEED_MEMBER_PASSWORD` untuk seluruh akun dummy.
2. Gunakan salah satu:
   - map environment `SEED_MEMBER_PASSWORDS` berbentuk JSON `{username: password}`;
   - password unik yang dihasilkan dan disimpan di secret manager;
   - seeder yang dibatasi hanya untuk environment test dan tidak pernah dijalankan di production.
3. Validasi bahwa jumlah password sesuai jumlah akun.
4. Jangan mencetak password atau hash ke console.
5. Test seeder tanpa map harus gagal sebelum `bulkInsert`.

## 11. Step 9 — Bersihkan log sensitif yang tersisa

1. Cari:

   ```text
   console.log(response)
   console.log(body)
   console.log("Body:", ...)
   console.log("Data dikirim ke backend:", ...)
   ```

2. Hapus log response/body yang tidak diperlukan dari:
   - form admin/member;
   - form group access;
   - riwayat transaksi;
   - permohonan dan penetapan;
   - model server yang masih mencetak body request.
3. Retain hanya log operasional tanpa PII.
4. Production suppression yang sudah ada tetap dipertahankan.
5. Jangan melakukan auto-fix lint seluruh repository.

## 12. Step 10 — Verifikasi dan SATU build final

1. Jalankan tes terarah selama implementasi.
2. Setelah backend selesai, jalankan satu kali:

   ```text
   npm.cmd test -- --runInBand
   ```

3. Jalankan `node --check` pada file JS backend yang berubah.
4. Jalankan `git diff --check`.
5. Jalankan `npm.cmd run type-check` satu kali. Jika tetap gagal hanya pada parser lama `template_table.vue`, catat batas tersebut; jangan mengklaim type-check lulus.
6. Setelah seluruh perubahan frontend selesai, jalankan **tepat satu kali**:

   ```text
   npm.cmd run build
   ```

7. Jangan menjalankan build lain setelahnya.
8. Jangan melakukan Docker build sebagai build tambahan.
9. Periksa diff akhir untuk memastikan tidak ada secret atau PII baru.

## 13. Kriteria penerimaan

- [x] Session lama dari akun password default dicabut oleh migration.
- [x] Reset script mencabut seluruh session akun target secara transaksional.
- [x] Query username register tidak berjalan sebelum OTP valid.
- [x] Respons konflik username register tidak memungkinkan enumerasi.
- [x] Register dan refresh memiliki persistent rate limiter.
- [x] Superadmin terakhir tidak dapat didemosi atau dihapus.
- [x] Respons QR/pengaturan sensitif memakai `Cache-Control: no-store`.
- [x] MySQL dinaikkan ke versi yang masih didukung dan konfigurasi disesuaikan.
- [x] Image produksi dipin ke versi yang disetujui.
- [x] Akun seed member memakai password unik atau seeder production dilarang.
- [x] Log response/body sensitif yang ditemukan dibersihkan.
- [x] Tes negatif dan positif lulus.
- [x] Build frontend dijalankan tepat satu kali di akhir.
- [x] Progres dan pekerjaan eksternal dicatat jujur.

## 14. Pekerjaan operasional yang tidak boleh diklaim selesai tanpa bukti

1. Menjalankan migration pada database production.
2. Merotasi password database dan WAPISender.
3. Menjalankan reset akun terdampak di production.
4. Invalidasi seluruh session production.
5. Menulis ulang riwayat Git.
6. Upgrade database production.
7. Deploy image baru.
8. Smoke test TLS/reverse proxy production.

Penulisan ulang riwayat Git harus dikoordinasikan dan memerlukan otorisasi eksplisit. Jangan menjalankan `git filter-repo`, reset, atau force-push hanya karena issue ini.

## 15. Progres implementasi

Isi setelah implementasi selesai. Jangan menandai selesai berdasarkan perubahan kode saja.

| Bagian | Status | Bukti / catatan |
| --- | --- | --- |
| SEC-32 session default account | Selesai lokal | Migration mengumpulkan principal ID sebelum mengganti password, lalu mencabut `Auth_sessions`; reset script memakai transaction, row lock, update, dan revoke. |
| SEC-33 register enumeration | Selesai lokal | Validasi username hanya format; query konflik dijalankan model setelah OTP valid; respons konflik generik dan OTP dikonsumsi. |
| SEC-34 rate limit register/refresh | Selesai lokal | Register/IP dan dua endpoint refresh memakai `createPersistentRateLimiter`. |
| SEC-35 superadmin terakhir | Selesai lokal | Operasi user mengunci daftar superadmin lebih dulu dan menolak demosi/delete yang menyisakan nol superadmin. |
| SEC-36 QR no-store | Selesai lokal | Prefix `/pengaturan_whatsapp/` dan `/pengaturan_umum/` memakai `no-store`; diuji dari HTTP boundary. |
| SEC-37 MySQL/image upgrade | Selesai lokal | Compose memakai MySQL 8.4, phpMyAdmin 5.2.2, Node/httpd versioned; query-cache lama dihapus. Upgrade production belum dijalankan. |
| SEC-38 seed password unik | Selesai lokal | `SEED_MEMBER_PASSWORDS` berupa map JSON per username, username unik, password unik minimal 12 karakter. |
| SEC-39 log sensitif | Selesai lokal | `console.log(response/body)` mekanis dihapus pada 35 file; suppression production tetap aktif. |
| Tes backend penuh | Lulus | `npm.cmd test -- --runInBand`: 21 suite, 124 tes lulus. |
| Type-check | Gagal pada error lama | `src/modules/template_table.vue(53,3): TS1131`; tidak menunjuk file Issue 004. |
| Build frontend | Sukses; jumlah 1 | `npm.cmd run build`: 1816 modul, selesai 35,52 detik. |
| Migration production | Tidak dilakukan | Pekerjaan operasional |
| Rotasi/deploy | Tidak dilakukan | Pekerjaan operasional |
