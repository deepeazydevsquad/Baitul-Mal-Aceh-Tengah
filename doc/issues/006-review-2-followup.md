# Tindak Lanjut Review Kedua Issue 006

Tanggal: 2026-11-02.

Status: **R3 dan R4 sudah direvisi; verifikasi MySQL nyata tetap belum dijalankan**.

## R3 - Dokumen bersama pada edit permohonan administrator

- Edit `replace` dan `remove` tidak lagi menjadwalkan `unlink` setelah commit.
- Path lama dimasukkan ke `Stored_file_cleanups` dalam transaksi edit yang sama.
- Upload baru yang tidak dipakai juga masuk antrean cleanup, bukan dihapus langsung sebelum hasil transaksi diketahui.
- Penghapusan permohonan administrator mengantrekan seluruh dokumen child; file bersama tetap tersedia sampai rekonsiliasi memastikan tidak ada referensi.
- Model mengunci parent, realisasi, dan dokumen yang diedit. Dokumen lama dibaca dengan current/locking read.
- Controller edit tidak lagi membersihkan upload berdasarkan status respons.
- Commit acknowledgement yang hilang mempertahankan upload baru dan file lama; rollback pasti membersihkan upload baru.

Regression test:

- Replace Maret mengantrekan `shared.pdf`; referensi April tidak berubah dan tidak ada `unlink`.
- Remove Maret mengantrekan `shared.pdf`; record April tetap menunjuk file tersebut.
- Upload baru yang tidak dipakai masuk antrean cleanup.
- Commit tidak pasti menghasilkan 503 dan tidak menghapus upload.

## R4 - Identitas bisnis dan periode key

- `member_id` dan `kegiatan_id` tidak dapat diubah melalui edit permohonan setelah realisasi dibuat. Request ditolak 409 sebelum parent atau dokumen diubah.
- Field kegiatan/member pada UI edit permohonan dinonaktifkan dengan penjelasan.
- `tahun` kegiatan tidak dapat diubah jika kegiatan sudah memiliki realisasi. Request ditolak 409 sebelum update kegiatan.
- UI edit kegiatan menampilkan bahwa tahun terkunci jika sudah ada realisasi; server tetap menjadi sumber keputusan.
- Perubahan bank, rekening, nama akun, dan dokumen tetap dapat dilakukan terhadap identitas bisnis yang sama.
- Dengan demikian `periode_key` tidak dapat menyimpang akibat mutasi `member_id`, `kegiatan_id`, atau `tahun`.

Regression test:

- Perubahan member ditolak tanpa update parent atau dokumen parsial.
- Edit normal mempertahankan member/kegiatan pada key yang sama.
- Perubahan tahun kegiatan yang sudah memiliki realisasi ditolak sebelum `Kegiatan.update`.

## Verifikasi

Perintah dari `server`:

```text
npm.cmd test -- --runInBand --silent
```

Exit code: **0**.

- 33 suite lulus.
- 204 tes lulus.

Build client revisi:

```text
npm.cmd run build
```

Exit code: **0**; 1.813 modul ditransformasi. Ini adalah build kedua dalam riwayat Issue 006 karena revisi UI dilakukan setelah build pertama; kedua percobaan berhasil.

Verifikasi MySQL nyata belum dijalankan karena Docker daemon tidak tersedia. Unique key, lock ordering, file queue, dan penolakan identitas diverifikasi melalui model asli dengan mock database/storage.
