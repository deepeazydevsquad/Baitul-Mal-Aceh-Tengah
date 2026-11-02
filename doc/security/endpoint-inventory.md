# Inventaris Endpoint dan Matriks Akses

Tanggal audit implementasi: 2026-11-02.

Sumber kebenaran inventaris adalah router yang benar-benar dimuat oleh
`server/app.js`, bukan pencocokan nama file. Jalankan dari direktori `server`
dengan environment test yang aman:

```text
node scripts/audit-route-inventory.js
node scripts/audit-route-inventory.js --json
```

Hasil saat implementasi: 304 method/path terdaftar.

Runtime dan inventaris memakai satu sumber kebijakan di
`server/security/routePolicy.js`. Pencocokan menormalisasi kapitalisasi dan
trailing slash sesuai bentuk path yang diterima router Express. Route yang
tidak memiliki kebijakan eksplisit ditolak `404` sebelum handler; route baru
tidak dapat menjadi publik hanya karena belum masuk pemetaan. Profil sendiri
tetap merupakan route terautentikasi tanpa permission menu.

| Kelas akses | Jumlah | Aturan |
| --- | ---: | --- |
| Admin berizin | 243 | Access token administrator, sesi aktif, akun masih ada, lalu `group_access` wajib cocok. Grup 1 adalah super-admin. |
| Member | 41 | Access token member dan scope pemilik dari sesi; `member_id` dari body tidak dipercaya. |
| Publik atau capability | 15 | Hanya login/refresh/logout berbasis refresh token, registrasi/OTP, running text publik, dan capability survei yang ditukar dari access code aktif serta dibatasi ke scope kegiatan/member. |
| Dokumen privat | 5 | Administrator berizin, pemilik member, atau access-code survei yang cocok dengan record. Path berasal dari record database, bukan parameter filesystem. |

Pemetaan menu/submenu mengikuti seed `group_access`:

| Prefix operasi | Menu/submenu |
| --- | --- |
| `/grup_akses` | 6/16 |
| `/daftar_pengguna` | 6/17 |
| `/pengaturan_umum` | 6/15 |
| `/pengaturan_whatsapp`, `/template_pesan_whatsapp`, `/riwayat_pesan_whatsapp` | 6/19 |
| `/system_log`, `/system_log_surveyor` | 6/20 |
| `/running_text`, `/image/logo` | 6/18 |
| `/daftar_keanggotaan`, `/request_keanggotaan` | 3/5 |
| `/daftar_asnaf` | 4/6 |
| `/daftar_program` | 4/7 |
| `/kecamatan`, `/desa` | 4/8 |
| `/bank`, `/bank_pengumpulan`, `/daftar_bank` | 4/9 |
| Distribusi, penetapan, survei, validasi, target distribusi | 2/3 |
| Pengumpulan, riwayat zakat/infaq/donasi, target pengumpulan | 2/1 |
| Kegiatan kesekretariatan | 2/4 |
| Laporan, rekap, unduhan laporan, tanda tangan | 5 |
| Beranda dan menu administrator | 1 |

Endpoint tanpa token pada route bantuan, pengguna, dokumen, dan operasi admin
ditolak sebelum validator/controller yang mengakses database. Access code
survei hanya diterima oleh `POST /survey_lapangan/session`; endpoint upload
memakai cookie capability yang ditandatangani dan divalidasi ke record aktif
sebelum Multer/Sharp dijalankan.

`server/__tests__/security.test.js` memeriksa bahwa seluruh 304 route tetap
terklasifikasi, seluruh route admin memiliki permission mapping, dan tidak ada
route admin yang kembali menjadi unmapped. Regresi runtime juga menguji variasi
huruf besar/kecil, trailing slash, scope member, penolakan sebelum handler, dan
route tanpa pemetaan.
