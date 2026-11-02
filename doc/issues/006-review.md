# Review implementasi Issue 006

Tanggal: 2026-11-02.

Kesimpulan: **belum sepenuhnya benar; bagian A/G belum layak dianggap selesai**. Banyak perbaikan sudah diterapkan dengan benar, tetapi koordinasi transaksi masih menyisakan dua masalah berikut. Dokumen ini merupakan hasil review tambahan terhadap `006-verification.md`, bukan klaim bahwa seluruh perbaikan gagal.

## R1 — Tinggi: pembacaan snapshot lama masih dapat menggandakan periode bulanan

Endpoint: `POST /validasi_permohonan_bantuan/approve_permohonan`.

Lokasi: `server/modules/validasi_permohonan_bantuan/models/model_cud.js`, khususnya baris 403, 422, dan 500–522.

Model menjalankan SELECT biasa untuk pointer realisasi/parent sebelum mengambil lock kegiatan. SELECT tersebut membentuk snapshot pada isolation MySQL InnoDB `REPEATABLE READ`. Lock kegiatan menserialkan penulis, tetapi tidak memperbarui snapshot SELECT biasa berikutnya. Query `existing` untuk mencari bulan yang sudah ada tidak memakai locking read. Repository tidak menetapkan isolation berbeda pada transaksi ini; konfigurasi server produksi sebenarnya belum diperiksa.

Skenario dengan dua bulan pending dalam seri yang sama dan beberapa bulan berikutnya belum ada:

1. Data awal mempunyai bulan 1 dan 2; bulan 3–12 belum ada. Kondisi ini dapat berasal dari data parsial/legacy; temuan ini tidak berarti setiap approval normal langsung menghasilkan duplikasi.
2. Transaksi A menyetujui bulan 1, mengunci kegiatan, lalu menyiapkan bulan 3–12.
3. Transaksi B menyetujui bulan 2. SELECT pointer/parent membentuk snapshot sebelum A commit, kemudian B menunggu lock kegiatan.
4. A commit. B memperoleh lock kegiatan dan membaca parent/realisasi terkini melalui locking read.
5. Query `existing` B tetap memakai snapshot lama, sehingga tidak melihat bulan 3–12 yang dibuat A.
6. B membuat periode yang sama lagi. Tidak ada constraint unik periode bisnis dalam migration untuk menjadi pengaman terakhir.

Bukti review: menjalankan model asli melalui VM dengan simulasi transaksi yang membedakan snapshot read dan locking read menghasilkan **20 row baru**, yaitu bulan 3–12 masing-masing dua kali. Ini **simulasi semantics REPEATABLE READ, bukan pengujian MySQL nyata**. Tes repository hanya memberi fixture `existingMonths` dan memeriksa pemanggilan lock; belum menguji snapshot yang sudah terbentuk sebelum menunggu lock.

Tindak lanjut:

1. Pastikan pembacaan penentu keberadaan periode memakai current/locking read dengan urutan lock yang konsisten, atau desain isolation/transaksi yang secara eksplisit menjamin pembacaan terkini setelah serialisasi. Jangan hanya menambah lock kegiatan yang sama lagi.
2. Tinjau juga `validationFiles` pada baris 450: query biasa tersebut dapat membaca status berkas dari snapshot lama meskipun parent/realisasi terkunci.
3. Tambahkan pengaman unik periode hanya setelah menetapkan kunci bisnis dan penanganan data duplikat; jangan menghapus histori untuk memasang constraint.
4. Tambahkan tes dua koneksi MySQL terisolasi pada REPEATABLE READ: snapshot B terbentuk sebelum commit A, B menunggu lock, lalu pastikan tidak ada periode duplikat. Verifikasi isolation aktual deployment sebelum menyatakan dampak pada produksi.

## R2 — Sedang: approval/rejection berkas tidak mengikuti lock dan status parent

Endpoint:

- `POST /validasi_permohonan_bantuan/approve_berkas`
- `POST /validasi_permohonan_bantuan/reject_berkas`

Lokasi: `server/modules/validasi_permohonan_bantuan/models/model_cud.js:172–238`; validator `server/validation/validasi_permohonan_bantuan.js:29–62`.

Berbeda dari edit file dan keputusan permohonan, kedua metode tersebut hanya mengunci row validasi berkas. Tidak ada pemeriksaan bahwa parent masih `sedang_berlangsung`, dan tidak ada partisipasi dalam protokol lock parent yang dipakai pembatalan member. Validator router hanya mengecek eksistensi/relasi berkas dan apakah berkas sudah approve, bukan status aktif parent.

Skenario langsung:

1. Member membatalkan permohonan awal; parent menjadi `terhenti`, child dan berkas `process` tetap ada untuk mempertahankan histori.
2. Administrator berizin mengirim approval berkas tersebut, misalnya melalui halaman yang belum dimuat ulang.
3. Validator masih lolos dan model mengubah status berkas menjadi `approve`, lalu commit sukses.

Bukti review dengan model asli dan fixture parent `terhenti`: `success=true`, `fileStatus=approve`, dan **0 pembacaan/penguncian parent melalui model Permohonan**. Pembacaan data untuk pesan log bukan pemeriksaan status atau row lock.

Skenario race terkait:

1. Member mengunci parent dan memeriksa belum ada berkas approve/reject.
2. Administrator mengunci hanya berkas, memverifikasinya, lalu commit tanpa menunggu parent.
3. Member membatalkan parent berdasarkan pemeriksaan sebelumnya. Hasilnya bertentangan dengan aturan bahwa permohonan yang sudah diverifikasi tidak boleh dibatalkan.

Tindak lanjut:

1. Gunakan protokol lock/status yang konsisten pada seluruh penulis child: parent, realisasi, lalu berkas. Muat ulang dan periksa status berkas dalam transaksi, bukan hanya validator sebelum transaksi.
2. Tolak approve/reject berkas jika parent sudah dibatalkan/nonaktif.
3. Periksa juga penulis survei/monev apabila aturan pembatalan bergantung pada keberadaan record tersebut; lock parent tidak melindungi dari penulis yang tidak mengikuti protokol yang sama.
4. Tambahkan tes parent sudah dibatalkan serta interleaving pembatalan versus verifikasi berkas. Pastikan hasil akhir mengikuti urutan transaksi dan tidak mengubah histori yang sudah final.

## Bagian yang sudah membaik

- Hard delete oleh member sudah diganti pembatalan yang mempertahankan histori.
- File bersama tidak lagi langsung di-unlink setelah penggantian; cleanup ditunda dan rekonsiliasi mensyaratkan writer dihentikan.
- Jalur upload utama membedakan rollback pasti, commit pasti, dan hasil belum pasti; hook cleanup berdasarkan respons error telah dihapus dari alur tersebut.
- Realisasi memakai lock parent/child dan conditional UPDATE, dengan notifikasi setelah commit.
- Batas multipart survei/pengaturan umum sudah ditambahkan dan scope survei memakai capability internal.
- Import `Op` sudah benar dan jalur sukses keputusan mempunyai tes.

## Verifikasi review

Perintah dari `server`:

```text
npm.cmd test -- --runInBand --silent
```

Hasil saat review: **29 suite / 182 tes lulus**, exit code 0. Kelulusan tersebut tidak menutup R1/R2 karena skenarionya belum dicakup.

Dua pembuktian tambahan menggunakan model asli dengan fixture/simulasi, tanpa query database produksi, penghapusan file nyata, atau WhatsApp. Konkurensi pada MySQL nyata belum diverifikasi dalam review ini.

Tidak mengubah kode aplikasi dan **tidak menjalankan build ulang**. Build satu kali yang berhasil merupakan hasil yang dicatat pelaksana dalam `006-verification.md`, bukan build yang dijalankan reviewer. Migration cleanup, konfigurasi proxy eksternal, dan perbaikan error type-check lama tetap perlu mengikuti catatan operasional dokumen tersebut.

Rekomendasi status: **perlu revisi A/G dan pengujian konkurensi sebelum penutupan final**. Pertahankan bukti implementasi sebelumnya sebagai riwayat; jangan menganggap seluruh checklist sudah tuntas hanya berdasarkan tes mock yang lulus.
