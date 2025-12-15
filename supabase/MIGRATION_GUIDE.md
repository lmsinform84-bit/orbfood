# Panduan Migration Supabase

## 📋 Overview

Migration Supabase digunakan untuk mengelola perubahan database secara versioned. Semua perubahan database harus dilakukan melalui migration files.

## 🚀 Push Migration ke Supabase

### Menggunakan Supabase CLI

1. **Install Supabase CLI** (jika belum):
   ```bash
   npm install -g supabase
   ```

2. **Login ke Supabase**:
   ```bash
   supabase login
   ```

3. **Link project** (jika belum):
   ```bash
   supabase link --project-ref your-project-ref
   ```

4. **Push migration**:
   ```bash
   supabase db push
   ```

   Atau push migration tertentu:
   ```bash
   supabase migration up
   ```

### Menggunakan npx (tanpa install global)

```bash
npx supabase db push
```

## 📁 Struktur Migration

Migration files berada di folder `supabase/migrations/` dengan format:
```
YYYYMMDDHHMMSS_description.sql
```

Contoh:
- `20251215000001_initial_schema.sql`
- `20251215000002_rls_policies.sql`
- `20251215000004_auto_user_profile.sql`

## 🔧 Migration yang Tersedia

### 1. Initial Schema (`20251215000001_initial_schema.sql`)
- Membuat custom types (user_role, order_status, store_status)
- Membuat tabel users, stores, products, orders, order_items, transactions

### 2. RLS Policies (`20251215000002_rls_policies.sql`)
- Setup Row-Level Security untuk semua tabel
- Policies untuk users, stores, products, orders, dll

### 3. Grants (`20251215000003_grants.sql`)
- Grant permissions untuk authenticated, anon, service_role

### 4. Auto User Profile (`20251215000004_auto_user_profile.sql`)
- Function `handle_new_user()` untuk auto-create user profile
- Trigger `on_auth_user_created` yang fire saat user register
- Membaca role dari `user_metadata->>'role'`
- Support registrasi user dan toko

## ✅ Verifikasi Migration

Setelah push migration, verifikasi dengan:

```sql
-- Cek trigger aktif
SELECT tgname, tgenabled 
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created';

-- Cek function ada
SELECT proname, prosecdef 
FROM pg_proc 
WHERE proname = 'handle_new_user';

-- Cek RLS policy
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'users';
```

## 🧪 Testing Setelah Migration

1. **Test Registrasi Pelanggan**:
   - Buka `/register`
   - Pilih "Pelanggan"
   - Isi form dan submit
   - Verifikasi user masuk ke `auth.users` dan `public.users` dengan role 'user'

2. **Test Registrasi Toko**:
   - Buka `/register`
   - Pilih "Toko"
   - Isi form (termasuk nama toko dan alamat)
   - Submit
   - Verifikasi user masuk ke `auth.users` dan `public.users` dengan role 'toko'
   - Verifikasi store record dibuat dengan status 'pending'

## 📝 Catatan Penting

- **Jangan edit migration yang sudah di-push** - Buat migration baru untuk perubahan
- **Backup database** sebelum push migration penting
- **Test di development** sebelum push ke production
- **Migration harus idempotent** - Bisa di-run berkali-kali tanpa error

## 🔗 Referensi

- [Supabase Migration Docs](https://supabase.com/docs/guides/cli/local-development#database-migrations)
- [Supabase CLI Docs](https://supabase.com/docs/reference/cli)
