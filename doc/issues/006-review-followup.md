# Tindak Lanjut Review Issue 006

Tanggal: 2026-11-02.

Status: **R1 dan R2 sudah direvisi; verifikasi MySQL nyata tetap belum dijalankan**.

## R1 - Snapshot lama periode bulanan

Perbaikan:

- Setelah lock kegiatan diperoleh, status berkas dibaca dengan locking/current read (`FOR UPDATE`).
- Query keberadaan bulan berikutnya juga memakai locking/current read sehingga melihat row yang di-commit transaksi yang baru melepas lock kegiatan.
- `validationFiles` yang dipakai sebagai template sekarang dibaca dengan lock, bukan snapshot konsisten lama.
- Ditambahkan kunci bisnis `member_id:kegiatan_id:tahun:bulan` pada `Realisasi_permohonan.periode_key`.
- Migration `20261102180000-enforce-unique-monthly-periods.js` memasang unique index `realisasi_periode_bulanan_unique`.
- Migration melakukan preflight duplikat sebelum perubahan skema. Jika data lama duplikat, migration berhenti dan menampilkan contoh konflik; record tidak dihapus atau digabung otomatis.
- Semua pembuat realisasi bulanan di repository mengisi `periode_key`: pengajuan member, pengajuan administrator, dan generator bulanan.

Regression test:

- Snapshot transaksi kedua tetap berisi bulan awal `[1, 2]`.
- Locking read transaksi kedua melihat bulan `3-12` yang sudah di-commit transaksi pertama.
- Dua approval hanya menghasilkan total 10 row baru untuk bulan `3-12`, bukan 20.
- Status berkas stale `process` tidak dipakai setelah locking read membaca `approve`.
- Helper key dan preflight migration diuji tanpa database nyata.

## R2 - Approve/reject berkas dan pembatalan member

Perbaikan:

- `approve_berkas` dan `reject_berkas` sekarang memakai urutan lock `Permohonan -> Realisasi_permohonan -> Validasi_syarat_permohonan`.
- Parent harus masih `sedang_berlangsung`; realisasi harus masih pada tahap process/process_lapangan.
- Status berkas diperiksa ulang di dalam transaksi setelah row berkas dikunci.
- Approval/rejection ulang terhadap berkas yang sudah final ditolak dengan 409.
- Pembatalan member membaca realisasi, survei, monev, dan berkas validasi dengan locking read setelah parent dikunci.
- Writer survei mengunci parent, mengunci realisasi eligible, dan memeriksa survei ulang secara current sebelum insert.
- Writer monev mengunci parent dan menolak parent yang sudah tidak aktif.

Regression test:

- Berkas yang parent-nya sudah `terhenti` tidak dapat di-approve atau di-reject.
- Interleaving approval berkas lebih dahulu membuat pembatalan member berikutnya gagal.
- Interleaving pembatalan member lebih dahulu membuat keputusan berkas berikutnya gagal tanpa mengubah berkas.
- Survei terhadap parent yang sudah dibatalkan tidak membuat row.
- Monev terhadap parent yang sudah dibatalkan tidak membuat row.

## Verifikasi

Perintah dari `server`:

```text
npm.cmd test -- --runInBand --silent
```

Exit code: **0**.

- 31 suite lulus.
- 198 tes lulus.

Tidak menjalankan build tambahan karena revisi ini hanya mengubah backend, migration, dan tes; build client sebelumnya tetap menjadi satu-satunya percobaan build dalam Issue 006.

Verifikasi MySQL nyata masih belum dilakukan karena Docker daemon tidak tersedia. Tes snapshot dan lock ordering merupakan simulasi deterministik terhadap semantics REPEATABLE READ, bukan klaim pengujian dua koneksi MySQL.
