# Aplikasi Baitul Mal Bener Meriah

Aplikasi ini merupakan sistem manajemen transaksi penerimaan **zakat, infak, dan sedekah**, serta penyaluran bantuan di **Baitul Mal Bener Meriah**. Aplikasi ini dirancang untuk mempermudah pencatatan, pelaporan, dan pengelolaan dana secara **transparan** dan **akuntabel**, sehingga mendukung peningkatan pelayanan kepada masyarakat.

---

## Fitur Utama

- 📥 **Penerimaan Zakat, Infak, dan Sedekah**
- 📤 **Penyaluran Bantuan**
- 📊 **Laporan Keuangan**

---

## Teknologi yang Digunakan

- **Frontend**: Vue.js
- **Backend**: Express.js (Node.js)
- **Database**: MySQL

---

## Instalasi & Menjalankan

1. **Clone repository**

   ```bash
   git clone git@github.com:muammar88/Baitulmalacehtengah.git
   cd Baitulmalacehtengah
   ```

2. **Install dependencies**

   ```bash
   cd server && npm install
   cd ../client && npm install
   ```

3. **Setup database**

   - Buat database MySQL baru
   - Import file SQL dari folder `/db` (jika tersedia)
   - Sesuaikan konfigurasi koneksi di file `.env`

4. **Jalankan aplikasi**

   ```bash
   cd server && npm start
   cd ../client && npm run dev
   ```

5. **Akses aplikasi**
   ```
   http://localhost:3000
   ```

---

## Struktur Folder

```
Baitulmalacehtengah/
│── client/        # Frontend (Vue.js)
│── server/        # Backend (Express.js)
│── db/            # Database & migrasi
│── README.md
```

---

## Author

- **DeepEasy Dev Squad**

---

## Lisensi

Proyek ini **tidak memiliki lisensi** (All rights reserved).  
Kode sumber tidak boleh digunakan, disalin, dimodifikasi, atau didistribusikan tanpa izin dari pemilik.
