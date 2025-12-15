# Panduan Fix Error Registrasi

## ❌ Error: "Database error saving new user"

Error ini terjadi saat registrasi karena trigger gagal insert ke `public.users`.

## 🔧 Solusi Step-by-Step

### Step 1: Debug Masalah
Jalankan script debug untuk melihat masalahnya:

1. Buka **Supabase Dashboard** → **SQL Editor**
2. Copy isi dari `supabase/DEBUG_REGISTRATION.sql`
3. Paste dan **Run**
4. Lihat hasil - cari yang ada tanda ❌

### Step 2: Apply Fix
Jalankan script fix untuk memperbaiki masalah:

1. Buka **Supabase Dashboard** → **SQL Editor**
2. Copy **SEMUA** isi dari `supabase/FIX_REGISTRATION_ERROR.sql`
3. Paste dan **Run**
4. Verifikasi output - semua harus ✅

### Step 3: Verifikasi
Setelah fix, jalankan debug lagi untuk memastikan:

1. Jalankan `DEBUG_REGISTRATION.sql` lagi
2. Pastikan semua status ✅ (tidak ada ❌)
3. Khususnya pastikan:
   - ✅ Function reads role from metadata
   - ✅ Trigger enabled
   - ✅ RLS enabled
   - ✅ Policy exists for anon insert
   - ✅ anon has INSERT permission

### Step 4: Test Registrasi
Setelah verifikasi, test registrasi:

1. Buka `/register` di aplikasi
2. Pilih "Pelanggan"
3. Isi form dan submit
4. Harus berhasil tanpa error

## 🔍 Troubleshooting

### Masalah: Function tidak membaca role dari metadata
**Solusi**: Pastikan function sudah di-update dengan script fix. Cek dengan:
```sql
SELECT prosrc FROM pg_proc WHERE proname = 'handle_new_user';
```
Harus mengandung `role_from_metadata`.

### Masalah: RLS policy tidak ada
**Solusi**: Script fix akan membuat policy. Pastikan ada policy:
- "Enable insert for trigger"
- "Enable insert for authenticated users"  
- "Enable insert for anon"

### Masalah: anon tidak punya INSERT permission
**Solusi**: Script fix akan grant permission. Verifikasi dengan:
```sql
SELECT * FROM information_schema.role_table_grants
WHERE table_name = 'users' AND grantee = 'anon';
```

### Masalah: Trigger tidak aktif
**Solusi**: Script fix akan recreate trigger. Verifikasi dengan:
```sql
SELECT tgenabled FROM pg_trigger WHERE tgname = 'on_auth_user_created';
```
Harus return `'O'` (enabled).

## 📝 Checklist

Setelah fix, pastikan:

- [ ] Function `handle_new_user()` ada dan menggunakan `SECURITY DEFINER`
- [ ] Function membaca `role_from_metadata`
- [ ] Trigger `on_auth_user_created` aktif (enabled)
- [ ] RLS enabled di table `users`
- [ ] Policy "Enable insert for anon" ada
- [ ] anon punya INSERT permission
- [ ] Test registrasi berhasil

## 🆘 Jika Masih Error

Jika masih error setelah fix:

1. **Cek Error Log**:
   - Supabase Dashboard → **Logs** → **Postgres Logs**
   - Filter untuk error terkait `handle_new_user` atau `users`
   - Lihat detail error untuk debugging

2. **Test Function Manual**:
   ```sql
   -- Test function (tidak akan benar-benar insert)
   SELECT public.handle_new_user();
   ```

3. **Cek Table Structure**:
   ```sql
   -- Pastikan tabel users ada dan struktur benar
   SELECT column_name, data_type, is_nullable
   FROM information_schema.columns
   WHERE table_schema = 'public' AND table_name = 'users';
   ```

4. **Cek Type user_role**:
   ```sql
   -- Pastikan type user_role ada
   SELECT typname FROM pg_type WHERE typname = 'user_role';
   ```

## 📚 File Terkait

- `FIX_REGISTRATION_ERROR.sql` - Script fix utama
- `DEBUG_REGISTRATION.sql` - Script untuk debug
- `APPLY_TRIGGER_UPDATE.sql` - Script update trigger (alternatif)

