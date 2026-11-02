# Issue 006 — Tutup celah integritas bantuan, dokumen, dan survei

- Nomor: **006**
- Status: **IMPLEMENTED — revisi R1-R4 selesai; verifikasi MySQL terisolasi belum dapat dijalankan karena Docker daemon tidak tersedia**
- Prioritas: **TINGGI**, mulai dari pembatasan penghapusan riwayat oleh member.
- Tanggal: 2026-11-02.
- Pendahulu: [Issue 005](005-deployment-secret-dependency-dan-capability.md).
- Dasar: [audit endpoint](../security/audit-2026-11-02.md), [inventaris 305 endpoint](../security/audit-2026-11-02-endpoints.json), dan [reproduksi offline](../security/audit-2026-11-02-repro.cjs).
- Semua path dalam instruksi relatif terhadap root repository.

## 1. Instruksi wajib untuk AI pelaksana

1. **Langsung kerjakan bagian yang belum selesai sampai implementasi lokal dan verifikasi tuntas.** Jangan berhenti pada rencana, analisis, atau menawarkan untuk melanjutkan. Jika perbaikan sudah ada, verifikasi dengan tes perilaku; jangan membuat implementasi kedua.
2. **Jangan terlalu banyak bertanya.** Baca kode, tes, dan issue ini untuk mengambil keputusan rutin. Tanyakan hanya keputusan penting yang tidak dapat disimpulkan, misalnya perubahan aturan bisnis yang bertentangan, akses produksi, atau tindakan yang sulit dipulihkan. Lanjutkan pekerjaan independen selama menunggu jawaban.
3. Pertahankan perubahan pengguna yang sudah ada. Jangan reset, checkout paksa, atau menghapus pekerjaan lain. Jangan commit/push/deploy sebagai bagian otomatis issue ini.
4. Telusuri `router -> middleware -> validator -> controller -> model -> transaksi -> cleanup/notifikasi`. Perbaikan satu lapisan tidak cukup jika lapisan lain masih mengulangi perilaku rentan.
5. Gunakan helper dan pola yang sudah sesuai. Hindari refactor global, dependency baru, dan format ulang seluruh repository untuk perubahan ini.
6. Gunakan mock, folder temporer khusus tes, dan database uji terisolasi. Jangan menghapus unggahan asli, memanggil WhatsApp asli, mencetak secret, atau menjalankan migration terhadap produksi.
7. Bedakan temuan terbukti, dugaan yang perlu verifikasi, dan regresi fungsi. Jangan menyebut race pencatatan realisasi sebagai transfer uang ganda: endpoint yang diaudit tidak mengirim transfer bank.
8. Tes terarah boleh dijalankan selama implementasi. **Build hanya satu kali di akhir seluruh issue**, bukan satu kali per bagian. Ketentuan lengkap ada di bagian 10.
9. Perbarui checklist progres dengan bukti nyata. Jika ada pekerjaan tersisa yang bisa dilakukan secara lokal, **langsung kerjakan**, bukan hanya tulis sebagai saran untuk user.
10. Jika alat/database uji tidak tersedia, lanjutkan semua pekerjaan yang tidak bergantung padanya, lalu laporkan batas verifikasi secara spesifik. Jangan menyatakan simulasi mock sebagai pengujian MySQL nyata.

## 2. Hasil yang harus dicapai

| Bagian | Acuan audit | Hasil wajib |
| --- | --- | --- |
| A | SEC-01, tinggi | Member tidak dapat menghapus histori permohonan yang sudah diproses |
| B | SEC-02, sedang | Penggantian/pembatalan dokumen tidak merusak record lain yang berbagi file |
| C | SEC-03, sedang | File tetap tersedia jika commit atau rollback belum dapat dipastikan |
| D | SEC-04, sedang | Dua request realisasi tidak boleh sama-sama mengklaim transisi awal yang sama |
| E | SEC-05, sedang | Multipart survei memiliki batas field, parts, dan ukuran yang jelas |
| F | REG-01 | Submit multipart memakai identitas capability terverifikasi |
| G | REG-02 | Approval/rejection normal berhasil dan tidak membuka duplikasi bantuan bulanan |

Baseline audit: 25 suite/147 tes proyek lulus, tetapi tujuh skenario tambahan masih membuktikan masalah. Angka ini adalah hasil historis, bukan target jumlah tes setelah perbaikan. Matriks 809 penolakan akses tidak membuktikan seluruh alur setelah login aman.

## 3. Persiapan — lakukan sekali

1. Baca instruksi repository jika tersedia, lalu periksa `git status --short`.
2. Baca laporan audit dan script reproduksi yang ditautkan di atas. Jangan mengulang audit seluruh repository untuk memulai issue ini.
3. Baca kode terkini untuk setiap bagian sebelum mengedit. Nomor baris dalam laporan dapat bergeser.
4. Jika belum ada perubahan yang memperbaiki temuan, jalankan dari root:

   ```text
   node doc/security/audit-2026-11-02-repro.cjs
   ```

5. **Penting:** script tersebut mengassert perilaku rentan. Exit 0 sebelum perbaikan berarti kerentanan berhasil direproduksi, bukan aplikasi aman. Sesudah diperbaiki, script bisa gagal karena perilakunya sudah aman. Jangan mengubah kode aplikasi agar kembali memenuhi assert rentan. Buat tes regresi yang mengassert perilaku aman, dan catat pemetaannya di laporan verifikasi.
6. Urutan kerja: A, perbaikan import dasar G, B/C bersama, D, E/F bersama, pemeriksaan bulanan G, lalu verifikasi akhir. Menangani bagian terkait bersama mencegah mengedit cleanup/upload berulang kali.

## 4. Bagian A — Batasi penghapusan riwayat member

Endpoint: `POST /riwayat_permohonan_member/delete`.

File awal:

- `server/router/router_riwayat_permohonan_member.js`
- `server/modules/riwayat_permohonan_bantuan/controllers/index.js`
- `server/modules/riwayat_permohonan_bantuan/models/model_cud.js`
- Model/migration `Permohonan`, `Realisasi_permohonan`, `Validasi_syarat_permohonan`, survei dan monev.
- Komponen client yang memanggil endpoint hapus riwayat tersebut.

Masalah: model hanya memeriksa pemilik, kemudian menghapus permohonan. Foreign key realisasi memakai cascade. Pada record tanpa referensi RESTRICT lain, histori realisasi/validasi dapat ikut hilang.

Langkah implementasi:

1. Pertahankan pemeriksaan kepemilikan dari `req.user.id`; jangan percaya `member_id` dari body.
2. Petakan status permohonan dan seluruh child record yang menandakan sudah diproses. Secara minimum, tolak penghapusan/pembatalan oleh member jika sudah diverifikasi, disurvei, dimonev, disetujui, atau direalisasi. Status penolakan final juga merupakan histori yang harus dipertahankan.
3. Pertahankan histori untuk permohonan yang sudah diproses; jangan sekadar mengubah cascade menjadi cara menghapus child secara manual.
4. Untuk tahap awal yang memang boleh dibatalkan, gunakan status pembatalan/nonaktif yang sesuai pola aplikasi. Jangan menambahkan status ENUM tanpa menyesuaikan migration, filter daftar, duplikasi pengajuan, dan tampilan client. Jika operasi hapus tahap awal memang harus dipertahankan menurut aturan yang sudah eksplisit, batasi hanya pada tahap itu dan dokumentasikan alasannya.
5. Jalankan pemeriksaan dan perubahan dalam satu transaksi. Gunakan row lock dan urutan lock konsisten dengan proses approval/realisasi. Pemeriksaan sebelum transaksi saja tidak cukup.
6. Jika sudah diproses, kembalikan error bisnis yang jelas (misalnya 409) dan jangan mengubah row/file. Jangan bocorkan detail permohonan milik orang lain.
7. Sesuaikan tombol/pesan client agar mencerminkan pembatalan atau penolakan operasi; server tetap menjadi sumber otorisasi.

Tes penerimaan:

- Member B tidak dapat mengubah permohonan A.
- Pemilik tidak dapat menghapus permohonan dengan realisasi final, termasuk fixture tanpa survei/monev yang sebelumnya memungkinkan cascade.
- Histori final yang ditolak juga tetap ada.
- Permohonan tahap awal mengikuti aturan pembatalan yang dipilih dan tidak menimbulkan pengajuan ganda tanpa sengaja.
- Pembatalan yang beririsan dengan approval/realisasi tidak menghapus histori yang baru disetujui.
- Pada MySQL uji, verifikasi row parent/child setelah operasi ditolak; jangan hanya memeriksa status HTTP.

## 5. Bagian B dan C — Amankan referensi file dan cleanup transaksi

Endpoint utama:

- `POST /bakal_penerima_bantuan/upload_berita_acara_massal`
- `POST /bakal_penerima_bantuan/upload_berita_acara`
- `POST /bakal_penerima_bantuan/realisasi_bantuan`
- `POST /bakal_penerima_bantuan/batal_realisasi`
- `POST /validasi_permohonan_bantuan/edit_file`

File awal:

- `server/modules/bakal_penerima_bantuan/models/model_cud.js` dan controllernya.
- `server/validation/bakal_penerima_bantuan.js`.
- `server/modules/validasi_permohonan_bantuan/models/model_cud.js` dan controllernya.
- `server/helper/secureDocumentUploadHelper.js`, `proofUploadHelper.js`, `uploadStorageHelper.js`.
- Pola penanganan commit tidak pasti pada model `survey_lapangan` dan `permohonan_bantuan_member`.

Langkah B — file bersama:

1. Ikuti alur upload massal: A dan B menyimpan filename yang sama.
2. Ikuti upload tunggal A: kode sekarang menghapus filename lama setelah commit, walaupun B masih merujuknya.
3. Buat penghapusan memahami referensi file bersama. Periksa semua record yang dapat merujuk file, termasuk kegiatan berbeda; jangan membatasi hitungan pada kegiatan request.
4. Jangan mengandalkan `count == 0` yang bisa menjadi kedaluwarsa sebelum unlink. Pilih pengaturan transaksi/lock yang konsisten dengan semua penulis referensi, atau tunda pembersihan ke proses rekonsiliasi yang memverifikasi ulang. Jika kepastian belum tersedia, mempertahankan file lebih aman daripada menghapus file aktif.
5. Terapkan aturan yang sama pada pembatalan realisasi dan penggantian dokumen syarat bulanan yang menyalin path.
6. Tetap gunakan helper penyimpanan aman, nama file dari server, dan pembatasan direktori. Jangan menghapus path dari input client.

Langkah C — hasil transaksi belum pasti:

1. Cari seluruh `res.once("finish")`, `removeUploaded...`, dan cleanup di catch pada alur terkait.
2. Tetapkan satu pemilik keputusan cleanup, dengan keadaan yang jelas: belum ada penulisan DB, rollback pasti, commit pasti, atau hasil belum pasti. Gunakan pola yang sudah ada bila cocok.
3. Validasi gagal sebelum transaksi: bersihkan hanya upload baru milik request.
4. Rollback berhasil dan pasti: upload baru yang tidak direferensikan boleh dibersihkan.
5. Commit pasti: pertahankan file baru; file lama hanya boleh dibersihkan menurut aturan B.
6. Commit melempar atau rollback gagal: pertahankan file baru/lama yang mungkin masih direferensikan. Jangan menyimpulkan rollback berhasil hanya dari HTTP 500 atau flag transaksi ditutup.
7. Hapus/perbaiki hook lain yang masih membersihkan file berdasarkan HTTP >=400; penanganan aman di model tidak berguna jika middleware menghapus lagi saat respons selesai.
8. Kembalikan status/kode error konsisten untuk hasil belum pasti dan pesan agar pengguna memeriksa hasil sebelum mengulang. Jangan tampilkan SQL/secret.

Tes penerimaan B/C:

- Upload massal A/B -> ganti A -> dokumen B tetap dapat dibaca.
- Pembatalan A tidak menghapus dokumen yang dipakai B di kegiatan lain.
- Referensi terakhir dibersihkan secara aman, atau tercatat untuk pembersihan tertunda sesuai desain yang didokumentasikan.
- Dokumen syarat dengan path bersama tidak hilang saat satu record diperbarui.
- Validasi gagal dan rollback pasti membersihkan upload baru, bukan file lama.
- Simulasi COMMIT sudah diterapkan tetapi acknowledgement hilang -> file baru tetap ada walaupun respons error.
- Rollback gagal -> file tidak dihapus secara spekulatif.
- Jalankan tes melewati controller dan hook `finish`, bukan hanya metode model.

## 6. Bagian D — Jadikan transisi realisasi atomik

File awal: validator/model/controller `bakal_penerima_bantuan`, serta proses pembatalan dan approval yang mengubah record sama.

Langkah:

1. Pertahankan validasi bentuk input di router, tetapi pindahkan keputusan status dan batas nominal ke dalam transaksi model.
2. Kunci row yang akan direalisasi. Pastikan status terkini `approve`, belum direalisasi, nominal positif dan tidak melebihi biaya yang disetujui terkini.
3. Lakukan conditional UPDATE memakai ID dan status yang diharapkan. Wajibkan satu row berhasil berubah; nol row berarti konflik, bukan sukses.
4. Selaraskan urutan lock dengan bagian A dan operasi pembatalan agar tidak menimbulkan deadlock karena urutan yang berlawanan.
5. Request yang kalah tidak boleh menimpa bukti/nominal request pemenang. Tangani upload request yang kalah sesuai bagian C.
6. Notifikasi dilakukan setelah commit pasti. Kegagalan WhatsApp tidak boleh memicu rollback semu, cleanup file yang sudah committed, atau pengulangan pencatatan realisasi.
7. Jangan menambahkan sistem transfer bank atau mekanisme baru yang tidak dibutuhkan. Bila memakai antrean/notifikasi yang sudah tersedia, gunakan pola tersebut.

Tes:

- Dua request terhadap realisasi awal yang sama: tepat satu transisi sukses; request lain konflik.
- Ubah biaya disetujui setelah validator awal namun sebelum model: model memeriksa nilai terkini.
- Realisasi versus pembatalan mengikuti urutan transaksi yang konsisten tanpa menimpa data diam-diam.
- Notifikasi tidak dipanggil sebelum commit, tidak dipanggil untuk request kalah, dan kegagalan notifikasi tidak menghapus bukti.
- Lakukan uji konkurensi MySQL terisolasi jika tersedia; bedakan hasilnya dari mock interleaving.

## 7. Bagian E dan F — Batas multipart dan scope survei

Endpoint: `POST /survey_lapangan/submit`; pertahankan perilaku info, info_member, session, dan dokumen survei.

File awal:

- `server/helper/surveyCapabilityHelper.js`
- `server/router/router_survey_lapangan.js`
- `server/validation/survey_lapangan.js`
- `server/modules/survey_lapangan/models/model_cud.js` dan `model_r.js`.
- `client/src/views/SurveyLapanganView.vue`, `client/src/service/survey_lapangan.ts`.
- `client/httpd.conf`; konfigurasi/parser `pengaturan_umum` untuk pemeriksaan pola serupa.

Langkah E — batas konsumsi resource:

1. Hitung field formulir yang benar-benar dipakai client/server, termasuk field opsional. Jangan memilih limit yang membuat formulir normal gagal.
2. Tetapkan `fields`, `parts`, dan `fieldSize` pada Multer selain batas file yang sudah ada. Pertahankan batas 12 file serta ukuran per file bila tidak ada alasan perubahan.
3. Tetapkan batas total request pada ingress yang dikelola repository, cukup untuk formulir valid beserta overhead multipart. Dokumentasikan kebutuhan yang harus disamakan pada proxy eksternal, tanpa mengklaim sudah mengubah proxy tersebut.
4. Jangan menganggap `express.json({ limit: "1mb" })` membatasi multipart atau rate limit membatasi ukuran satu request.
5. Capability harus tetap diperiksa sebelum parsing/decoding/persist file.
6. Tinjau parser `pengaturan_umum` yang hanya membatasi fileSize; jika pola field tanpa batas masih ada, perbaiki pada parser itu juga dan tambah tes terarah. Jangan menyatakan dampak endpoint itu sudah terbukti oleh audit sebelumnya.

Langkah F — identitas otorisasi:

1. Telusuri urutan saat ini: middleware capability menulis `req.body.access_code`, kemudian Multer mengganti body.
2. Jadikan properti internal capability terverifikasi sebagai sumber identitas. Validator dan model harus menggunakan ID surveyor/kegiatan tersebut, bukan code/member scope dari multipart.
3. Jika kompatibilitas model sementara memerlukan code, simpan nilai terpercaya di properti internal lalu pulihkan setelah parsing. Jangan mengambilnya kembali dari body client.
4. Tetap periksa status aktif, scope kegiatan, eligibility member, dan pencegahan survei ulang. Jangan menghapus pemeriksaan ini hanya agar submit kembali berhasil.
5. Frontend tidak perlu mengirim kembali access code yang telah ditukar menjadi cookie. Cookie HttpOnly dan aturan origin harus tetap berlaku.

Tes router utuh E/F:

- Sesi sah + formulir normal tanpa field access_code -> submit berhasil.
- Cookie kegiatan A + multipart mengirim code kegiatan B -> tidak dapat mengubah scope menjadi B.
- Capability hilang, kedaluwarsa, atau dicabut -> ditolak sebelum upload diproses.
- Member di luar kegiatan capability -> ditolak.
- Terlalu banyak fields/parts dan field terlalu besar -> ditolak secara terkendali sebelum model berjalan.
- Formulir maksimum yang sah, termasuk 12 file sesuai kontrak, tetap diterima parser.
- Gunakan payload terbatas; jangan menguji hingga proses kehabisan memori.

## 8. Bagian G — Pulihkan keputusan bantuan dan verifikasi periode bulanan

Endpoint: `POST /validasi_permohonan_bantuan/approve_permohonan` dan `.../reject_permohonan`.

File awal: `server/modules/validasi_permohonan_bantuan/models/model_cud.js`, validator/router terkait, `server/__tests__/validation-decision.test.js`, model/migration periode bantuan.

Langkah:

1. Periksa penggunaan `Op.ne` dan `Op.in`; tambahkan import yang benar mengikuti pola Sequelize repository jika masih belum ada.
2. Tambahkan tes jalur sukses approval dan rejection. Tes lama hanya memakai status final sehingga tidak mencapai referensi `Op` yang rusak.
3. Pertahankan kunci transaksi, pemeriksaan berkas, dan proteksi keputusan ulang; jangan melemahkannya untuk meloloskan tes sukses.
4. Setelah alur normal berjalan, uji bantuan bulanan: persetujuan bulan pertama membuat bulan berikutnya; lalu setujui salah satu bulan hasil generate.
5. Periksa apakah bulan yang sama untuk member/kegiatan/tahun dapat dibuat lagi. Risiko ini adalah tindak lanjut source review, bukan eksploitasi end-to-end yang telah dibuktikan audit.
6. Jika duplikasi terbukti, perbaiki generator agar hanya membuat periode yang belum ada dalam seri bantuan yang sama, termasuk pada dua approval bersamaan. Identifikasi kunci bisnis dari skema; jangan memakai unique `(member_id, kegiatan_id)` secara membabi buta karena beberapa bulan memang sah.
7. Jika perlu constraint/migration, buat migration baru dengan preflight deteksi data duplikat. Jangan menghapus/menggabungkan histori produksi otomatis. Dokumentasikan konflik data yang perlu diselesaikan sebelum constraint dipasang.
8. Tangani notifikasi sesudah commit pasti seperti bagian D dan referensi file syarat bersama seperti bagian B.

Tes:

- Approval normal sukses, rejection normal sukses, keputusan final tidak diulang.
- Berkas belum disetujui menghalangi approval.
- Persetujuan bulan awal dan bulan hasil generate tidak menggandakan periode yang sudah ada.
- Dua request bersamaan tidak menghasilkan dua record untuk periode bisnis yang sama.
- Bila dugaan duplikasi ternyata sudah dicegah kode terkini, catat guard dan hasil tes; tidak perlu menambahkan implementasi lain.

## 9. Verifikasi dan syarat penutupan

1. Saat mengerjakan tiap bagian, jalankan tes terarah yang relevan. Gunakan tes perilaku dengan kondisi sukses dan gagal; jangan hanya mencari string tertentu dalam source.
2. Pastikan tes baru akan gagal pada perilaku lama dan lulus pada perilaku aman. Reproduksi audit lama boleh disimpan sebagai bukti historis; jangan mengubahnya diam-diam menjadi bukti kelulusan.
3. Setelah seluruh edit selesai, jalankan suite backend lengkap satu kali dari folder `server`:

   ```text
   npm.cmd test -- --runInBand --silent
   ```

4. Jalankan tes frontend terarah jika mengubah client. Gunakan runner yang memang tersedia di repository; jangan menginstal alat baru hanya untuk issue ini.
5. Jika diperlukan, lakukan pemeriksaan syntax/type terarah sebelum build. Tidak perlu mengulang tes yang sudah lulus tanpa perubahan atau kegagalan baru yang relevan.
6. Catat perintah, exit code, jumlah tes, dan hasil pemeriksaan MySQL/mock secara terpisah dalam `doc/issues/006-verification.md`.
7. Sebelum build, review diff: kepemilikan request, urutan lock, status transaksi, semua jalur cleanup, notifikasi, dan kontrak client/server.
8. Issue tidak boleh ditutup hanya karena build lulus. Semua bagian A–G harus diperbaiki atau dibuktikan sudah aman, dan batas verifikasi harus tertulis.

## 10. Aturan build — satu kali saja di akhir

1. **Jangan build pada tahap persiapan atau setelah masing-masing perbaikan.** Selesaikan seluruh bagian, tes, dan review dahulu.
2. Backend saat issue ditulis tidak memiliki script build. Jangan membuat atau menjalankan build backend/Docker tambahan untuk verifikasi issue ini.
3. Jalankan satu build final dari direktori `client`:

   ```text
   npm.cmd run build
   ```

4. Catat hitungan build dalam laporan: `1 percobaan`. Jangan lanjut dengan `build-only`, Docker build, atau build kedua/ketiga.
5. Jika percobaan tunggal gagal, perbaiki penyebab yang terbukti dengan pemeriksaan terarah tanpa mengulang build. Laporkan secara jujur bahwa build terakhir gagal dan perubahan sesudahnya belum diverifikasi lewat build. Jangan menandai issue sepenuhnya terverifikasi.
6. Menulis issue/dokumentasi saja tidak memerlukan build. Aturan satu build final ini berlaku ketika AI pelaksana mengimplementasikan perbaikannya.

## 11. Checklist progres — isi berdasarkan bukti

- [x] Kode terkini diperiksa dan perubahan pengguna dipertahankan.
- [x] A: member tidak dapat menghapus histori yang sudah diproses.
- [x] B: file bersama tetap tersedia bagi semua record yang masih merujuknya.
- [x] C: cleanup aman untuk validasi gagal, rollback pasti, commit pasti, dan hasil tidak pasti.
- [x] D: transisi realisasi atomik dan notifikasi tidak merusak transaksi.
- [x] E: batas multipart ditetapkan dan formulir valid tetap berjalan.
- [x] F: scope capability tetap terpercaya setelah parsing multipart.
- [x] G: keputusan normal berjalan; generator bulanan diverifikasi dan diperbaiki.
- [x] Tes regresi positif/negatif ditambahkan dan tes terkait lulus.
- [x] Verifikasi MySQL tidak dapat dijalankan; keterbatasan Docker dan cakupan mock ditulis eksplisit di `006-verification.md`.
- [x] Revisi review R1: locking read periode/status berkas dan unique period key dengan preflight duplikat.
- [x] Revisi review R2: approve/reject berkas dan writer survei/monev mengikuti lock/status parent.
- [x] Revisi review R3: edit/remove dokumen administrator memakai antrean cleanup transaksional.
- [x] Revisi review R4: identitas permohonan dan tahun kegiatan tidak berubah setelah realisasi.
- [x] Suite backend final selesai: 33 suite/204 tes lulus.
- [x] Build akhir revisi berhasil; total riwayat issue 2 percobaan karena revisi UI dilakukan setelah build pertama.
- [x] `006-verification.md` berisi ringkasan perubahan, bukti, risiko tersisa, dan jumlah build.
- [x] Status issue diperbarui sesuai kenyataan; pekerjaan lokal yang dapat diselesaikan telah selesai.
