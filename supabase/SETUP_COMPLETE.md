# Setup Lengkap Registrasi dan Email ORBfood

## 📋 Checklist Setup

### 1. Database Setup
- [ ] Jalankan script `UPDATE_TRIGGER_WITH_ROLE.sql` di Supabase SQL Editor
- [ ] Verifikasi trigger `on_auth_user_created` sudah aktif
- [ ] Verifikasi function `handle_new_user()` sudah dibuat

### 2. Email Template Setup
- [ ] Buka Supabase Dashboard → Authentication → Email Templates
- [ ] Edit template "Confirm signup"
- [ ] Copy isi dari `supabase/email-templates/confirm-email.html`
- [ ] Paste ke editor dan save
- [ ] Test dengan registrasi user baru

### 3. Environment Variables
Pastikan file `.env.local` berisi:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 4. Testing
- [ ] Test registrasi pelanggan (perlu konfirmasi email)
- [ ] Test registrasi toko (auto-confirm, langsung login)
- [ ] Verifikasi user masuk ke `auth.users` dan `public.users`
- [ ] Verifikasi role sesuai (user/toko)
- [ ] Verifikasi email menggunakan template custom

## 🔧 Script SQL yang Perlu Dijalankan

### 1. Update Trigger (WAJIB)
Jalankan file: `supabase/UPDATE_TRIGGER_WITH_ROLE.sql`

Script ini akan:
- Update function `handle_new_user()` untuk membaca role dari metadata
- Update trigger `on_auth_user_created`
- Memastikan user profile dibuat dengan role yang benar
- **PENTING**: Logic admin tetap sama (deteksi via email list) - tidak diubah

**Cara menjalankan:**
1. Buka Supabase Dashboard → SQL Editor
2. Copy isi file `UPDATE_TRIGGER_WITH_ROLE.sql`
3. Paste ke SQL Editor
4. Klik "Run" atau tekan Ctrl+Enter
5. Verifikasi tidak ada error

### 2. Setup Auto User Profile (Opsional, jika belum)
Jalankan file: `supabase/SETUP_AUTO_USER_PROFILE.sql`

Script ini untuk:
- Setup trigger jika belum ada
- Sync user yang sudah ada

## 📧 Setup Email Template

### Langkah Detail:
1. **Buka Supabase Dashboard**
   - Login ke https://app.supabase.com
   - Pilih project ORBfood

2. **Buka Email Templates**
   - Klik **Authentication** di sidebar
   - Klik **Email Templates**

3. **Edit Template "Confirm signup"**
   - Klik pada template "Confirm signup"
   - Tab **Subject**: Ganti dengan "Konfirmasi Email Anda - ORBfood"
   - Tab **Body**: Hapus semua, paste isi dari `confirm-email.html`
   - Klik **Save**

4. **Verifikasi Variable**
   Pastikan variable berikut tidak diubah:
   - `{{ .Email }}`
   - `{{ .ConfirmationURL }}`

5. **Test**
   - Daftar user baru
   - Cek email inbox
   - Verifikasi template custom muncul

**Dokumentasi lengkap**: Lihat `supabase/email-templates/SETUP_EMAIL_TEMPLATE.md`

## 🔍 Verifikasi Setup

### Cek Trigger
Jalankan query di SQL Editor:
```sql
SELECT 
  tgname as trigger_name,
  tgrelid::regclass as table_name,
  tgenabled as is_enabled
FROM pg_trigger
WHERE tgname = 'on_auth_user_created';
```

Harus return 1 row dengan `is_enabled = 'O'` (enabled).

### Cek Function
Jalankan query:
```sql
SELECT 
  proname as function_name,
  prosecdef as is_security_definer
FROM pg_proc
WHERE proname = 'handle_new_user';
```

Harus return 1 row dengan `is_security_definer = true`.

### Cek User Sync
Jalankan query:
```sql
SELECT 
  (SELECT COUNT(*) FROM auth.users) as total_auth_users,
  (SELECT COUNT(*) FROM public.users) as total_public_users,
  (SELECT COUNT(*) FROM auth.users) - (SELECT COUNT(*) FROM public.users) as missing_users;
```

`missing_users` harus 0 (semua user sudah di-sync).

## 🧪 Testing

### Test Registrasi Pelanggan
1. Buka `/register`
2. Pilih "Pelanggan"
3. Isi form dan submit
4. **Verifikasi:**
   - ✅ User masuk ke `auth.users`
   - ✅ User masuk ke `public.users` dengan role 'user'
   - ✅ Email konfirmasi terkirim dengan template custom
   - ✅ Email berisi link konfirmasi
   - ✅ Perlu klik link konfirmasi untuk login

### Test Registrasi Toko
1. Buka `/register`
2. Pilih "Toko"
3. Isi form (termasuk nama toko dan alamat)
4. Submit
5. **Verifikasi:**
   - ✅ User masuk ke `auth.users`
   - ✅ User masuk ke `public.users` dengan role 'toko'
   - ✅ Store record dibuat dengan status 'pending'
   - ✅ Email otomatis dikonfirmasi (tidak perlu klik link)
   - ✅ Bisa langsung login tanpa konfirmasi email

### Catatan Admin
- ✅ Admin **TIDAK** dibuat via registrasi
- ✅ Admin dibuat manual via script: `npm run create-admin`
- ✅ Admin tidak perlu konfirmasi email (auto-confirm via admin API)
- ✅ Logic admin tetap sama (deteksi via email list di trigger)

### Test Email Template
1. Daftar sebagai pelanggan
2. Cek email inbox
3. **Verifikasi:**
   - ✅ Subject: "Konfirmasi Email Anda - ORBfood"
   - ✅ Body: Template custom dengan gradient orange-red
   - ✅ Button "Konfirmasi Email" terlihat
   - ✅ Link konfirmasi valid

## ⚠️ Troubleshooting

### User tidak masuk ke public.users
**Solusi:**
1. Cek trigger sudah aktif (lihat query di atas)
2. Jalankan script `UPDATE_TRIGGER_WITH_ROLE.sql` lagi
3. Cek error log di Supabase Dashboard → Logs

### Role tidak sesuai
**Solusi:**
1. Pastikan registrasi mengirim role di `user_metadata`
2. Cek trigger sudah update (jalankan script lagi)
3. Manual update role di Supabase Dashboard jika perlu

### Email masih default
**Solusi:**
1. Pastikan sudah save template di Supabase Dashboard
2. Clear cache browser
3. Test dengan user baru
4. Cek apakah template yang di-save sudah benar

### Email tidak terkirim
**Solusi:**
1. Cek SMTP settings di Supabase Dashboard
2. Pastikan SMTP sudah dikonfigurasi
3. Cek spam folder
4. Verifikasi email sender

## 📚 Dokumentasi Terkait

- `supabase/UPDATE_TRIGGER_WITH_ROLE.sql` - Script update trigger
- `supabase/email-templates/confirm-email.html` - Template email custom
- `supabase/email-templates/SETUP_EMAIL_TEMPLATE.md` - Panduan setup email template
- `docs/REGISTRASI_DAN_EMAIL.md` - Dokumentasi lengkap fitur

## ✅ Checklist Final

Setelah semua setup selesai, pastikan:

- [ ] Trigger `on_auth_user_created` aktif
- [ ] Function `handle_new_user()` membaca role dari metadata
- [ ] Email template custom sudah di-setup dan di-save
- [ ] Test registrasi pelanggan berhasil
- [ ] Test registrasi toko berhasil
- [ ] Email konfirmasi menggunakan template custom
- [ ] User masuk ke `auth.users` dan `public.users` dengan role yang benar
- [ ] Store record dibuat untuk toko dengan status 'pending'

---

**Catatan**: Jika ada masalah, cek log di Supabase Dashboard → Logs untuk error detail.
