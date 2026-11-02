# Verifikasi Issue 006

Tanggal verifikasi: 2026-11-02

Status: **implementasi lokal dan revisi R1-R4 selesai; verifikasi MySQL nyata belum dapat dijalankan karena Docker daemon tidak tersedia**.

Revisi setelah `006-review.md` dicatat terpisah di [006-review-followup.md](006-review-followup.md).
Revisi setelah `006-review-2.md` dicatat di [006-review-2-followup.md](006-review-2-followup.md).

## Ringkasan perubahan

### A - Riwayat permohonan member

- Endpoint hapus riwayat sekarang melakukan pembatalan yang mempertahankan row, bukan hard delete.
- Pemeriksaan pemilik dan row parent memakai `transaction` dan `FOR UPDATE`.
- Pembatalan ditolak dengan 404 untuk record yang bukan milik member dan 409 jika sudah disurvei, divalidasi, diputuskan, disetujui, atau direalisasi.
- Permohonan tahap awal diubah menjadi `status=terhenti` dengan alasan pembatalan. ENUM dan migration tidak berubah.
- Setelah parent dikunci, realisasi, survei, monev, dan berkas validasi dibaca dengan locking/current read.
- Client menampilkan aksi "Batalkan permohonan" hanya saat server menandai `can_cancel`, serta menampilkan penanda bahwa riwayat tetap tersimpan.

### B - Referensi dokumen bersama

- Penggantian berita acara, pembatalan realisasi, dan penggantian dokumen syarat tidak lagi memanggil `unlink` langsung setelah commit.
- Edit/remove dokumen pada permohonan administrator juga memakai antrean transaksi yang sama.
- File lama dicatat dalam tabel `Stored_file_cleanups` di transaksi yang sama.
- Rekonsiliasi tersedia di `server/scripts/reconcile-stored-file-cleanups.js`. Mode default hanya melapor; `--apply` mensyaratkan `--writers-stopped` dan memeriksa ulang referensi pada berita acara, bukti transfer, MOU, dokumen syarat, serta file survei sebelum menghapus.
- Query unggah massal mengunci parent sebelum child, memakai urutan ID, dan menolak row yang sudah memiliki berita acara agar dua request tidak saling menimpa.
- Migration baru: `server/migrations/20261102170000-create-stored-file-cleanup.js`. Migration ini harus dijalankan sebelum kode baru menangani penggantian/pembatalan dokumen.

### C - Hasil transaksi upload

- Hook `res.once("finish")` berbasis HTTP >= 400 di alur realisasi/berita acara dihapus.
- Controller tidak lagi membersihkan upload berdasarkan status respons.
- Validasi multipart yang gagal membersihkan hanya upload request yang baru.
- Rollback pasti membersihkan upload baru; commit pasti mempertahankannya.
- Commit atau rollback yang acknowledgement-nya hilang mengembalikan 503 dan mempertahankan file.
- Notifikasi WhatsApp dipindah ke setelah commit dan kegagalannya tidak mengubah keputusan menjadi transaksi gagal.

### D - Transisi realisasi atomik

- Model mengunci `Permohonan` lebih dahulu, lalu `Realisasi_permohonan`.
- Status, nominal, batas biaya terkini, dan bukti diperiksa dari row yang dikunci.
- Update memakai kondisi `id + status=approve + status_realisasi=belum_direalisasi`; nol row dianggap konflik 409.
- Request realisasi yang kalah tidak mengirim notifikasi dan upload barunya dibersihkan hanya setelah rollback pasti.

### E - Batas multipart

- Parser survei memakai batas `fields=32`, `parts=44`, `fieldSize=16 KiB`, `files=12`, `fileSize=1 MiB`, dan `fieldNameSize=128`.
- Ingress Apache dalam repository memakai `LimitRequestBody 13631488` (13 MiB).
- Parser `pengaturan_umum` memakai batas `files=4`, `fields=16`, `parts=24`, `fieldSize=8 KiB`, dan `fieldNameSize=64`.
- Proxy eksternal di luar repository tetap harus diselaraskan secara operasional; konfigurasi tersebut tidak diverifikasi oleh issue ini.

### F - Scope capability survei

- `req.surveyCapability.id` dan `kegiatan_id` adalah sumber identitas setelah parser multipart.
- Middleware tidak lagi menulis `access_code` ke body, dan metadata `access_code` dari multipart dibuang.
- Validator, model info, pencarian permohonan, pemeriksaan member, dan penyimpanan survei memakai capability ID terverifikasi.
- Pemeriksaan capability aktif, scope kegiatan, eligibility member, dan survei ulang tetap dipertahankan.

### G - Keputusan bantuan dan periode bulanan

- `Op` diimpor dari model Sequelize dan jalur sukses approval/rejection kembali berjalan.
- Approval memerlukan minimal satu berkas dan semua berkas berstatus `approve`.
- Generator bulanan mengunci kegiatan sehingga approval paralel dalam seri yang sama diserialkan.
- Status berkas dan keberadaan periode dibaca dengan locking read setelah lock kegiatan diperoleh.
- Hanya bulan yang belum ada untuk `member_id + kegiatan_id + bulan + tahun kegiatan` yang dibuat.
- `periode_key` dan unique index menjadi pengaman terakhir. Migration baru melakukan preflight duplikat dan berhenti tanpa menghapus histori bila konflik ditemukan.
- Approve/reject berkas memakai lock parent, realisasi, lalu berkas serta memeriksa ulang status di transaksi.
- Writer survei/monev ikut mengunci parent agar tidak berlomba dengan pembatalan member.
- Keputusan final tidak dapat diulang, dan notifikasi tetap setelah commit.
- Identitas `member/kegiatan` yang sudah memiliki realisasi bersifat immutable; tahun kegiatan juga ditolak berubah setelah ada realisasi.

## Bukti tes

Perintah dari root:

```text
node doc/security/audit-2026-11-02-repro.cjs
```

Exit code: **1**. Script berhenti pada assertion lama `member-delete` karena model tidak lagi mengirim hard delete. Ini adalah hasil yang diharapkan: script historis meng-assert perilaku rentan dan tidak diubah menjadi tes keamanan. Perilaku aman untuk seluruh bagian A-G diverifikasi oleh suite regresi baru.

Perintah dari `server`:

```text
npm.cmd test -- --runInBand --silent
```

Exit code: **0**.

- 33 suite lulus.
- 204 tes lulus.
- 0 suite/tes gagal.

Tes regresi yang ditambahkan/diperluas:

- `server/__tests__/member-history-integrity.test.js`: ownership, histori final, realisasi tanpa survei, pembatalan awal, dan konflik state.
- `server/__tests__/assistance-document-transaction.test.js`: file bersama, pembatalan lintas kegiatan, dua request realisasi, notifikasi setelah commit, rollback pasti/tidak pasti, dan commit acknowledgement hilang melalui controller.
- `server/__tests__/validation-file-integrity.test.js`: dokumen syarat bersama serta tiga hasil transaksi edit file.
- `server/__tests__/validation-decision.test.js`: approval/rejection sukses, berkas belum lengkap, keputusan final, deduplikasi bulanan, WhatsApp gagal, dan commit tidak pasti.
- `server/__tests__/parent-child-lock-integrity.test.js`: interleaving pembatalan versus approve berkas dan lock parent pada monev.
- `server/__tests__/monthly-period-integrity.test.js`: business key, preflight duplikat, dan unique index periode bulanan.
- `server/__tests__/admin-edit-integrity.test.js`: replace/remove file bersama pada edit administrator, penolakan identitas, upload tak terpakai, dan commit tidak pasti.
- `server/__tests__/program-period-integrity.test.js`: perubahan tahun kegiatan setelah realisasi ditolak.
- `server/__tests__/survey-upload-security.test.js`: router utuh dengan formulir maksimum 12 file tanpa `access_code`, code kegiatan lain diabaikan, field berlebih, field oversized, dan scope capability; batas `parts` juga ditetapkan pada parser yang diuji.
- `server/__tests__/survey-capability-security.test.js`: identitas capability tidak berasal dari body.
- `server/__tests__/pengaturan-upload-limits.test.js`: batas parser gambar pengaturan umum.
- `server/__tests__/upload-storage-security.test.js`: batas path penyimpanan tetap lulus.

## Verifikasi database

`docker info --format '{{.ServerVersion}}'` gagal karena Docker Desktop/daemon tidak tersedia:

```text
error during connect: dockerDesktopLinuxEngine: The system cannot find the file specified.
```

Karena itu:

- Tidak ada klaim bahwa konkurensi MySQL nyata telah diuji.
- Tes konkurensi saat ini adalah interleaving/mock deterministik terhadap conditional update dan lock ordering.
- Verifikasi cascade parent/child pada MySQL terisolasi belum dijalankan.
- Rekonsiliasi file belum dijalankan terhadap storage/DB nyata.

## Frontend dan build

Pemeriksaan tipe:

```text
npm.cmd run type-check
```

Exit code: **1**. Kegagalan berasal dari file lama yang tidak terkait dan tidak berubah, `client/src/modules/template_table.vue:53`, yang berisi placeholder `...` di dalam `interface`. File template tersebut tidak diimpor oleh aplikasi.

Build final:

```text
npm.cmd run build
```

Exit code: **0**, 1.813 modul ditransformasi. Jumlah percobaan build dalam seluruh riwayat issue: **2**; build pertama sebelum revisi UI, build kedua setelah revisi UI. Keduanya berhasil.

Build menghasilkan peringatan non-fatal mengenai data browserslist/baseline yang lama, aset `pattern1.png`, CSS minifier, dan ukuran chunk.

## Risiko dan tindak lanjut operasional

- Jalankan migration `20261102170000-create-stored-file-cleanup.js` sebelum deploy kode ini.
- Jalankan migration `20261102180000-enforce-unique-monthly-periods.js`; jika preflight menemukan duplikat, rekonsiliasi data terlebih dahulu.
- Jalankan rekonsiliasi cleanup dalam maintenance window dengan writer dihentikan; mode `--apply` tanpa `--writers-stopped` sengaja ditolak.
- Samakan batas body 13 MiB pada reverse proxy eksternal jika ada lapisan proxy di luar repository.
- Type-check client tetap memiliki error lama di `template_table.vue`; build aplikasi lulus karena file tersebut tidak diimpor.
- Member/kegiatan pada edit permohonan dan tahun kegiatan setelah memiliki realisasi perlu diubah melalui proses rekonsiliasi bisnis, bukan update identitas biasa.
- Uji MySQL terisolasi dan stress ringan dua request konkuren masih diperlukan sebelum klaim verifikasi database produksi.
- Pengujian MySQL perlu memastikan transaksi memakai REPEATABLE READ, locking read melihat commit setelah menunggu lock kegiatan, dan unique index menolak penulisan periode yang sama.

Tidak ada commit, push, deploy, atau pemanggilan WhatsApp nyata.
