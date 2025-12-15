# Dokumentasi Registrasi dan Email Konfirmasi

## Overview

Sistem registrasi ORBfood memiliki dua alur berbeda:
1. **Registrasi Pelanggan (User)**: Memerlukan konfirmasi email dengan template custom
2. **Registrasi Toko**: Auto-confirm email, langsung aktif, tapi toko perlu approval admin

## Fitur Registrasi

### 1. Registrasi Pelanggan

**Alur:**
1. User mengisi form registrasi (nama, email, password)
2. Sistem mengirim email konfirmasi dengan template custom
3. User klik link konfirmasi di email
4. Akun aktif dan bisa login

**Karakteristik:**
- ✅ Email konfirmasi diperlukan
- ✅ Menggunakan custom email template (orange-red gradient)
- ✅ Link konfirmasi valid 24 jam
- ✅ Redirect ke `/auth/callback` setelah konfirmasi

### 2. Registrasi Toko

**Alur:**
1. User mengisi form registrasi + data toko (nama toko, alamat, deskripsi)
2. Sistem menggunakan API route `/api/auth/register-store`
3. Email **otomatis dikonfirmasi** (tidak perlu klik link)
4. Store record dibuat dengan status `pending`
5. User bisa langsung login
6. Toko hanya muncul di daftar setelah admin approve (status = `approved`)

**Karakteristik:**
- ✅ Email otomatis dikonfirmasi (auto-confirm)
- ✅ Store record dibuat dengan status `pending`
- ✅ User bisa langsung login tanpa konfirmasi email
- ✅ Toko tidak muncul di daftar sampai admin approve
- ✅ Admin bisa approve/reject toko di dashboard

## Custom Email Template

### Lokasi File
- Template HTML: `supabase/email-templates/confirm-email.html`
- Dokumentasi Setup: `supabase/email-templates/README.md`

### Fitur Template
- 🎨 Design sesuai tema ORBfood (orange-red gradient)
- 📱 Responsive dan mobile-friendly
- ✉️ Menggunakan variable Supabase (`{{ .Email }}`, `{{ .ConfirmationURL }}`)
- 🔒 Link konfirmasi valid 24 jam

### Setup di Supabase Dashboard

1. Login ke [Supabase Dashboard](https://app.supabase.com)
2. Pilih project → **Authentication** → **Email Templates**
3. Pilih template **"Confirm signup"**
4. Copy isi dari `supabase/email-templates/confirm-email.html`
5. Paste ke editor dan save

**PENTING**: Jangan ubah variable `{{ .ConfirmationURL }}` dan `{{ .Email }}` karena ini diperlukan oleh Supabase.

## Struktur Database

### Tabel `users`
- `id` (UUID, primary key)
- `email` (string)
- `full_name` (string)
- `phone` (string, nullable)
- `role` (enum: 'user', 'toko', 'admin')
- `created_at` (timestamp)

### Tabel `stores`
- `id` (UUID, primary key)
- `user_id` (UUID, foreign key ke users)
- `name` (string) - Nama toko
- `description` (text, nullable) - Deskripsi toko
- `address` (string) - Alamat toko
- `status` (enum: 'pending', 'approved', 'rejected') - Status approval
- `is_open` (boolean) - Status buka/tutup
- `created_at` (timestamp)

## API Routes

### POST `/api/auth/register-store`

Registrasi toko dengan auto-confirm email.

**Request Body:**
```json
{
  "email": "toko@example.com",
  "password": "password123",
  "fullName": "Nama Pemilik",
  "phone": "081234567890",
  "storeName": "Nama Toko",
  "storeAddress": "Alamat Toko",
  "storeDescription": "Deskripsi toko (opsional)"
}
```

**Response Success:**
```json
{
  "success": true,
  "message": "Registrasi toko berhasil...",
  "user": {
    "id": "uuid",
    "email": "toko@example.com"
  },
  "store": {
    "id": "uuid",
    "name": "Nama Toko",
    "status": "pending"
  }
}
```

**Response Error:**
```json
{
  "error": "Error message"
}
```

## Flow Diagram

### Registrasi Pelanggan
```
User → Form Registrasi → Supabase Auth (signUp)
  ↓
Email Konfirmasi (Custom Template)
  ↓
User Klik Link → Supabase Auth Callback
  ↓
Akun Aktif → Login
```

### Registrasi Toko
```
User → Form Registrasi + Data Toko → API Route (/api/auth/register-store)
  ↓
Admin Client (auto-confirm email)
  ↓
Create User + Create Store (status: pending)
  ↓
Akun Aktif → Login (toko belum muncul)
  ↓
Admin Approve → Toko Muncul di Daftar
```

## Approval Toko

Toko yang baru registrasi memiliki status `pending` dan:
- ✅ User bisa login
- ✅ User bisa akses dashboard toko
- ✅ User bisa manage menu
- ❌ Toko **tidak muncul** di daftar untuk pelanggan
- ❌ Pelanggan **tidak bisa** pesan dari toko ini

Setelah admin approve (ubah status ke `approved`):
- ✅ Toko muncul di daftar untuk pelanggan
- ✅ Pelanggan bisa pesan dari toko ini

## Environment Variables

Pastikan environment variables berikut sudah di-set:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key  # Untuk API route register-store
```

## Troubleshooting

### Email konfirmasi tidak terkirim
- Cek SMTP settings di Supabase Dashboard
- Pastikan email tidak masuk spam folder
- Verifikasi template sudah di-setup dengan benar

### Toko tidak muncul setelah approve
- Cek query di `app/user/home/page.tsx` - pastikan filter `status = 'approved'`
- Verifikasi status toko di database
- Pastikan `is_open = true` untuk toko yang buka

### Auto-confirm email toko tidak bekerja
- Pastikan `SUPABASE_SERVICE_ROLE_KEY` sudah di-set
- Cek API route `/api/auth/register-store` berfungsi
- Verifikasi admin client bisa create user dengan `email_confirm: true`

### Template email tidak muncul
- Pastikan sudah save template di Supabase Dashboard
- Clear cache browser
- Cek apakah menggunakan variable yang benar (`{{ .ConfirmationURL }}`)

## Testing

### Test Registrasi Pelanggan
1. Daftar sebagai pelanggan
2. Cek email inbox
3. Klik link konfirmasi
4. Login dan verifikasi akun aktif

### Test Registrasi Toko
1. Daftar sebagai toko (isi semua field termasuk nama toko dan alamat)
2. Verifikasi bisa langsung login (tanpa konfirmasi email)
3. Cek dashboard toko - store status harus "pending"
4. Login sebagai admin
5. Approve toko
6. Login sebagai pelanggan
7. Verifikasi toko muncul di daftar

## Catatan Penting

1. **Service Role Key**: Jangan expose `SUPABASE_SERVICE_ROLE_KEY` di client-side. Hanya gunakan di API routes server-side.

2. **Email Template**: Variable Supabase harus menggunakan format `{{ .VariableName }}` dengan titik di depan.

3. **Store Status**: Hanya toko dengan status `approved` yang muncul di daftar untuk pelanggan.

4. **Auto-confirm**: Untuk toko, email otomatis dikonfirmasi menggunakan Admin API, jadi user tidak perlu klik link konfirmasi.

5. **Security**: Pastikan RLS policies sudah di-setup dengan benar untuk mencegah unauthorized access.
