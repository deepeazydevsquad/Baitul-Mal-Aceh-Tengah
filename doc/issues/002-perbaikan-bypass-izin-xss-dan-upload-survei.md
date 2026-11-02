# Issue 002 — Tutup bypass izin admin, stored XSS, dan penghapusan file melalui survei

- Status: IMPLEMENTED LOCALLY — siap review; belum ada deployment atau smoke test production.
- Prioritas: TINGGI / P1; selesaikan sebelum rilis berikutnya.
- Tanggal: 2026-11-02.
- Lingkup: backend Express `server`, frontend Vue `client`, dan tes regresi terkait.
- Pendahulu: [Issue 001](001-perbaikan-keamanan-endpoint.md). Gunakan pengamanan yang sudah ada; jangan mengulang implementasi JWT/OTP dari awal.
- Tujuan: menutup tiga celah di bawah tanpa memutus akses pengguna yang sah.

## 1. Instruksi wajib untuk AI pelaksana

1. Baca issue ini sampai akhir, instruksi repository yang berlaku, lalu periksa kondisi kode terbaru. Path di dokumen ini relatif terhadap root repository.
2. **Langsung kerjakan bagian yang belum selesai sampai tuntas.** Jangan berhenti pada analisis, rencana, atau tawaran untuk melanjutkan. Jika implementasi sudah ada, verifikasi perilakunya dan lengkapi kekurangan; jangan membuat ulang.
3. **Jangan terlalu banyak bertanya.** Membaca kode, memilih implementasi lokal yang sesuai pola repo, memperbaiki kode, menambah tes, dan menjalankan tes relevan tidak membutuhkan pertanyaan konfirmasi tambahan. Tanya hanya untuk keputusan izin bisnis yang benar-benar tidak dapat disimpulkan, akses production, atau tindakan sulit dibatalkan. Lanjutkan pekerjaan independen ketika ada hambatan.
4. Periksa `git status` dan diff sebelum mengedit. Workspace memiliki banyak perubahan dari pekerjaan sebelumnya; pertahankan perubahan tersebut. Jangan reset, overwrite, atau commit perubahan pengguna tanpa instruksi.
5. Telusuri request → router → middleware → validasi → controller → model → efek samping. Pada frontend, telusuri input → penyimpanan → respons API → komponen render. Perbaiki sumber masalah, bukan hanya tampilan tombol atau satu contoh payload.
6. Gunakan helper dan dependency yang sesuai dan sudah tersedia. Hindari layanan, konfigurasi, atau framework tes baru jika masalah dapat diselesaikan dengan struktur sekarang.
7. Gunakan identitas, token, nama, file, dan database sintetis untuk tes. Jangan mengirim WhatsApp, membuat transaksi pembayaran, menghapus dokumen asli, menjalankan migrasi production, atau deploy sebagai bagian pengujian ini.
8. **Hanya SATU eksekusi build aplikasi untuk seluruh issue, setelah ketiga perbaikan dan tes selesai.** Bukan satu build untuk setiap celah. Jangan menjalankan build sekarang sebagai baseline.
9. Tes terarah, syntax check, dan type-check boleh dilakukan sebelum build. Jangan mengulang pemeriksaan yang sudah lulus tanpa perubahan atau alasan baru.
10. Jika satu build akhir gagal, perbaiki penyebab yang teridentifikasi dengan pemeriksaan terarah; jangan mengulang build dalam tugas ini. Laporkan kegagalan dan bahwa perbaikan setelahnya belum diverifikasi ulang dengan build. Jangan menyatakan build lulus tanpa bukti.
11. Perbarui checklist dan progres di akhir dokumen dengan command, hasil, dan pekerjaan tersisa yang nyata. Jangan menandai selesai berdasarkan perubahan kode saja.

## 2. Ringkasan temuan dan batas bukti

| ID | Tingkat | Temuan | Prasyarat / bukti |
| --- | --- | --- | --- |
| SEC-08 | Tinggi | Kapitalisasi URL melewati pemeriksaan izin grup | Membutuhkan sesi administrator valid. Reproduksi terisolasi: path normal ditolak 403, path huruf besar mencapai handler 200 dengan principal tanpa izin. |
| SEC-09 | Tinggi | Nama pendaftar dirender sebagai HTML pada dialog konfirmasi admin | Pendaftar dapat mengisi nama dan menyelesaikan OTP. Admin membuka konfirmasi approve/reject. Alur input sampai `v-html` telah ditelusuri; belum diuji di browser. |
| SEC-10 | Tinggi | Metadata unggahan dari body mengendalikan target penghapusan file | Jalur submit membutuhkan access-code survei valid dan kegagalan penyimpanan. Simulasi helper dengan filesystem palsu membuktikan target dapat keluar direktori; eksploitasi endpoint penuh belum dilakukan. |

Audit dilakukan pada kode lokal, termasuk perubahan belum di-commit. Tidak ada pembuktian bahwa konfigurasi production identik. Jangan menyebut simulasi sebagai eksploitasi production. Tidak ada file asli yang dihapus saat audit.

## 3. Langkah 1 — Persiapan dan baseline yang relevan

1. Baca `server/app.js`, `server/middleware/routeAuthorization.js`, `server/middleware/authorizePermission.js`, dan `server/middleware/authenticateToken.js`.
2. Baca inventaris `server/security/routeInventory.js` dan `doc/security/endpoint-inventory.md`. Inventaris berdasarkan string path saja bukan bukti bahwa enforcement runtime aman.
3. Baca tes yang tersedia di `server/__tests__` serta scripts pada kedua `package.json`.
4. Periksa progres Issue 001 sebagai konteks. Checklist izin pada issue tersebut tidak membuktikan variasi kapitalisasi aman; jangan menganggap temuan baru sudah tertutup.
5. Catat file yang akan diubah dan hasil baseline terarah bila dibutuhkan. Jangan menjalankan server utama untuk tes karena startup dapat menjalankan `sequelize.sync()`.

## 4. Langkah 2 — Perbaiki bypass izin URL (SEC-08)

### Akar masalah dan lokasi

- `server/middleware/routeAuthorization.js`: regex `permissionRules` dan `startsWith` prefix member peka huruf besar/kecil; route tanpa rule melewati middleware melalui `next()`.
- `server/router/router_daftar_grup_acces.js`: memakai `express.Router()` default yang tidak peka huruf besar/kecil. Guard lokal memastikan login admin, tetapi pemeriksaan izin bergantung pada middleware global.
- `server/modules/daftar_grup_akses/models/model_cud.js`: operasi edit menerima ID dan `group_access` untuk disimpan. Karena itu, melewati izin pengelolaan grup berpotensi menaikkan kewenangan.

Reproduksi audit memakai middleware izin asli, principal admin sintetis dengan `grup_id: 2` dan `group_access: '[]'`, serta handler tanpa mutasi database:

| Request | Hasil sebelum perbaikan |
| --- | --- |
| `POST /grup_akses/edit` | 403 `PERMISSION_DENIED` |
| `POST /GRUP_AKSES/edit` | 200, handler tercapai |

### Langkah implementasi

1. Konfirmasi perilaku ini lewat tes sebelum mengubah enforcement. Jangan memakai akun atau data asli.
2. Tentukan satu sumber aturan izin yang berlaku konsisten pada route aktual. Utamakan pengaitan autentikasi/izin pada router atau route pemilik operasi sebelum validator, upload, dan controller. Reuse `requirePermission` dan pemetaan menu yang sudah ada.
3. Jika mempertahankan dispatcher global, pastikan pencocokan identik dengan routing Express untuk semua bentuk path yang diterima, dan route terlindungi tidak lolos hanya karena rule tidak ditemukan. Jangan hanya memperbaiki satu regex grup akses.
4. Jangan berasumsi `app.set('case sensitive routing', true)` otomatis mengubah semua child `express.Router()`. Verifikasi perilaku router yang benar-benar dimuat.
5. Audit prefix member juga. Perubahan kapitalisasi tidak boleh meniadakan pemeriksaan `member_id` terhadap sesi atau scope kepemilikan.
6. Pertahankan pengecualian publik, endpoint auth, dokumen privat, dan survei access-code sesuai kebutuhan yang sudah ada. Default-deny tidak boleh berubah menjadi pemaksaan login admin untuk semua endpoint publik.
7. Sesuaikan inventaris endpoint dan tes agar merefleksikan enforcement sesungguhnya. Pastikan tidak muncul dua pemetaan izin yang dapat menyimpang.

### Tes wajib

- Admin tanpa izin ditolak pada path normal, uppercase, dan mixed-case untuk operasi grup dan contoh operasi terlindungi lainnya.
- Handler mutasi/database/pengiriman pesan tidak terpanggil pada penolakan; status HTTP saja belum cukup.
- Admin berizin dapat mengakses path resmi. Jika variasi path sengaja ditolak, hasilnya 404/penolakan konsisten, bukan bypass.
- Anonim dan token member tetap tidak dapat mengakses operasi admin.
- Variasi path member tidak membuka akses ke `member_id` pengguna lain.
- Endpoint publik yang memang sah tetap berfungsi; route terlindungi baru/tanpa pemetaan tidak diam-diam menjadi publik.

## 5. Langkah 3 — Hilangkan stored XSS dari nama pendaftar (SEC-09)

### Alur data dan lokasi

1. `server/router/router_register.js`: `fullname` hanya diperiksa tidak kosong.
2. `server/modules/register/models/model_cud.js`: menyimpan `body.fullname` ke `Request_member`.
3. `server/modules/request_keanggotaan/models/model_r.js`: mengembalikan `fullname` ke frontend.
4. `client/src/modules/RequestKeanggotaan/RequestKeanggotaan.vue`: pesan `Yakin mau approve ${item.fullname}?` dan pesan reject diteruskan ke dialog.
5. `client/src/composables/useConfirmation.ts`: menyimpan message tanpa escaping.
6. `client/src/components/Modal/Confirmation.vue`: merender `confirmMessage` dengan `v-html`.

Nama yang berisi markup aktif dapat dieksekusi saat dialog dibuka, sebelum admin mengonfirmasi keputusan. `client/src/service/api_administrator.ts` menyimpan access/refresh token di `localStorage`, sehingga XSS dapat membaca token atau menjalankan request atas nama admin. Pemindahan storage token saja tidak menyelesaikan sumber XSS.

### Langkah implementasi

1. Periksa seluruh pemanggil `Confirmation.vue` untuk melihat kebutuhan format pesan. Jadikan pesan teks biasa dengan interpolasi Vue atau `v-text` bila tidak membutuhkan HTML.
2. Pertahankan format yang diperlukan melalui elemen template/slot terstruktur. Jangan menggabungkan data pengguna ke string HTML. Jangan mengganti sanitasi dengan regex penghapus tag.
3. Periksa penggunaan `v-html` lain yang ditemukan saat audit: `Notification.vue` dan `AdministratorArea/widgets/Content/ContentViews.vue`. Telusuri sumber datanya; jika memasukkan data tidak tepercaya dengan pola sama, perbaiki dalam issue ini. Jangan menyebut semua `v-html` otomatis rentan tanpa menelusuri sumber.
4. Jika ada kebutuhan HTML yang nyata, gunakan sanitizer yang sesuai hanya pada batas render tersebut dengan kebijakan ketat. Jangan menambah dependency jika render teks sudah memenuhi kebutuhan.
5. Bila menambah validasi nama di backend, jangan menjadikannya satu-satunya perlindungan. Record lama di database juga harus aman saat dirender. Pertahankan karakter nama yang sah.
6. Jangan mengubah arsitektur autentikasi atau merombak editor HTML tanpa kebutuhan untuk menutup alur yang terbukti.

### Tes wajib

- Gunakan nama sintetis berisi markup seperti elemen gambar dengan event handler yang hanya memasang flag lokal; jangan mengirim token/data ke jaringan.
- Buka kedua dialog approve dan reject: markup tampil sebagai teks, tidak menjadi elemen aktif, dan flag eksekusi tidak terpasang.
- Uji nama biasa, tanda petik, ampersand, dan record lama berisi markup. Tidak boleh muncul double-escaping yang merusak nama normal.
- Tombol confirm/cancel dan callback masih berfungsi.
- Gunakan pengujian render/DOM atau browser bila tersedia; jangan menganggap pencarian teks `v-html` saja sebagai bukti regresi lengkap. Bila lingkungan tidak mendukung, catat batas verifikasi secara eksplisit.

## 6. Langkah 4 — Amankan metadata dan cleanup unggahan survei (SEC-10)

### Akar masalah dan lokasi

- `server/router/router_survey_lapangan.js`: menerima submit dan menjalankan Multer sebelum validasi data. Access-code dan scope member sudah diperiksa; pertahankan pemeriksaan ini.
- `server/validation/survey_lapangan.js`: filename callback menulis metadata ke `req.body.uploaded_files`, yang juga merupakan area input klien.
- `server/modules/survey_lapangan/models/model_cud.js`: membaca `body.uploaded_files`, menyimpan referensinya, dan saat error memanggil `cleanupUploadedFiles(uploaded)`.
- Cleanup memakai `path.join(folderPath, filename)` lalu `fs.unlinkSync()` tanpa memastikan hasil path tetap dalam folder upload.
- `server/helper/handleErrorFile.js` sudah memiliki cleanup dari `req.file`/`req.files`; periksa dan reuse/konsolidasikan bila sesuai, jangan membuat jalur cleanup yang saling bertentangan.

Simulasi audit terhadap helper menggunakan filesystem palsu: `form_survey: '../../../SIMULATED_TARGET.txt'` mengarahkan penghapusan ke `server/SIMULATED_TARGET.txt`, di luar `server/uploads/dokumen/survey_lapangan`. Tidak ada penghapusan sungguhan.

### Langkah implementasi

1. Jangan percaya `uploaded_files` dari JSON, urlencoded, atau field multipart. Tolak atau abaikan field tersebut secara konsisten; metadata internal harus berada di properti server terpisah atau langsung diturunkan dari `req.files` keluaran Multer.
2. Bentuk `form_survey`, `berita_acara`, dan daftar `dokumentasi` hanya dari file yang benar-benar diterima pada request itu. Client tidak boleh memilih referensi file milik survei lain.
3. Cleanup hanya boleh menghapus file baru milik request yang gagal. Jangan menghapus file lama yang direferensikan database, atau path yang datang dari body.
4. Sebelum menghapus, validasi canonical/resolved path berada di direktori upload yang dimaksud dengan batas separator yang benar. Tangani separator Windows/POSIX, path absolut, `..`, serta symlink escape bila relevan. Prefix string tanpa separator bukan pemeriksaan containment yang cukup.
5. Tangani file tidak ada dan kegagalan cleanup secara terkendali. Jangan membocorkan path/isi sensitif ke respons. Hindari penghapusan ganda antar helper/controller/model.
6. Pastikan transaksi ditutup pada semua jalur error. Saat ini `submit()` dapat melempar error setelah membuka transaksi, sedangkan controller baru memanggil `response()` setelah submit sukses. Perbaiki ownership rollback sehingga error dan cleanup tidak meninggalkan transaksi terbuka.
7. Pertahankan kontrak upload frontend, batas jumlah/ukuran file, scope access-code, dan alur submit yang sah. Jangan menghapus/memindahkan dokumen existing atau menjalankan migrasi destruktif.

### Tes wajib

- Body JSON berisi `uploaded_files` palsu tidak bisa membuat referensi file atau memicu penghapusan file target.
- Field multipart dengan nama internal yang sama tidak dapat menimpa metadata server, baik sebelum maupun setelah bagian file.
- Uji traversal `../`, separator alternatif, path absolut, dan target di direktori dengan nama prefix serupa. Gunakan mock filesystem atau fixture dalam direktori sementara terisolasi.
- Paksa kegagalan penyimpanan database menggunakan mock: hanya file baru request tersebut yang dibersihkan dan transaksi rollback tepat sekali.
- File existing, file di luar folder, dan file milik request lain tidak dihapus.
- Upload sah menyimpan nama yang dihasilkan server dan tidak dihapus setelah commit.
- Error validasi, file hilang, dan error cleanup menghasilkan respons terkendali tanpa transaksi tertinggal.
- Access-code tidak aktif, member di luar scope, dan input tidak valid tetap ditolak.

## 7. Langkah 5 — Verifikasi gabungan dan SATU build terakhir

1. Jalankan tes regresi baru dan suite keamanan terkait menggunakan Jest/Supertest yang sudah terpasang. Contoh command dari root: `npm --prefix server test -- --runInBand`. Jika menjalankan subset, tulis nama file tes nyata dan hasilnya dalam progres.
2. Untuk file backend yang berubah, lakukan `node --check <path-file>` bila diperlukan. Backend saat ini tidak memiliki script build; jangan menambahkan build backend hanya untuk issue ini.
3. Setelah perubahan frontend lengkap, jalankan `npm --prefix client run type-check`. Issue 001 melaporkan error lama pada `client/src/modules/template_table.vue`; periksa status terkini, jangan langsung menganggap error baru sebagai bawaan. Catat hambatan yang tidak terkait tanpa menyembunyikannya.
4. Periksa diff akhir, checklist, dan integrasi API/frontend. Pastikan tes memakai fixture terisolasi dan tidak ada secret baru dalam diff.
5. Setelah langkah 1–4 selesai, jalankan **tepat satu kali**: `npm --prefix client run build`.
6. Jangan menjalankan `build-only`, Docker build, atau build per temuan. Di PowerShell gunakan `npm.cmd` bila execution policy menghalangi shim `npm.ps1`; hindari retry yang tanpa sengaja menjalankan build kedua.
7. Jika build gagal, ikuti aturan bagian 1: lakukan perbaikan terarah, laporkan hasil gagal dan batas verifikasinya, tanpa build ulang. Bila terhambat sebelum build, catat jumlah 0 dan alasan; jangan mengaku sudah menjalankan build.
8. Laporkan ringkas: perubahan, temuan yang ditutup, tes yang benar-benar dijalankan, hasil type-check, jumlah build, serta risiko/pekerjaan tersisa. Tidak perlu deploy atau commit otomatis.

## 8. Kriteria penerimaan

- [x] Izin route konsisten terhadap kapitalisasi dan seluruh bentuk path yang diterima router.
- [x] Admin tanpa izin, member, dan anonim tidak mencapai handler admin terlindungi.
- [x] Scope member tetap ditegakkan pada variasi path; alur publik dan access-code sah tetap berjalan.
- [x] Nama pendaftar dirender aman di dialog approve/reject, termasuk record lama.
- [x] Sink HTML terkait telah ditelusuri dan alur data tidak tepercaya yang ditemukan ditutup.
- [x] Metadata upload sepenuhnya berasal dari server; body tidak dapat memilih referensi/target penghapusan.
- [x] Cleanup hanya menghapus unggahan baru dalam direktori yang diizinkan.
- [x] Transaksi survei ditutup secara benar pada sukses maupun gagal.
- [x] Tes negatif dan positif membuktikan penolakan sebelum efek samping serta alur sah tetap berfungsi.
- [x] Hasil type-check dicatat dan error terkait perubahan telah diselesaikan.
- [x] Build dijalankan satu kali di akhir; hasil aktual dicatat tanpa klaim kelulusan palsu.
- [x] Progres, bukti, dan hambatan tersisa diperbarui; perubahan pengguna lain tetap terjaga.

## 9. Progres dan serah terima

Catatan historis saat dokumen dibuat: hanya audit dan penulisan issue yang
selesai. Tabel di bawah merupakan status awal sebelum implementasi.

| Bagian | Status awal | Bukti hasil / pekerjaan tersisa |
| --- | --- | --- |
| SEC-08: bypass izin | Belum diperbaiki | Reproduksi terisolasi 403 pada path normal, 200 pada uppercase; implementasikan dan tambah regresi runtime. |
| SEC-09: stored XSS | Belum diperbaiki | Alur registrasi → fullname → dialog → v-html terkonfirmasi dari kode; verifikasi render setelah perbaikan. |
| SEC-10: metadata/cleanup | Belum diperbaiki | Simulasi filesystem palsu menunjukkan path keluar direktori; perbaiki metadata, containment, cleanup, dan rollback. |
| Tes backend/frontend | Belum dijalankan untuk implementasi | Isi command, jumlah tes, hasil, dan batas mock/browser. |
| Type-check | Belum dijalankan | Periksa kembali error lama Issue 001 dan bedakan dari regresi baru. |
| Satu build akhir | Belum dijalankan; jumlah 0 | Jalankan sekali setelah seluruh perbaikan dan tes siap. |

Status aktual setelah implementasi: pekerjaan lokal selesai. Jumlah build Issue
002: **1**.

| Bagian | Status akhir | Bukti hasil / pekerjaan tersisa |
| --- | --- | --- |
| SEC-08: bypass izin | Selesai lokal | `server/security/routePolicy.js` menjadi sumber runtime/inventaris; path dinormalisasi sebelum pencocokan; unmapped ditolak 404 sebelum handler. Tes mencakup normal/uppercase/mixed-case, trailing slash, anonim, member, scope, publik, dan unmapped. |
| SEC-09: stored XSS | Selesai lokal | `Confirmation.vue`, `Notification.vue`, dan deskripsi tab tidak lagi memakai `v-html` untuk data tidak tepercaya. Tes DOM memasang payload pada dialog approve/reject dan memastikan markup inert serta callback tetap berjalan. Tiga `v-html` saldo tersisa hanya menerima label tetap dan nominal yang diformat di client, bukan input bebas. |
| SEC-10: metadata/cleanup | Selesai lokal | Metadata hanya dari `req.files`; `uploaded_files` body dihapus; nama file memakai `crypto.randomBytes`; cleanup memvalidasi path absolut/relatif dan realpath. Kegagalan commit atau rollback yang tidak pasti mempertahankan file dan mengembalikan `503`; cleanup hanya terjadi setelah rollback terbukti berhasil atau record dipastikan tidak tersimpan. Tes multipart memakai direktori sementara terisolasi dan tidak menghapus berdasarkan selisih isi folder upload aplikasi. |
| Tes backend | Lulus | `npm.cmd --prefix server test -- --runInBand`: 5 suite, 57 test lulus. Termasuk traversal `../`, separator Windows, path absolut, prefix mirip, symlink bila didukung OS, file lama, validasi, access-code, multipart `uploaded_files` sebelum/sesudah file dalam direktori temporary, commit tidak pasti, rollback tidak pasti, serta kegagalan transaksi. |
| Tes frontend/DOM | Lulus | `node --test tests/safe-rendering.test.mjs` dari `client`: 4 test lulus menggunakan jsdom dan compiler SFC; bukan pengujian browser production. |
| Syntax check backend | Lulus | `node --check` untuk route policy/authorization/inventory, helper upload/error, validator/router/model/controller survei. |
| Type-check | Gagal pada error lama | `npm.cmd --prefix client run type-check` exit 2 hanya karena `src/modules/template_table.vue(53,3): TS1131`. Error konfigurasi `jsdom` pada `tsconfig.vitest.json` sudah dihapus; tidak ada error yang menunjuk file client yang diubah issue. |
| Satu build akhir | Sukses; jumlah 1 | `npm.cmd --prefix client run build`: 1.815 modul, selesai 38,60 detik. Ada warning CSS/chunk/asset dan peringatan data browser lama; tidak menggagalkan build. |
| Deploy/smoke production | Belum dilakukan | Di luar perubahan lokal; tidak ada deployment, database production, atau provider eksternal yang disentuh. |

Follow-up temuan commit uncertainty dan isolasi filesystem tes hanya mengubah
backend dan tes. Build frontend tidak dijalankan ulang; jumlah build untuk Issue
002 tetap **1** dan hasil build sukses sebelumnya tetap menjadi bukti terakhir
untuk frontend.

Sisa pekerjaan operasional: review diff, deploy terkontrol, lalu smoke test
login admin/member, variasi path terlindungi, dialog keanggotaan, dan submit
survei dengan file sintetis. Perbaikan parser lama `template_table.vue` tetap
pekerjaan terpisah agar type-check dapat menjadi hijau.

Pekerjaan lokal dalam lingkup Issue 002 telah selesai. Tidak ada commit atau
deployment otomatis yang dilakukan.
