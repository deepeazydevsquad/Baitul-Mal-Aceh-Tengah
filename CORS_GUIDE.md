# CORS Configuration Guide

## Masalah CORS dan Solusi

### 1. **Update Allowed Origins di `app.js`**

Pastikan domain hosting Anda sudah ditambahkan ke `ALLOWED_ORIGINS`:

```javascript
const ALLOWED_ORIGINS = [
  // Development
  "http://localhost:5173",
  "http://localhost:3000",
  // Production - Ganti dengan domain Anda
  "https://yourdomain.com",
  "https://www.yourdomain.com",
  "https://api.yourdomain.com",
];
```

### 2. **Environment Variable Setup**

Pastikan `.env` file sudah benar:

```
NODE_ENV=production
PORT=3001
DB_HOST=your-database-host
DB_USER=your-db-user
DB_PASSWORD=your-db-password
SESSION_SECRET=your-secure-secret-key
```

### 3. **Server-Side Preflight Request**

Pastikan preflight request (OPTIONS) ditangani dengan benar. Sudah ditambahkan:

```javascript
app.options("*", cors());
```

### 4. **Client-Side Headers**

Pastikan client mengirim request dengan headers yang tepat:

```javascript
fetch("https://api.yourdomain.com/endpoint", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: "Bearer token-if-needed",
  },
  credentials: "include", // Jika menggunakan session/cookies
  body: JSON.stringify(data),
});
```

### 5. **Development vs Production**

Untuk development, CORS akan allow all origins:

```javascript
if (process.env.NODE_ENV === "development") {
  return callback(null, true);
}
```

Set `NODE_ENV=development` saat testing lokal.

### 6. **Debugging CORS Error**

Jika masih dapat CORS error, check:

- Browser console: Lihat error message yang detail
- Server logs: Cek apakah origin di-block
- Network tab: Lihat response dari preflight (OPTIONS) request
- Domain SSL: Pastikan domain memiliki SSL certificate yang valid

### 7. **Common Issues**

**Issue: "Not allowed by CORS"**

- Solusi: Tambahkan domain ke ALLOWED_ORIGINS

**Issue: Preflight request failed**

- Solusi: Pastikan `app.options("*", cors())` sudah ditambahkan

**Issue: Credentials error**

- Solusi: Pastikan `credentials: true` di CORS config dan client menggunakan `credentials: 'include'`

**Issue: Protocol mismatch (http vs https)**

- Solusi: Pastikan semua request menggunakan https di production

### 8. **Testing CORS Locally**

```bash
# Test dengan curl
curl -H "Origin: http://localhost:5173" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -X OPTIONS http://localhost:3001/api/endpoint -v
```

## Checklist untuk Hosting

- [ ] Semua domain sudah ditambahkan ke ALLOWED_ORIGINS
- [ ] `.env` file sudah dikonfigurasi dengan benar
- [ ] `NODE_ENV=production` di server
- [ ] SSL certificate sudah installed
- [ ] Database connection sudah tested
- [ ] Restart server setelah mengubah ALLOWED_ORIGINS
