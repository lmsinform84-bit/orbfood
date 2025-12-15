# Cara Manual Apply Migration

## 🔧 Masalah

Jika `npx supabase db push` menunjukkan "Remote database is up to date" padahal migration baru belum di-apply, gunakan cara manual berikut.

## ✅ Solusi: Apply via Supabase Dashboard

### Step 1: Buka Supabase Dashboard
1. Login ke [Supabase Dashboard](https://app.supabase.com)
2. Pilih project ORBfood Anda
3. Buka **SQL Editor**

### Step 2: Jalankan Script SQL
1. Buka file `supabase/APPLY_TRIGGER_UPDATE.sql`
2. Copy **SEMUA** isi file tersebut
3. Paste ke SQL Editor di Supabase Dashboard
4. Klik **Run** atau tekan `Ctrl+Enter`
5. Verifikasi tidak ada error

### Step 3: Verifikasi
Setelah script dijalankan, cek output:
- ✅ "SUCCESS: Function updated" dengan "Function reads role from metadata"
- ✅ "SUCCESS: Trigger active" dengan `is_enabled = 'O'`
- ✅ "SUCCESS: RLS policies created" dengan policies yang benar

## 🧪 Testing

Setelah apply migration:

1. **Test Registrasi Pelanggan**:
   - Buka `/register` → Pilih "Pelanggan"
   - Isi form dan submit
   - Verifikasi user masuk ke `auth.users` dan `public.users` dengan role 'user'

2. **Test Registrasi Toko**:
   - Buka `/register` → Pilih "Toko"
   - Isi form (termasuk nama toko dan alamat)
   - Submit
   - Verifikasi user masuk ke `auth.users` dan `public.users` dengan role 'toko'
   - Verifikasi store record dibuat dengan status 'pending'

## 🔍 Verifikasi Manual

Jalankan query ini di SQL Editor untuk verifikasi:

```sql
-- Cek function sudah membaca role dari metadata
SELECT 
  proname,
  CASE 
    WHEN prosrc LIKE '%role_from_metadata%' THEN '✅ OK'
    ELSE '❌ NOT OK'
  END as status
FROM pg_proc
WHERE proname = 'handle_new_user';

-- Cek trigger aktif
SELECT tgname, tgenabled 
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created';

-- Cek RLS policy
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'users' AND cmd = 'INSERT';
```

## 📝 Catatan

- Script `APPLY_TRIGGER_UPDATE.sql` adalah idempotent (bisa dijalankan berkali-kali)
- Function akan di-replace dengan versi baru
- RLS policy akan di-drop dan re-create jika sudah ada
- Tidak akan merusak data yang sudah ada

## 🐛 Troubleshooting

### Error: "permission denied"
- Pastikan menggunakan SQL Editor di Supabase Dashboard (bukan dari client)
- SQL Editor menggunakan service_role yang punya full access

### Error: "function already exists"
- Tidak masalah, script menggunakan `CREATE OR REPLACE`
- Function akan di-update dengan versi baru

### Error: "policy already exists"
- Tidak masalah, script menggunakan `DROP POLICY IF EXISTS`
- Policy akan di-drop dan re-create
