# 🔧 Troubleshooting Login

## ❌ Error: "Invalid login credentials"

### Penyebab
1. **Email belum terdaftar** di Supabase Auth
2. **Password salah**
3. **Email belum dikonfirmasi** (jika email confirmation enabled)

### Solusi

#### 1. Pastikan User Sudah Terdaftar

**Opsi A: Register via Aplikasi**
1. Buka halaman `/register`
2. Isi form registrasi
3. Submit
4. Login dengan email dan password yang baru dibuat

**Opsi B: Create User via Supabase Dashboard**
1. Buka Supabase Dashboard
2. Authentication > Users
3. Klik "Add user" atau "Invite user"
4. Isi email dan password
5. User akan otomatis dibuat di `auth.users`
6. Trigger akan otomatis membuat profile di `public.users`

**Opsi C: Create User via SQL**
```sql
-- Insert user ke auth.users (hanya untuk testing)
-- Catatan: Ini tidak recommended untuk production
-- Lebih baik gunakan Supabase Auth API

-- Untuk testing, gunakan Supabase Dashboard > Authentication > Users
```

#### 2. Cek User di Database

Jalankan query ini di Supabase Dashboard > SQL Editor:

```sql
-- Cek user di auth.users
SELECT id, email, created_at, email_confirmed_at
FROM auth.users
WHERE email = 'email-anda@example.com';

-- Cek user di public.users
SELECT id, email, role, full_name
FROM public.users
WHERE email = 'email-anda@example.com';
```

#### 3. Pastikan Email Sudah Dikonfirmasi

Jika email confirmation enabled:
- Cek email inbox untuk link konfirmasi
- Atau disable email confirmation untuk development:
  - Supabase Dashboard > Authentication > Settings
  - Disable "Enable email confirmations"

#### 4. Reset Password (Jika Lupa)

**Via Aplikasi:**
- Tambahkan fitur "Forgot Password" (belum ada)

**Via Supabase Dashboard:**
1. Authentication > Users
2. Cari user
3. Klik "..." > "Reset password"
4. User akan menerima email reset password

**Via SQL (untuk testing):**
```sql
-- Update password user (hanya untuk testing)
-- Catatan: Password harus di-hash dengan bcrypt
-- Lebih baik gunakan Supabase Dashboard atau Auth API
```

## ✅ Checklist Login

Sebelum login, pastikan:

- [ ] User sudah terdaftar di Supabase Auth
- [ ] Email dan password benar
- [ ] Email sudah dikonfirmasi (jika email confirmation enabled)
- [ ] User profile sudah dibuat di `public.users` (otomatis via trigger)
- [ ] Trigger `on_auth_user_created` sudah aktif
- [ ] Function `handle_new_user()` sudah ada
- [ ] RLS policies sudah dibuat
- [ ] GRANT permissions sudah diberikan

## 🧪 Test Login Flow

### 1. Test Register
```bash
# 1. Buka /register
# 2. Isi form:
#    - Nama: Test User
#    - Email: test@example.com
#    - Password: test123456
#    - Role: Pelanggan
# 3. Submit
# 4. Harus redirect ke /login
```

### 2. Test Login
```bash
# 1. Buka /login
# 2. Isi email dan password yang baru dibuat
# 3. Submit
# 4. Harus redirect ke dashboard sesuai role:
#    - admin → /admin/dashboard
#    - toko → /toko/dashboard
#    - user → /user/home
```

### 3. Check Console Logs

Buka browser console (F12) dan perhatikan log:
- `🔐 Attempting login...` - Login dimulai
- `✅ Auth successful, user ID: ...` - Auth berhasil
- `🔄 Fetching user profile (attempt X/5)...` - Mencari user profile
- `✅ User profile found, role: ...` - User profile ditemukan
- `🚀 Redirecting to: ...` - Redirect dimulai

Jika ada error:
- `❌ Auth error:` - Error saat login
- `⚠️ Error fetching user` - Error saat fetch user profile
- `❌ Login error:` - Error umum

## 🐛 Common Issues

### Issue 1: User tidak ada di public.users setelah register

**Penyebab:** Trigger tidak jalan atau gagal

**Solusi:**
1. Jalankan `supabase/SETUP_AUTO_USER_PROFILE.sql`
2. Atau jalankan migration 4: `20251215000004_auto_user_profile.sql`
3. Check trigger status:
```sql
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
```

### Issue 2: Error 500 saat fetch user role

**Penyebab:** RLS policy atau GRANT permissions kurang

**Solusi:**
1. Jalankan migration 2: `20251215000002_rls_policies.sql`
2. Jalankan migration 3: `20251215000003_grants.sql`
3. Atau jalankan `supabase/FIX_USER_CREATION.sql`

### Issue 3: Login berhasil tapi tidak redirect

**Penyebab:** User profile tidak ditemukan setelah beberapa retry

**Solusi:**
1. Check apakah user ada di `public.users`
2. Check console untuk error detail
3. Pastikan trigger sudah jalan dan user profile sudah dibuat

### Issue 4: "Email not confirmed" error

**Penyebab:** Email confirmation enabled tapi email belum dikonfirmasi

**Solusi:**
1. Cek email inbox untuk link konfirmasi
2. Atau disable email confirmation untuk development:
   - Supabase Dashboard > Authentication > Settings
   - Disable "Enable email confirmations"

## 📝 Quick Reference

### Create Test User via Supabase Dashboard

1. **Supabase Dashboard** > **Authentication** > **Users**
2. Klik **"Add user"** atau **"Invite user"**
3. Isi:
   - Email: `test@example.com`
   - Password: `test123456`
   - Auto Confirm User: ✅ (untuk development)
4. Klik **"Create user"**
5. User akan otomatis dibuat di `auth.users`
6. Trigger akan otomatis membuat profile di `public.users` dengan role `user`

### Set Admin Role

1. **Supabase Dashboard** > **Table Editor** > **users**
2. Cari user yang ingin jadi admin
3. Edit kolom `role` → ubah dari `user` menjadi `admin`
4. Save

### Set Toko Role

1. **Supabase Dashboard** > **Table Editor** > **users**
2. Cari user yang ingin jadi toko
3. Edit kolom `role` → ubah dari `user` menjadi `toko`
4. Save

## 🔍 Debug Commands

### Check User Status
```sql
-- Check user di auth.users
SELECT id, email, created_at, email_confirmed_at, confirmed_at
FROM auth.users
ORDER BY created_at DESC;

-- Check user di public.users
SELECT id, email, role, full_name, created_at
FROM public.users
ORDER BY created_at DESC;

-- Check missing users
SELECT 
  au.id,
  au.email,
  au.created_at as auth_created_at
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL;
```

### Check Trigger & Function
```sql
-- Check trigger
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';

-- Check function
SELECT * FROM pg_proc WHERE proname = 'handle_new_user';
```

### Check RLS Policies
```sql
SELECT policyname, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'users';
```

### Check Grants
```sql
SELECT grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND table_name = 'users'
  AND grantee IN ('authenticated', 'anon');
```















