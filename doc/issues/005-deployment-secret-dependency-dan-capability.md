# Issue 005 — Secret image, dependency, identitas, dan capability survei

- Nomor issue: **005**
- Status: **IMPLEMENTED LOKAL; OPERASI PRODUCTION BELUM DIJALANKAN**
- Prioritas: **KRITIS / P0 untuk secret image; TINGGI untuk dependency dan DoS**
- Tanggal audit: 2026-11-02
- Pendahulu:
  - [Issue 001](001-perbaikan-keamanan-endpoint.md)
  - [Issue 002](002-perbaikan-bypass-izin-xss-dan-upload-survei.md)
  - [Issue 003](003-perbaikan-privilege-kredensial-sesi.md)
  - [Issue 004](004-perbaikan-session-endpoint-dan-deployment.md)
- Lingkup: Docker/build context, dependency produksi, registrasi/identitas member, capability survei, deployment runtime, script operasional, dan dokumentasi.

## 1. Instruksi wajib untuk AI pelaksana

1. Langsung kerjakan issue ini sampai seluruh implementasi lokal selesai. Jangan berhenti pada analisis atau rencana.
2. **Jangan terlalu banyak bertanya.** Gunakan keputusan paling aman yang konsisten dengan kode dan issue ini.
3. Tanya hanya jika:
   - akan merotasi secret production;
   - akan mengubah database production;
   - akan menghapus/menulis ulang riwayat Git;
   - ada perubahan pengguna yang bertabrakan dan tidak dapat dipertahankan;
   - upgrade dependency memerlukan keputusan bisnis yang tidak dapat disimpulkan.
4. Workspace memiliki banyak perubahan belum di-commit. Jangan reset, checkout paksa, stash-drop, atau menimpa perubahan pengguna.
5. Semua path relatif terhadap root repository.
6. Telusuri `Dockerfile -> build context -> runtime`, `package.json -> lockfile -> import`, `route -> middleware -> validator -> upload -> model`, dan `frontend input -> API -> capability storage`.
7. Gunakan data sintetis. Jangan:
   - mencetak secret;
   - mengirim WhatsApp asli;
   - menjalankan upload ke folder aplikasi utama untuk tes;
   - melakukan deployment;
   - menjalankan migration/upgrade database production.
8. Baseline saat issue dibuat:
   - backend: 21 suite, 124 tes lulus;
   - build frontend terakhir berhasil;
   - type-check masih gagal karena parser lama `client/src/modules/template_table.vue:53`.
9. Boleh jalankan tes terarah selama implementasi.
10. Setelah semua perubahan backend selesai, jalankan satu kali:

    ```text
    npm.cmd test -- --runInBand
    ```

11. **Jangan build frontend sebelum seluruh perubahan frontend selesai.**
12. Setelah semua perubahan selesai dan tes lulus, jalankan build frontend **tepat satu kali**:

    ```text
    npm.cmd run build
    ```

13. Jangan menjalankan build tambahan, `build-only` setelah `build`, atau Docker build sebagai build verifikasi tambahan.
14. Jika build final gagal, perbaiki hanya penyebab yang dapat dibuktikan dengan pemeriksaan terarah. Jangan jalankan build kedua dalam issue ini; laporkan batas verifikasinya.
15. Jangan menjalankan auto-fix lint/formatter untuk seluruh repository.
16. Perbarui tabel progres di akhir issue dengan hasil nyata.

## 2. Ringkasan temuan

| ID | Tingkat | Temuan | Dampak |
| --- | --- | --- | --- |
| SEC-40 | Kritis | `server/.env` ikut `COPY . .` ke image karena tidak ada `server/.dockerignore` | Secret aktif tersimpan dalam image/layer/cache |
| SEC-41 | Tinggi | Dependency produksi memiliki banyak advisory critical/high | RCE, DoS, IP spoofing, XSS, dan supply-chain exposure |
| SEC-42 | Tinggi | NIK member tidak unik | Satu orang dapat memiliki beberapa akun bantuan |
| SEC-43 | Tinggi | Upload survei publik diproses sebelum access code divalidasi | Public CPU/disk DoS tanpa capability |
| SEC-44 | Sedang | Access code survei berada di query URL dan access log | Capability dapat bocor ke operator log |
| SEC-45 | Tinggi | Runtime Node 20 sudah EOL | Tidak menerima patch keamanan |
| SEC-46 | Sedang | Seeder/reset password melewati policy password umum | Akun operasional dapat memakai password lemah |
| SEC-47 | Sedang | Build Docker memakai `npm install` dan mengunduh binary tanpa checksum | Build tidak reproducible dan supply-chain risk |
| SEC-48 | Sedang | Image diberi tag versi tetapi belum digest dan container server berjalan sebagai root | Mutable image dan blast radius container lebih besar |

## 3. Step 1 — Hilangkan secret dari build context Docker

### Akar masalah

- `server/.dockerignore` tidak ada.
- `server/.env` ada dan berisi nilai aktif membership/OTP.
- `server/Dockerfile` menjalankan `COPY . .`.

### Implementasi

1. Buat `server/.dockerignore`.
2. Minimal mengecualikan:

   ```text
   .env
   .env.*
   !.env.example
   node_modules
   test
   __tests__
   coverage
   uploads
   logs
   *.log
   .git
   .gitignore
   Dockerfile
   Dockerfile.*
   ```

3. Pastikan `.env.example` tidak berisi nilai secret.
4. Periksa `client/.dockerignore`; tambahkan `.env*` tetapi pertahankan env build-time yang memang dibutuhkan jika ada.
5. Jangan menyalin `.env` melalui `COPY`.
6. Secret runtime harus berasal dari environment/secret manager.
7. Tambahkan pemeriksaan CI/script yang gagal jika `.env` termasuk Docker build context.
8. Rotasi semua secret yang pernah masuk image atau cache:
   - membership access/refresh;
   - OTP hash;
   - WAPISender;
   - database.
9. Catat bahwa rotasi production adalah pekerjaan eksternal.

### Tes wajib

- Build context simulasi tidak memuat `.env`.
- File `.env.example` tetap tersedia.
- `.dockerignore` tidak mengecualikan source/model yang dibutuhkan.
- Tidak ada secret nyata dalam image manifest/daftar file.

## 4. Step 2 — Perbaiki dependency produksi

### Baseline audit

Jalankan:

```text
npm.cmd audit --omit=dev --json
```

Baseline audit saat issue dibuat:

- `server`: 53 vulnerability — 5 critical, 32 high, 16 moderate.
- `client`: 138 vulnerability — 4 critical, 49 high, 75 moderate, 10 low.

Contoh dependency relevan:

- Server `proxy-addr` melalui Express: IP spoofing/rate-limit bypass.
- Server `sharp`: memproses input gambar pengguna.
- Server `axios`: request provider eksternal.
- Server `request`: deprecated.
- Server `validator`, `tar`, `qs`.
- Client `ckeditor5`, `vue`, `vite`, `ws`.

### Implementasi

1. Simpan laporan audit ke file sementara di luar repository atau cukup catat jumlah/temuan pada progres; jangan commit output yang memuat URL/secret.
2. Prioritaskan **production runtime direct dependency**:
   - Express/proxy-addr;
   - Sharp;
   - Axios;
   - body-parser/qs;
   - validator;
   - dependency aktif lainnya.
3. Hapus dependency yang tidak digunakan jika aman. Periksa `request` dengan pencarian import/require sebelum menghapus.
4. Upgrade patch/minor yang kompatibel dengan `npm update` atau perubahan `package.json`.
5. Untuk major upgrade:
   - baca changelog;
   - ubah kode adapter;
   - jalankan tes terarah.
6. **Jangan memakai `npm audit fix --force` secara langsung** karena dapat melakukan breaking downgrade/upgrade.
7. Client:
   - prioritaskan advisory XSS/editor/Vue/Vite;
   - jangan menaikkan CKEditor tanpa memeriksa API build yang dipakai;
   - pertahankan bundle yang dapat dibuild.
8. Setelah update:

   ```text
   npm.cmd ci
   npm.cmd audit --omit=dev --json
   ```

9. Catat advisory yang tetap tanpa fix. Jika tidak dapat diselesaikan dalam issue, dokumentasikan mitigasinya; jangan menyebut audit bersih jika masih ada.

### Tes wajib

- Semua tes backend lulus.
- Build frontend lulus pada satu build final.
- Login, refresh, upload image, PDF, WhatsApp mock, dan API client utama tetap berfungsi melalui tes.
- Audit tidak lagi menampilkan critical/high yang dapat diperbaiki tanpa breaking change.

## 5. Step 3 — Cegah duplikasi identitas member

### Kebijakan yang dipakai

- NIK perorangan wajib unik untuk nilai non-null.
- KK tidak dibuat unik karena dapat digunakan beberapa anggota keluarga.
- Nomor WhatsApp tidak otomatis dibuat unik karena dapat dipakai keluarga, tetapi konflik harus ditinjau admin.
- NIK kosong diperbolehkan untuk instansi; uniqueness hanya berlaku untuk nilai non-null.

### Implementasi

1. Normalisasi NIK menjadi digit sebelum validasi/penyimpanan.
2. Tambahkan validasi NIK di:
   - registrasi member;
   - add/edit member admin;
   - approval request keanggotaan.
3. Query konflik NIK dilakukan setelah OTP valid pada registrasi agar tidak menambah jalur enumerasi.
4. Response publik tetap generik.
5. Tambahkan migration unique index `Members.nomor_ktp` untuk nilai non-null.
6. Sebelum unique index:
   - deteksi duplikat;
   - laporkan ID yang konflik;
   - jangan menghapus/merge otomatis;
   - hentikan migration dengan pesan aman jika duplikat produksi memerlukan keputusan bisnis.
7. Perbarui seed agar tidak mengandung NIK duplikat.
8. Approval request harus memeriksa konflik NIK di transaction.

### Tes wajib

- Dua NIK sama ditolak.
- NIK berbeda diterima.
- NIK null untuk instansi tidak saling bertabrakan.
- Dua approval paralel tidak membuat dua member dengan NIK sama.
- Pesan publik tidak mengungkap bahwa NIK sudah terdaftar.

## 6. Step 4 — Validasi capability sebelum upload survei

### Akar masalah

`POST /survey_lapangan/submit` menjalankan Multer/Sharp menulis dan memproses hingga 12 file sebelum access code pada body divalidasi.

### Implementasi yang disarankan

Pertukaran capability sekali pakai/short-lived:

1. Tambahkan `POST /survey_lapangan/session`.
2. Endpoint menerima JSON `{access_code}` tanpa file.
3. Endpoint menolak kode invalid/nonaktif sebelum ada upload.
4. Jika valid, buat capability cookie/server session:
   - `HttpOnly`;
   - `SameSite=Strict`;
   - `Secure` di production;
   - TTL pendek, misalnya 8 jam;
   - tidak berisi access code mentah.
5. `/survey_lapangan/info`, `info_member`, `submit`, dokumen SK, dan dokumen survey membaca capability tervalidasi dari cookie.
6. `/survey_lapangan/submit` menolak request tanpa capability sebelum Multer.
7. Frontend:
   - membaca `?code` sekali;
   - menukar code;
   - menghapus code dari address bar dengan `router.replace`;
   - tidak menyimpan code di localStorage;
   - mengirim cookie dengan `withCredentials`.
8. `access_code` tidak lagi diperlukan pada query dokumen.
9. Tambahkan persistent IP limiter pada endpoint session dan submit.
10. Pertahankan scope kegiatan/member.

Jika implementasi session capability terlalu besar, minimal mutlak:

- validasi access code dari header sebelum Multer;
- rate limit persistent;
- batas ukuran/jumlah file lebih ketat.

Namun solusi cookie capability lebih disarankan untuk menghilangkan code dari URL.

### Tes wajib

- Request submit tanpa capability ditolak sebelum Multer/Sharp.
- File tidak ditulis untuk code invalid.
- Code valid dapat info/submit/dokumen.
- Cookie tidak dapat dibaca JavaScript.
- Code tidak muncul pada query setelah exchange.
- Rate limit mengembalikan 429 sebelum upload.
- Traversal dan validasi file tetap lulus.

## 7. Step 5 — Upgrade Node runtime

1. Ganti Node 20 dengan Node 22 atau 24 LTS.
2. File yang diperiksa:
   - `server/Dockerfile`
   - `client/Dockerfile`
   - `client/Dockerfile.dev`
   - dokumentasi deployment.
3. Jalankan seluruh tes backend dan build frontend.
4. Periksa native dependency:
   - bcrypt;
   - Sharp;
   - mysql2.
5. Gunakan versi/digest image yang masih didukung.
6. Jangan mengubah runtime production secara langsung sebelum uji staging.

## 8. Step 6 — Terapkan password policy pada reset/seeder

1. Import `validatePassword` pada:
   - `server/scripts/reset-account-password.js`;
   - seeder admin;
   - seeder member.
2. Admin/reset minimal 12 karakter.
3. Member minimal 8 karakter.
4. Tolak password umum dari daftar policy.
5. Tetap batasi bcrypt input maksimal 72 byte.
6. Jangan mencetak password.
7. Tes password lemah/umum ditolak sebelum hash/update.

## 9. Step 7 — Hardening build dan runtime container

1. Ganti `npm install` dengan `npm ci` ketika lockfile tersedia.
2. Pin image ke digest immutable yang disetujui.
3. Jangan mengunduh `dockerize` tanpa verifikasi.
   - gunakan package repository yang tepercaya; atau
   - simpan SHA-256 checksum dan verifikasi sebelum ekstraksi.
4. Hapus download runtime yang tidak diperlukan dari image production.
5. Buat user non-root untuk server.
6. Pastikan direktori upload/log memiliki ownership yang benar.
7. Tambahkan `no-new-privileges`, capability drop, dan read-only filesystem jika kompatibel.
8. Dokumentasikan health check dan rollback.
9. Jangan menjalankan Docker build untuk verifikasi tambahan dalam issue ini.

## 10. Step 8 — Audit konfigurasi Sequelize

1. Startup saat ini memanggil `sequelize.sync()`.
2. Untuk production, schema seharusnya dikelola migration.
3. Ubah startup production agar tidak otomatis sync.
4. Development/test dapat mempertahankan sync hanya jika dibutuhkan.
5. Pastikan aplikasi gagal dengan aman jika migration belum dijalankan, tanpa merusak schema.
6. Dokumentasikan perbedaan startup development/production.
7. Tes start tanpa DB production tidak boleh dijalankan sebagai tes.

## 11. Verifikasi final dan SATU build

1. Jalankan tes terarah selama implementasi.
2. Setelah seluruh backend selesai, jalankan satu kali:

   ```text
   npm.cmd test -- --runInBand
   ```

3. Node syntax check file backend yang berubah.
4. `docker compose -f docker-compose.yml config --no-interpolate`.
5. Periksa bahwa `.env` tidak berada dalam Docker build context.
6. Jalankan `npm.cmd run type-check` satu kali. Catat error lama jika tetap ada.
7. Setelah semua perubahan frontend selesai, jalankan **tepat satu kali**:

   ```text
   npm.cmd run build
   ```

8. Jangan build ulang.
9. Jangan Docker build sebagai build tambahan.
10. Perbarui progres Issue 005.

## 12. Kriteria penerimaan

- [x] `.env` dan file secret tidak masuk Docker build context/image.
- [x] Rotasi secret dicatat sebagai pekerjaan operasional wajib.
- [x] Dependency critical/high yang dapat diperbaiki sudah ditangani.
- [x] Advisory tersisa dan mitigasinya didokumentasikan.
- [x] NIK non-null unik dan approval request mencegah duplikasi.
- [x] Submit survei memvalidasi capability sebelum Multer/Sharp.
- [x] Access code tidak lagi bocor terus-menerus melalui query URL.
- [x] Runtime Node didukung dan dites.
- [x] Reset/seeder memakai password policy.
- [x] Build menggunakan `npm ci`, artefak terverifikasi, dan image dasar immutable.
- [x] Container server tidak berjalan sebagai root.
- [x] Production schema menggunakan migration, bukan sync otomatis.
- [x] Semua tes backend lulus.
- [x] Build frontend dijalankan tepat satu kali di akhir dan berhasil.
- [x] Pekerjaan eksternal dicatat jujur.

## 13. Pekerjaan operasional di luar implementasi lokal

1. Rotasi membership/OTP/database/WAPISender secret.
2. Hapus image/cache lama yang memuat `.env`.
3. Backup dan migration database production.
4. Dump/import MySQL 5.7 ke 8.4.
5. Deploy Node/version baru.
6. Smoke test TLS, login, capability survei, upload, dan dokumen.
7. Koordinasi rewrite riwayat Git.
8. Invalidasi session sesuai rotasi secret.

Jangan menjalankan tindakan operasional tersebut tanpa akses dan otorisasi.

## 14. Progres implementasi

| Bagian | Status | Bukti / catatan |
| --- | --- | --- |
| SEC-40 secret image | Selesai lokal | `.dockerignore` server/client, script `check:docker-context`, dan test build context |
| SEC-41 dependency | Selesai remediasi | Audit final backend dan client: 0 critical/high; advisory moderate/low dicatat |
| SEC-42 identitas NIK | Selesai lokal | Normalisasi, pemeriksaan registrasi/admin/approval, model unique, migration unique |
| SEC-43 survei DoS | Selesai | Capability diverifikasi sebelum Multer/Sharp; rate limit session/submit |
| SEC-44 access code URL | Selesai | Session cookie HttpOnly, URL dibersihkan frontend, link memakai hash, dokumen memakai cookie |
| SEC-45 Node EOL | Selesai lokal | Node 22 pada seluruh image aplikasi |
| SEC-46 password policy | Selesai | Reset/admin/member seeder memakai `validatePassword` |
| SEC-47 build supply chain | Selesai | `npm ci`, tanpa unduhan `dockerize`, migration image terpisah |
| SEC-48 runtime/container | Selesai lokal | Base image digest, user `node`, read-only, tmpfs, cap drop, no-new-privileges, health check |
| Sequelize sync | Selesai | Production hanya `authenticate` + pemeriksaan tabel wajib; sync hanya non-production |
| Deployment database | Selesai lokal | Workflow tidak lagi drop database/seeder otomatis; migration memakai image khusus |
| Tes backend final | Lulus | 25 suite, 147 tes |
| Type-check | Gagal baseline | Satu error lama `client/src/modules/template_table.vue:53` |
| Build frontend | Lulus; jumlah 1 | `vite build`, 1813 modul, 50.39 detik |
| Rotasi/deploy production | Tidak dilakukan | Pekerjaan eksternal |
