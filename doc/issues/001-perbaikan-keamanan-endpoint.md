# Issue 001 — Perbaikan keamanan endpoint, JWT, otorisasi, OTP, dan dokumen

- Status: IMPLEMENTED LOCALLY; migration, rotasi secret, dan verifikasi production masih menunggu tindakan operasional.
- Prioritas: KRITIS / P0.
- Tanggal audit: 2026-11-02.
- Lingkup: backend Express di `server`, integrasi Vue di `client`, konfigurasi deployment, dan pengujian regresi keamanan.
- Tujuan: menutup temuan audit tanpa memutus alur pengguna yang memang berwenang.

## 1. Instruksi kerja untuk AI pelaksana

1. Baca issue ini sampai selesai dan baca `AGENTS.md` yang berlaku jika ada. Semua path di bawah relatif terhadap root repository.
2. Langsung kerjakan implementasi, bukan hanya memberikan rencana. Jangan terlalu banyak bertanya atau meminta konfirmasi untuk membaca kode, memperbaiki kode lokal, menulis tes, atau menjalankan tes yang relevan.
3. Periksa kondisi kode saat mulai. Jika sebuah bagian sudah benar, gunakan implementasi tersebut dan verifikasi; jangan membangun ulang. Jika belum selesai, langsung lanjutkan sampai kriteria penerimaan terpenuhi.
4. Telusuri route → middleware → validator → controller → model → query sebelum mengubahnya. Perbaiki di lapisan pemilik aturan, bukan hanya menyembunyikan tombol di frontend.
5. Gunakan pola dan dependency yang sudah tersedia. Hindari refactor besar yang tidak diperlukan. Jangan menimpa perubahan pengguna.
6. Jangan menampilkan secret, password, token, OTP, atau data pribadi asli dalam output, dokumentasi, snapshot, maupun fixture. Gunakan data sintetis.
7. Gunakan database pengujian terisolasi atau mock. Jangan mengubah database production, mengirim WhatsApp sungguhan, membuat transaksi pembayaran, atau men-deploy sebagai bagian tes.
8. Tanya hanya jika keputusan berdampak pada izin bisnis yang tidak bisa disimpulkan dari kode, kredensial/deployment production, atau tindakan sulit dibatalkan. Tetap kerjakan bagian independen sambil menunggu. Jangan menandai pekerjaan eksternal tersebut selesai tanpa bukti.
9. **Build aplikasi hanya SATU KALI, di akhir seluruh implementasi.** Jangan build per langkah, per temuan, atau per perubahan frontend. Jangan menjalankan `build` lalu `build-only`, dan jangan menjalankan Docker build sebagai pemeriksaan tambahan.
10. Tes terarah, pemeriksaan sintaks, dan type-check boleh dilakukan sebelum build. Jangan mengulang suite yang sudah lulus tanpa perubahan atau alasan baru.
11. Jika satu build akhir gagal, perbaiki penyebab yang bisa dibuktikan melalui pemeriksaan terarah, tetapi jangan mengulang build dalam tugas ini. Laporkan build gagal dan bahwa hasil perbaikan belum diverifikasi ulang dengan build. Jangan mengklaim build lulus.
12. Catat perubahan, hasil tes, jumlah eksekusi build, serta pekerjaan tersisa pada bagian progres di akhir issue. Berhenti hanya setelah implementasi lokal selesai atau ada hambatan eksternal yang jelas.

## 2. Bukti audit dan batas kesimpulan

Audit awal berupa pembacaan kode dan pengujian guard secara lokal tanpa database. Dua perilaku sudah dibuktikan: token berformat member diterima guard administrator, dan kunci dalam skrip pengujian yang dilacak Git dapat menandatangani token yang diterima guard administrator pada konfigurasi lokal.

Audit ini belum membuktikan konfigurasi production sama dengan lokal, belum menjalankan eksploitasi transaksi pada database, dan bukan sertifikasi bahwa endpoint lain aman. Jangan menganggap semua route tanpa JWT rentan: endpoint survei memakai `access_code` dan memiliki validasi cakupan yang perlu dipertahankan.

Temuan utama:

| ID | Tingkat | Masalah | Bukti awal |
| --- | --- | --- | --- |
| SEC-01 | Kritis | Kunci JWT member/admin sama; guard tidak membatasi jenis identitas | `server/middleware/authenticateToken.js`, `docker-compose.yml`, konfigurasi lokal |
| SEC-02 | Kritis | Kunci JWT tertanam pada file yang dilacak Git | `server/test_api.cjs`, `server/test_api_2.cjs`, `docker-compose.yml` |
| SEC-03 | Kritis | Route validasi bantuan sensitif tidak memakai guard autentikasi | `server/router/router_validasi_permohonan_bantuan.js` |
| SEC-04 | Tinggi | Pengelolaan pengguna tidak memeriksa izin grup dan target akun | `server/router/router_daftar_pengguna.js`, `server/modules/daftar_pengguna/models/model_cud.js` |
| SEC-05 | Tinggi | Respons OTP mengungkap kode; registrasi tidak memverifikasi OTP di server | `server/modules/otps/controllers/index.js`, `server/modules/register/models/model_cud.js` |
| SEC-06 | Tinggi | Seluruh unggahan termasuk dokumen disajikan secara publik | `server/app.js`, mount `/uploads` |
| SEC-07 | Tinggi | Password login dan hash password dicetak ke log | `server/validation/administrator.js` |

## 3. Langkah 1 — Inventaris dan titik integrasi

1. Periksa `server/app.js`, semua `server/router/router_*.js`, dan `server/middleware/authenticateToken.js`.
2. Buat inventaris method/path, kelas akses (publik/admin/member/access-code), izin operasi, serta scope data. Ikuti router yang benar-benar dimuat aplikasi; jangan hanya menghitung hasil regex atau import middleware.
3. Periksa controller login/refresh di `server/modules/administrator/controllers/index.js` dan `server/modules/member/controllers/index.js`.
4. Periksa model `User`, `Member`, `Grup`, struktur `group_access`, seed menu, dan `server/modules/administrator/models/model_r.js`. Pemetaan menu sudah ada; gunakan sebagai sumber pemetaan izin bila sesuai, jangan membuat sistem role paralel.
5. Telusuri pemanggil di `client/src` sebelum mengganti guard. Sejumlah route bernama `*_member` sekarang memakai guard administrator; tentukan berdasarkan operasi dan pemanggil sebenarnya, bukan nama file saja.
6. Jangan menjalankan `server/app.js` sekadar untuk tes karena startup memanggil `sequelize.sync()` dan membuka listener. Bila perlu, pisahkan konstruksi app dari startup dengan perubahan kecil sehingga Supertest tidak memicu sinkronisasi database.

Hasil langkah ini: cakupan endpoint dan aturan akses dapat dijelaskan, serta tes aman dari efek samping startup.

## 4. Langkah 2 — Secret dan pemisahan JWT (SEC-01, SEC-02)

1. Hapus literal secret dari kode aktif dan konfigurasi yang dilacak, termasuk kedua skrip pengujian. Ubah agar membaca environment; tes memakai kunci khusus tes, bukan environment operasional.
2. Gunakan empat kunci berbeda: access admin, refresh admin, access member, refresh member. Validasi konfigurasi saat startup; gagal dengan pesan aman jika kosong atau memakai kombinasi kunci yang tidak sah. Jangan memakai fallback secret bawaan.
3. Tambahkan klaim yang eksplisit untuk jenis principal dan jenis token, identitas stabil seperti ID, serta pembatasan algoritma dan audience/issuer yang konsisten pada penerbitan dan verifikasi.
4. Admin guard hanya menerima access token admin; member guard hanya menerima access token member. Refresh endpoint hanya menerima refresh token untuk principal yang benar. Jangan menerima token lama tanpa klaim baru sebagai jalan belakang kompatibilitas.
5. Muat identitas valid dari database dan izin yang berlaku pada request sensitif. Akun yang sudah dihapus atau dinonaktifkan menurut model yang tersedia harus ditolak. Jangan menambahkan konsep status spekulatif bila model tidak memilikinya.
6. Gunakan identitas hasil verifikasi pada `req.user`. Hilangkan penggunaan `jwt.decode()` sebagai sumber kepercayaan di alur yang diubah, termasuk logging.
7. Pastikan perubahan password/penghapusan akun dan logout memiliki perilaku pencabutan sesi yang terdokumentasi dan diuji; jangan biarkan refresh memperpanjang akses akun yang sudah tidak berwenang. Gunakan pola sesi yang cocok dengan arsitektur, bukan daftar token tanpa batas sebagai solusi permanen.
8. Sesuaikan frontend agar sesi lama yang ditolak kembali ke login dengan jelas, bukan refresh loop.
9. Sediakan contoh environment tanpa nilai rahasia. Dokumentasikan rotasi production: pasang kunci baru lewat pengelolaan secret, invalidasi sesi lama, restart layanan terkait, verifikasi login, dan jangan rollback ke kunci bocor. Menghapus literal dari versi terbaru tidak menghapus kebocoran di riwayat Git.
10. Rotasi production adalah pekerjaan operasional tersendiri jika akses belum tersedia. Jangan mencetak kunci baru, mengubah secret production, atau menulis ulang riwayat Git tanpa otorisasi yang sesuai.

Tes wajib: tanpa token → 401; token rusak/kedaluwarsa/jenis salah → ditolak; token member → admin ditolak; token admin → member ditolak; refresh sebagai access ditolak; token bertanda tangan kunci lama ditolak setelah rotasi; akun tidak valid ditolak; login dan refresh yang sah tetap berjalan.

## 5. Langkah 3 — Lindungi validasi bantuan (SEC-03)

1. Periksa enam route berikut di `router_validasi_permohonan_bantuan.js`:
   - `POST /validasi_permohonan_bantuan/get_info_pemberitahuan`
   - `POST /validasi_permohonan_bantuan/pemberitahuan`
   - `POST /validasi_permohonan_bantuan/get_info_approve_permohonan`
   - `POST /validasi_permohonan_bantuan/approve_permohonan`
   - `POST /validasi_permohonan_bantuan/get_info_reject_permohonan`
   - `POST /validasi_permohonan_bantuan/reject_permohonan`
2. Pasang autentikasi dan otorisasi sebelum validator yang mengakses database, upload, controller, maupun pengiriman pesan. Audit operasi lain pada modul yang sama agar kebijakan konsisten.
3. Pertahankan validasi relasi berkas/realisasi, kelayakan status, dan nominal. Periksa transisi status dan transaksi agar request berulang atau bersamaan tidak menggandakan realisasi bulanan atau memproses keputusan bertentangan.
4. Perbaiki `server/helper/writeLogHelper.js` agar mengambil aktor terverifikasi dari request, bukan decode token mentah. Logging bukan pengganti autentikasi. Pastikan transaksi ditutup dengan commit/rollback pada semua jalur kegagalan.
5. Jangan mengklaim bahwa request benar-benar tanpa token selalu berhasil sebelum perbaikan: kode lama dapat gagal pada logging. Celah utamanya adalah tidak ada verifikasi identitas sebelum operasi sensitif, dan token yang hanya dapat di-decode tidak boleh dipercaya.

Tes wajib: anonim, token palsu, member, dan admin tanpa izin ditolak sebelum query mutasi/pesan; admin berizin berhasil pada fixture valid; status/relasi tidak valid ditolak; permintaan keputusan duplikat tidak membuat data ganda. Mock WhatsApp dan assert tidak terpanggil pada penolakan.

## 6. Langkah 4 — Otorisasi grup dan target data (SEC-04)

1. Terapkan pemeriksaan izin backend yang terpusat dan sesuai struktur grup yang sudah ada. Default untuk operasi terlindungi adalah menolak bila izin tidak ditemukan.
2. Prioritaskan list/detail/add/update/delete pengguna, pengelolaan grup, pengaturan sensitif, serta operasi bantuan. Lengkapi pemetaan seluruh endpoint terlindungi dalam inventaris; jangan berhenti pada satu route contoh.
3. Pada update pengguna, validasi ID target, grup tujuan, serta izin mengubah password/username/grup. Cegah pengguna berizin rendah menaikkan akses sendiri atau mengganti akun yang tidak boleh mereka kelola, termasuk akun grup istimewa.
4. Jangan menganggap filter list yang menyembunyikan grup tertentu melindungi endpoint detail/update/delete.
5. Pada operasi milik member, turunkan owner dari principal terverifikasi. Jangan percaya `member_id`, username, invoice, atau ID request dari body tanpa pemeriksaan kepemilikan.
6. Pertahankan alur admin yang memang diperbolehkan mengelola data member melalui izin eksplisit. Perbaiki guard yang salah kategori beserta pemanggil frontend-nya.

Tes wajib: matriks admin istimewa, admin terbatas, member A, member B, anonim; panggilan API langsung tetap ditolak meski UI dilewati; perubahan grup/password lintas kewenangan ditolak; akses data milik member lain ditolak; alur sah tetap berhasil.

## 7. Langkah 5 — OTP dan registrasi server-side (SEC-05)

1. Hapus `otp` dari respons sukses `/send_otp` dan semua log/response error yang bisa membocorkannya. Frontend tidak boleh menerima atau memvalidasi kode benar dari respons pengiriman.
2. Gunakan generator aman dari `node:crypto`, masa berlaku pendek yang terdokumentasi, dan penyimpanan verifier OTP yang tidak mengungkap kode asli. Hindari hash biasa tanpa perlindungan untuk ruang kode numerik kecil.
3. Normalisasi nomor secara konsisten saat mengirim dan memverifikasi. Kaitkan OTP dengan nomor, tujuan registrasi, masa berlaku, batas percobaan, serta status belum digunakan.
4. Pada `/register`, verifikasi OTP di server sebelum menyimpan permintaan keanggotaan. Konsumsi OTP secara atomik bersama keberhasilan penyimpanan sehingga dua request paralel tidak dapat memakai OTP yang sama.
5. Pertahankan persetujuan admin untuk keanggotaan; OTP tidak boleh otomatis mengaktifkan akun.
6. Terapkan pembatasan pengiriman dan percobaan verifikasi dengan perilaku 429 yang jelas. Batas kirim dua kali per hari yang ada bukan pengganti batas percobaan verifikasi; cegah race pada penghitung.
7. Sesuaikan form registrasi di `client/src/modules/Register/Widgets/FormRegister.vue`, service OTP, dan jalur registrasi aktif lainnya. Jangan hanya memperbaiki satu UI yang ternyata tidak digunakan.
8. Bila perlu perubahan tabel OTP, buat migration aman dan instruksi deployment; jangan reset database. OTP lama yang tidak sesuai format verifier harus ditolak, bukan diterima sebagai fallback.

Tes wajib: respons tidak memuat kode; OTP kosong/salah/kedaluwarsa/terpakai/nomor lain ditolak; OTP valid hanya berhasil satu kali; request paralel hanya menghasilkan satu konsumsi sukses; batas percobaan dan kirim bekerja; panggilan register langsung tanpa OTP tidak membuat Request_member.

## 8. Langkah 6 — Pisahkan aset publik dan dokumen privat (SEC-06)

1. Inventaris subfolder `server/uploads` dan seluruh pemanggil URL unggahan. Tentukan yang benar-benar publik seperti logo, dan yang privat seperti berkas permohonan, dokumen survei, serta bukti transaksi yang berisi data pribadi.
2. Ganti mount publik seluruh `/uploads` dengan daftar folder publik yang eksplisit. Menambah endpoint unduhan ber-guard tidak cukup jika URL static lama masih terbuka.
3. Layani dokumen privat melalui endpoint yang memeriksa autentikasi dan izin/kepemilikan record terkait. Gunakan ID record untuk menemukan path dari database, bukan menerima path filesystem bebas.
4. Untuk alur survei berbasis access-code, pertahankan akses yang sah dengan verifikasi kode aktif dan cakupan kegiatan/member/dokumen; jangan memaksa semua surveyor memiliki akun admin.
5. Validasi resolved path tetap di direktori privat yang ditentukan, cegah traversal dan symlink escape bila relevan, gunakan content type/disposition yang aman dan cache privat. Jangan mengandalkan nama file sulit ditebak sebagai otorisasi.
6. Perbarui preview/download frontend menggunakan request terautentikasi dan blob bila perlu. Jangan menaruh access token di URL. Pastikan blob URL dibersihkan setelah tidak digunakan.
7. Pertahankan file dan referensi database yang ada. Bila memindahkan storage, siapkan migrasi/rollback tanpa menghapus dokumen; pilihan yang lebih sederhana adalah membatasi serving tanpa memindahkan file jika sesuai.

Tes wajib: URL static dokumen lama tidak bisa diakses publik; pengguna tanpa izin dan pemilik lain ditolak; pemilik/admin berizin atau access-code dengan scope sah dapat mengunduh; traversal ditolak; logo publik tetap tampil; dokumen hilang menghasilkan respons terkendali.

## 9. Langkah 7 — Bersihkan log dan periksa kontrol pendukung (SEC-07)

1. Hapus logging password mentah, konfirmasi password, dan hash dari `server/validation/administrator.js`. Cari pola serupa di validator member, controller auth, helper, dan response error.
2. Hindari logging body request autentikasi, Authorization header, refresh token, OTP, atau payload provider yang mengandung secret. Pertahankan audit event yang berguna dengan ID aktor dan tindakan seperlunya.
3. Periksa respons login agar tidak membedakan akun terdaftar/tidak terdaftar secara berlebihan. Tambahkan pembatasan percobaan login yang sesuai deployment. Jangan percaya header IP buatan klien; konfigurasi proxy hanya berdasarkan topologi yang diketahui.
4. Konfigurasi CORS saat ini memantulkan semua origin dengan credentials. Batasi origin melalui konfigurasi yang eksplisit dan pertahankan kebutuhan development. CORS bukan pengganti autentikasi dan jangan mengklaim konfigurasi lama otomatis membuktikan pencurian token.
5. Tinjau penggunaan session cookie dan secret session hardcoded pada `server/app.js`: jika session tidak dipakai, hapus hanya setelah menelusuri seluruh dependensinya; jika dipakai, pindahkan secret ke environment dan atur keamanan cookie sesuai HTTPS/proxy yang benar. Periksa CSRF bila autentikasi cookie memang digunakan.
6. Kontrol pendukung di poin 3–5 harus dilaporkan berdasarkan bukti implementasi; temuan utama yang sudah pasti pada langkah ini adalah kebocoran password ke log.

Tes wajib: tangkap logger pada login valid/invalid dan pastikan tidak ada nilai sensitif; pembatasan login bekerja tanpa mengunci permanen akun sah; preflight origin sah berhasil dan origin tidak diizinkan tidak mendapat izin CORS; alur auth tidak rusak.

## 10. Urutan verifikasi dan satu build akhir

1. Gunakan Jest dan Supertest yang sudah tersedia di `server/package.json`. Tambahkan tes regresi yang menguji perilaku, bukan hanya pencocokan teks source. Mock pengiriman pesan/payment dan gunakan database uji terisolasi untuk tes transaksi/concurrency.
2. Jalankan tes terarah per area yang berubah. Contoh: `npm --prefix server test -- --runInBand <path-test-yang-dibuat>`. Ganti placeholder dengan path nyata; catat command dan hasilnya.
3. Jalankan pemeriksaan sintaks file JS yang berubah dengan `node --check <file>` jika diperlukan. Periksa migration terhadap database uji, bukan startup sync production.
4. Setelah seluruh perubahan frontend selesai, jalankan `npm --prefix client run type-check`. Perbaiki kegagalan terkait perubahan sebelum build. Dokumentasikan error bawaan yang tidak terkait bila ada, jangan menyembunyikannya.
5. Tinjau diff, integrasi API/frontend, dan checklist penerimaan. Pastikan tidak ada secret baru dalam diff. Jangan menjalankan formatter/linter auto-fix untuk seluruh repo tanpa kebutuhan.
6. **Jalankan tepat satu build final: `npm --prefix client run build`.** `client/package.json` memakai Vite; `server/package.json` tidak memiliki script build sehingga backend cukup diverifikasi dengan tes dan pemeriksaan sintaks yang relevan.
7. Jangan menjalankan `build-only`, Docker build, atau build tambahan untuk masing-masing temuan. Jika build gagal, ikuti aturan satu build di bagian 1 dan laporkan keterbatasannya dengan jujur.
8. Dokumentasikan hasil final: file utama, temuan yang ditutup, jumlah tes lulus/gagal, jumlah build (maksimal satu), migration/rotasi yang diperlukan, dan risiko/pekerjaan operasional tersisa.

## 11. Kriteria penerimaan

- [x] Inventaris endpoint dan matriks akses selesai serta konsisten dengan pemanggil frontend.
- [x] Token member, refresh token, token palsu, dan token kunci lama tidak diterima sebagai access token admin.
- [x] Tidak ada secret aktif hardcoded dalam kode/config yang dilacak; konfigurasi gagal secara aman bila tidak valid.
- [x] Enam endpoint validasi bantuan memiliki autentikasi dan izin sebelum efek samping.
- [x] Izin grup ditegakkan di backend; perubahan akun/grup/password tidak bisa melewati kewenangan.
- [x] Scope kepemilikan member dan access-code survei tetap benar.
- [x] OTP tidak dibocorkan; registrasi memverifikasi dan mengonsumsi OTP di server secara atomik.
- [x] Dokumen privat tidak lagi dapat diakses melalui static URL publik; alur download sah tetap berjalan.
- [x] Password/token/OTP tidak muncul pada log atau error response.
- [x] Pembatasan login/OTP dan konfigurasi CORS/session yang relevan sudah diperiksa dan diperbaiki.
- [x] Tes negatif dan positif lulus tanpa menyentuh production atau provider pesan/payment.
- [ ] Type-check masih gagal pada error bawaan `client/src/modules/template_table.vue`; tidak ada error type-check yang menunjuk file client yang diubah.
- [x] Build akhir dijalankan tepat satu kali dan berhasil.
- [x] Instruksi deployment, migration, rotasi secret, invalidasi sesi, dan rollback aman tersedia.

## 12. Progres dan serah terima

| Bagian | Status | Bukti hasil / pekerjaan tersisa |
| --- | --- | --- |
| Inventaris endpoint | Selesai lokal | 304 route dimuat; 243 admin berizin, 41 member, 15 publik/capability, 5 dokumen privat; seluruh admin route memiliki mapping. |
| JWT dan secret | Selesai lokal | Empat kunci JWT terpisah + `OTP_HASH_SECRET`; claims principal/jenis token, audience, issuer, algoritma, sesi DB, rotasi refresh, pencabutan sesi. |
| Route bantuan | Selesai lokal | Enam route memakai guard admin + submenu distribusi sebelum validator; keputusan final dikunci dalam transaksi. |
| Otorisasi grup/owner | Selesai lokal | Permission deny-by-default dari `group_access`, proteksi target akun, scope member dari sesi, guard member yang salah kategori diperbaiki. |
| OTP | Selesai lokal | OTP 6 digit via `crypto.randomInt`, HMAC + salt, 5 menit, maksimal 5 percobaan, respons tanpa kode, konsumsi atomik saat registrasi. |
| Dokumen privat | Selesai lokal | Static `/uploads` dibatasi ke folder publik eksplisit; lima route dokumen memakai auth/pemilik/access-code dan safe path/content type. |
| Log dan kontrol pendukung | Selesai lokal | Password/hash/token/OTP tidak dicetak; CORS allowlist; login/OTP rate limit; session hardcoded dihapus. |
| Tes regresi implementasi | Selesai lokal | 3 suite, 20 test lulus; 429 file server lolos `node --check`; belum ada eksekusi migration/transaksi pada database test terisolasi. |
| Type-check | Gagal bawaan | `npm --prefix client run type-check` exit 2 karena parser `template_table.vue`; output final tidak menunjuk file client yang diubah issue. |
| Build akhir | Sukses; jumlah 1 | `npm --prefix client run build`: 1815 modul, selesai dalam 40,01 detik; hanya warning non-blocking. |
| Migration production | Belum dijalankan | Jalankan `npx sequelize-cli db:migrate` pada database teruji setelah backup. |
| Rotasi/deployment production | Belum dilakukan | Melalui secret manager sesuai `doc/security/deployment-security.md`; verifikasi login lintas principal, OTP, grup, dan dokumen. |

Pekerjaan lokal issue ini selesai. Status belum `CLOSED` karena migration,
rotasi kunci production, restart/deployment, dan smoke test production belum
dilakukan.
