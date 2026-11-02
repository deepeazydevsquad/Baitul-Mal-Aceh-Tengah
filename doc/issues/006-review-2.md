# Review ulang Issue 006

Tanggal: 2026-11-02.

Kesimpulan: **belum sepenuhnya selesai**. R1/R2 dari review pertama sudah ditangani pada jalur yang dilaporkan. Namun, invariant dokumen bersama dan kunci periode belum dijaga pada jalur edit permohonan administrator.

## Perbaikan review sebelumnya

- Query `validationFiles` dan pencarian bulan existing sekarang memakai locking read.
- Approval/rejection berkas memanggil penguncian parent/realisasi, memeriksa parent aktif dan status keputusan, lalu mengunci berkas.
- Pembatalan, survei, dan monev sudah ditambah koordinasi lock parent.
- Migration `20261102180000-enforce-unique-monthly-periods.js` menambahkan kunci unik periode dan preflight duplikat.
- Tes snapshot, penolakan operasi parent batal, dan periode bulanan sudah ditambahkan.

Ini hasil pemeriksaan kode dan tes lokal. Migration dan konkurensi MySQL nyata belum diverifikasi oleh review ini.

## R3 — Sedang: edit dokumen melalui permohonan admin masih menghapus file bersama

Endpoint: `POST /permohonan_bantuan/edit`.

Prasyarat: administrator berizin distribusi, dua dokumen persyaratan merujuk file yang sama; misalnya dokumen yang disalin ke bulan berikutnya oleh generator bantuan bulanan.

Lokasi:

- `server/modules/permohonan_bantuan/models/model_cud.js:316`: replace menjadwalkan penghapusan path lama.
- Baris 328: remove dokumen juga menjadwalkan penghapusan path lama.
- Baris 507–517: `response()` melakukan unlink setelah commit tanpa memeriksa referensi lain atau menggunakan antrean cleanup yang baru.

Langkah reproduksi:

1. Siapkan permohonan bulan Maret dan April member yang sama, dengan file persyaratan `shared.pdf` yang dipakai kedua record.
2. Ganti dokumen Maret melalui endpoint edit permohonan administrator.
3. Model memperbarui path Maret, lalu menghapus `shared.pdf` setelah commit.
4. Dokumen April tetap menunjuk `shared.pdf`, tetapi filenya sudah dihapus.

Bukti fixture model asli: operasi sukses, helper penghapusan dipanggil untuk `shared.pdf`, dan dokumen April tetap merujuk nama tersebut. Tidak ada file asli yang dihapus dalam pembuktian.

Perbaikan yang diperlukan:

1. Terapkan kebijakan file bersama pada seluruh jalur penulis dokumen, termasuk edit/remove pada modul `permohonan_bantuan` ini, bukan hanya `validasi_permohonan_bantuan`.
2. Gunakan antrean cleanup transaksi/helper yang sudah diperkenalkan oleh issue 006. Hindari membuat mekanisme unlink kedua.
3. Tambahkan tes edit Maret tidak menghilangkan dokumen April, termasuk jalur remove.
4. Audit cleanup transaksi pada jalur tersebut supaya kegagalan commit/rollback juga tidak menghapus upload yang mungkin sudah tercatat.

## R4 — Sedang: edit identitas permohonan membuat `periode_key` tidak sesuai data

Endpoint: `POST /permohonan_bantuan/edit`.

Lokasi:

- `server/modules/permohonan_bantuan/models/model_cud.js:238–249`: `member_id` dan `kegiatan_id` parent dapat diubah, tetapi key child `Realisasi_permohonan.periode_key` tidak dihitung ulang.
- `server/validation/permohonan_bantuan.js:79`: pemeriksaan duplikasi member hanya dijalankan jika `body.id` tidak ada; edit memiliki ID sehingga pemeriksaan ini dilewati.
- Migration unique periode hanya mengindeks string `periode_key`, bukan otomatis menghitung dari parent.

Langkah reproduksi:

1. A memiliki periode `7:30:2026:3`; B memiliki periode `8:30:2026:3`.
2. Edit parent A dengan `member_id=8`, tetap kegiatan 30.
3. Kedua realisasi sekarang secara bisnis milik member 8, kegiatan 30, Maret 2026.
4. Stored key A tetap `7:30:2026:3`, sedangkan B tetap `8:30:2026:3`.
5. Unique index tetap melihat dua string berbeda dan tidak mencegah duplikasi periode bisnis. Key lama juga dapat menghalangi pembuatan periode yang sebenarnya sah untuk pemilik lama.

Bukti fixture model asli: edit berhasil, dua actual business key menjadi `8:30:2026:3`, tetapi stored unique key tetap berbeda. Ini pembuktian perubahan model; tidak mengklaim migration dijalankan pada MySQL produksi.

Perbaikan yang diperlukan:

1. Jadikan pemeliharaan key bagian dari perubahan identitas bisnis. Jika identitas tidak boleh berubah setelah realisasi ada, tolak perubahan eksplisit di server dan sesuaikan UI. Jika boleh, hitung ulang seluruh key terkait dalam transaksi yang sama dengan penguncian seri sumber/tujuan dan deteksi konflik.
2. Periksa perubahan `kegiatan.tahun` juga, karena tahun adalah bagian key dan kegiatan dapat diedit. Jangan hanya menambal `member_id`.
3. Tambahkan tes perubahan menuju periode yang sudah ada harus ditolak tanpa perubahan parsial; perubahan sah menghasilkan key konsisten.
4. Jika perubahan kode ini sudah dipakai pada data nyata, lakukan pemeriksaan read-only ketidaksesuaian key sebelum rekonsiliasi. Jangan menghapus histori otomatis.

## Bukti dan batas verifikasi

- Suite backend dijalankan ulang: `npm.cmd test -- --runInBand --silent`, **31 suite / 198 tes lulus**, exit code 0.
- Pembuktian tambahan: `node doc/security/issue-006-review-2-repro.cjs`, exit code 0. **Script ini mengassert perilaku bermasalah; lulus berarti kedua masalah berhasil direproduksi.**
- Script memakai model asli dengan fixture database dan helper file, bukan request HTTP lengkap atau MySQL nyata. Validator/router ditelusuri terpisah untuk memastikan tidak ada penjagaan yang menutup jalur ini.
- Tidak mengubah kode aplikasi, menghapus file asli, mengirim WhatsApp, atau menjalankan migration.
- **Tidak menjalankan build ulang.**

Rekomendasi: bagian B/G masih memerlukan revisi sebelum issue 006 dinyatakan tuntas. Pertahankan catatan review pertama sebagai histori, dengan status R1/R2 diperbarui sesuai hasil review ini.
