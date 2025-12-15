# Troubleshooting Error Registrasi

## ❌ Error: "Database error saving new user"

Error ini biasanya terjadi karena trigger gagal saat insert ke `public.users`.

## 🔧 Solusi

### Step 1: Jalankan Script Fix
Jalankan script `supabase/FIX_TRIGGER_ERROR.sql` di Supabase SQL Editor:

1. Buka Supabase Dashboard → SQL Editor
2. Copy semua isi dari `supabase/FIX_TRIGGER_ERROR.sql`
3. Paste ke SQL Editor
4. Klik "Run" atau tekan Ctrl+Enter
5. Verifikasi tidak ada error

### Step 2: Verifikasi RLS Policy
Pastikan RLS policy sudah benar dengan query:

```sql
-- Cek RLS enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'users';

-- Cek policies
SELECT policyname, cmd, roles 
FROM pg_policies 
WHERE tablename = 'users';
```

Harus ada policies:
- "Enable insert for trigger"
- "Enable insert for authenticated users"
- "Enable insert for anon"

### Step 3: Verifikasi Trigger
Cek trigger aktif:

```sql
SELECT 
  tgname as trigger_name,
  tgrelid::regclass as table_name,
  tgenabled as is_enabled
FROM pg_trigger
WHERE tgname = 'on_auth_user_created';
```

Harus return 1 row dengan `is_enabled = 'O'` (enabled).

### Step 4: Verifikasi Function
Cek function ada dan benar:

```sql
SELECT 
  proname as function_name,
  prosecdef as is_security_definer
FROM pg_proc
WHERE proname = 'handle_new_user';
```

Harus return 1 row dengan `is_security_definer = true`.

### Step 5: Cek Error Log
Cek error log di Supabase Dashboard:
1. Buka **Logs** → **Postgres Logs**
2. Filter untuk error terkait `handle_new_user` atau `users` table
3. Lihat detail error untuk debugging

## 🐛 Penyebab Umum

### 1. RLS Policy Blocking
**Gejala**: Error "new row violates row-level security policy"

**Solusi**: 
- Pastikan policy "Enable insert for trigger" ada
- Pastikan function menggunakan `SECURITY DEFINER`

### 2. Role Invalid
**Gejala**: Error "invalid input value for enum user_role"

**Solusi**:
- Pastikan role dari metadata adalah 'user' atau 'toko'
- Script fix sudah menambahkan validasi role

### 3. Constraint Violation
**Gejala**: Error "duplicate key value violates unique constraint"

**Solusi**:
- User mungkin sudah ada di `public.users`
- Trigger menggunakan `ON CONFLICT DO UPDATE` untuk handle ini

### 4. Function Error
**Gejala**: Error di function `handle_new_user`

**Solusi**:
- Cek error log untuk detail
- Pastikan function sudah di-update dengan script fix
- Function sekarang punya error handling yang lebih baik

## ✅ Checklist Verifikasi

Setelah menjalankan script fix, verifikasi:

- [ ] Trigger `on_auth_user_created` aktif
- [ ] Function `handle_new_user()` ada dan menggunakan `SECURITY DEFINER`
- [ ] RLS enabled di table `users`
- [ ] Policy "Enable insert for trigger" ada
- [ ] Policy "Enable insert for authenticated users" ada
- [ ] Policy "Enable insert for anon" ada
- [ ] Test registrasi user baru berhasil
- [ ] User masuk ke `auth.users` dan `public.users`

## 🧪 Testing

Setelah fix, test registrasi:

1. **Test Registrasi Pelanggan**:
   - Buka `/register`
   - Pilih "Pelanggan"
   - Isi form dan submit
   - Harus berhasil tanpa error

2. **Test Registrasi Toko**:
   - Buka `/register`
   - Pilih "Toko"
   - Isi form (termasuk nama toko dan alamat)
   - Submit
   - Harus berhasil tanpa error

3. **Verifikasi Database**:
   ```sql
   -- Cek user di auth.users
   SELECT id, email, created_at 
   FROM auth.users 
   ORDER BY created_at DESC 
   LIMIT 5;
   
   -- Cek user di public.users
   SELECT id, email, role, created_at 
   FROM public.users 
   ORDER BY created_at DESC 
   LIMIT 5;
   ```

## 📝 Catatan

- Function `handle_new_user()` menggunakan `SECURITY DEFINER` untuk bypass RLS
- Error handling sudah diperbaiki dengan try-catch
- Role validation sudah ditambahkan
- Warning log untuk debugging jika ada error
- User tetap dibuat di `auth.users` meskipun profile gagal (untuk debugging)

## 🔗 File Terkait

- `supabase/FIX_TRIGGER_ERROR.sql` - Script fix utama
- `supabase/UPDATE_TRIGGER_WITH_ROLE.sql` - Script update trigger
- `supabase/README_TRIGGER.md` - Dokumentasi trigger
