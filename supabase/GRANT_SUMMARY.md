# Summary Grant Permissions untuk Registrasi

## ✅ Grant untuk Registrasi USER (via form `/register`)

### Tabel `users`:
- ✅ `anon`: `SELECT, INSERT, UPDATE` - untuk registrasi user baru
- ✅ `authenticated`: `SELECT, INSERT, UPDATE` - untuk update profile
- ✅ `service_role`: `ALL` - untuk admin operations

### Function `handle_new_user()`:
- ✅ `anon`: `EXECUTE` - untuk trigger saat registrasi
- ✅ `authenticated`: `EXECUTE`
- ✅ `service_role`: `EXECUTE`
- ✅ `postgres`: `EXECUTE`

### RLS Policy:
- ✅ "Enable insert for anon" - mengizinkan anon insert ke users
- ✅ "Enable insert for authenticated users" - backup
- ✅ "Enable insert for trigger" - untuk trigger function

**Lokasi Grant:**
- Migration: `supabase/migrations/20251215000003_grants.sql`
- Fix Script: `supabase/FIX_REGISTRATION_ERROR.sql`

## ✅ Grant untuk Registrasi TOKO (via API `/api/auth/register-store`)

### Tabel `users`:
- ✅ `service_role`: `ALL` - API route menggunakan service_role
- ✅ Function `handle_new_user()` di-execute oleh trigger (SECURITY DEFINER)

### Tabel `stores`:
- ✅ `service_role`: `ALL` atau `SELECT, INSERT, UPDATE, DELETE` - untuk create store
- ✅ `authenticated`: `SELECT, INSERT, UPDATE` - untuk owner manage store
- ✅ `anon`: `SELECT` - untuk public view stores

### Function `handle_new_user()`:
- ✅ `service_role`: `EXECUTE` - untuk trigger saat create user

**Lokasi Grant:**
- Migration: `supabase/migrations/20251215000003_grants.sql`
- Fix Script: `supabase/FIX_REGISTRATION_ERROR.sql` (updated)

## 🔍 Verifikasi Grant

### Cara 1: Jalankan Script Verifikasi
```sql
-- Jalankan di Supabase SQL Editor
-- File: supabase/VERIFY_GRANTS.sql
```

### Cara 2: Jalankan Script Ensure
```sql
-- Pastikan semua grant ada
-- File: supabase/ENSURE_GRANTS.sql
```

### Cara 3: Manual Check
```sql
-- Cek grant untuk users
SELECT grantee, privilege_type 
FROM information_schema.role_table_grants
WHERE table_name = 'users' 
  AND grantee IN ('anon', 'authenticated', 'service_role');

-- Cek grant untuk stores
SELECT grantee, privilege_type 
FROM information_schema.role_table_grants
WHERE table_name = 'stores' 
  AND grantee IN ('anon', 'authenticated', 'service_role');

-- Cek grant untuk function
SELECT grantee, privilege_type
FROM information_schema.routine_privileges
WHERE routine_name = 'handle_new_user';
```

## 📝 Checklist

Setelah apply migration atau fix script, pastikan:

### Untuk Registrasi USER:
- [ ] `anon` punya `INSERT` permission di `users`
- [ ] `anon` punya `EXECUTE` permission di `handle_new_user()`
- [ ] RLS policy "Enable insert for anon" ada
- [ ] Function `handle_new_user()` menggunakan `SECURITY DEFINER`

### Untuk Registrasi TOKO:
- [ ] `service_role` punya `ALL` atau `INSERT` permission di `users`
- [ ] `service_role` punya `ALL` atau `INSERT` permission di `stores`
- [ ] `service_role` punya `EXECUTE` permission di `handle_new_user()`
- [ ] Function `handle_new_user()` menggunakan `SECURITY DEFINER`

## 🚀 Apply Grant

Jika grant belum ada atau perlu di-update:

1. **Via Migration** (recommended):
   - Migration sudah ada di `supabase/migrations/20251215000003_grants.sql`
   - Push dengan: `npx supabase db push`

2. **Via Manual Script**:
   - Jalankan `supabase/ENSURE_GRANTS.sql` di Supabase SQL Editor
   - Atau jalankan `supabase/FIX_REGISTRATION_ERROR.sql` (sudah include grants)

## ⚠️ Catatan Penting

1. **anon** hanya perlu `INSERT` untuk registrasi user, tidak perlu `UPDATE` (tapi tidak masalah jika ada)
2. **service_role** sudah punya `ALL` di semua tabel (default Supabase)
3. Function `handle_new_user()` menggunakan `SECURITY DEFINER` yang bypass RLS
4. RLS policy tetap diperlukan untuk safety, meskipun SECURITY DEFINER bypass RLS

## 🔗 File Terkait

- `supabase/migrations/20251215000003_grants.sql` - Migration grants
- `supabase/FIX_REGISTRATION_ERROR.sql` - Fix script dengan grants
- `supabase/ENSURE_GRANTS.sql` - Script untuk ensure grants
- `supabase/VERIFY_GRANTS.sql` - Script untuk verify grants

