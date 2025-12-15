# 🚀 Setup Database ORBfood - Simple & Clean

## 📋 Overview

Database sudah di-rebuild dengan struktur yang **sederhana, aman, dan tidak recursive**.

## 🗂️ File Migration (Jalankan Urut!)

Semua file ada di folder `supabase/migrations/`:

1. **`20251215000001_initial_schema.sql`** - Tables, types, indexes
2. **`20251215000002_rls_policies.sql`** - RLS policies (simple, non-recursive)
3. **`20251215000003_grants.sql`** - Permissions untuk authenticated & anon
4. **`20251215000004_auto_user_profile.sql`** - Trigger auto-create user profile

## 🚀 Quick Setup

### 1. Drop Project (Jika Perlu)

Jika ingin mulai dari awal:
- Supabase Dashboard > Settings > Danger Zone > Delete Project

### 2. Jalankan Migrations

Buka **Supabase Dashboard > SQL Editor** dan jalankan **URUT**:

```sql
-- Migration 1: Schema
-- Copy-paste isi: migrations/20251215000001_initial_schema.sql

-- Migration 2: RLS Policies  
-- Copy-paste isi: migrations/20251215000002_rls_policies.sql

-- Migration 3: Grants
-- Copy-paste isi: migrations/20251215000003_grants.sql

-- Migration 4: Auto User Profile
-- Copy-paste isi: migrations/20251215000004_auto_user_profile.sql
```

### 3. Setup Admin (Manual)

**Via Table Editor:**
1. User register/login dulu (otomatis jadi `user`)
2. Supabase Dashboard > Table Editor > `users`
3. Edit user → ubah `role` dari `user` menjadi `admin`
4. Save

**Via SQL:**
```sql
UPDATE public.users 
SET role = 'admin' 
WHERE email = 'admin@example.com';
```

### 4. Setup Toko (Manual)

**Via Table Editor:**
1. User register/login dulu (otomatis jadi `user`)
2. Supabase Dashboard > Table Editor > `users`
3. Edit user → ubah `role` dari `user` menjadi `toko`
4. Save

**Via SQL:**
```sql
UPDATE public.users 
SET role = 'toko' 
WHERE email = 'toko@example.com';
```

## ✅ Fitur

- ✅ **Auto-create user profile** saat register (default role: `user`)
- ✅ **RLS policies sederhana** (tidak recursive)
- ✅ **Admin set manual** via Table Editor (mudah & aman)
- ✅ **Toko set manual** via Table Editor
- ✅ **Grants sudah lengkap** (tidak ada error 500)

## 🔐 RLS Policies

### Users
- User bisa view/update profile mereka sendiri
- **TIDAK ada policy admin** (untuk avoid recursion)
- Admin operations via service role key

### Stores, Products, Orders
- Policies sederhana berdasarkan ownership
- Tidak ada recursive check

## 📝 File Structure

```
supabase/
├── migrations/
│   ├── 20251215000001_initial_schema.sql      # Tables, types, indexes
│   ├── 20251215000002_rls_policies.sql        # RLS policies
│   ├── 20251215000003_grants.sql              # Permissions
│   └── 20251215000004_auto_user_profile.sql   # Auto-create trigger
├── SETUP_GUIDE.md                             # Panduan lengkap
└── schema.sql                                 # Reference (optional)
```

## 🧪 Test

### Test Login
```sql
-- Harus berhasil tanpa error
SELECT role FROM public.users WHERE id = auth.uid();
```

### Test Policies
```sql
-- Check policies (harus hanya 2 untuk users)
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'users';
```

## 🐛 Troubleshooting

### Error "Invalid login credentials"?
- ✅ **Pastikan user sudah terdaftar** di Supabase Auth
  - Register via aplikasi (`/register`)
  - Atau create via Supabase Dashboard > Authentication > Users
- ✅ **Pastikan email dan password benar**
- ✅ **Pastikan email sudah dikonfirmasi** (jika email confirmation enabled)
- 📖 **Lihat `TROUBLESHOOTING_LOGIN.md`** untuk panduan lengkap

### Error 500 saat login?
- ✅ Pastikan migration 3 (grants) sudah dijalankan
- ✅ Pastikan migration 2 (RLS) sudah dijalankan

### Infinite recursion?
- ✅ Pastikan migration 2 sudah dijalankan
- ✅ Check tidak ada policy yang recursive

### User tidak bisa login?
- ✅ Pastikan user profile sudah dibuat (trigger jalan)
- ✅ Check GRANT permissions sudah diberikan
- ✅ Check console untuk error detail (F12)

## 📖 Dokumentasi Lengkap

- **`supabase/SETUP_GUIDE.md`** - Panduan setup database
- **`TROUBLESHOOTING_LOGIN.md`** - Panduan troubleshooting login

---

**Status:** ✅ Database sudah di-rebuild dengan struktur yang sederhana dan aman!
