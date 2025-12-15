# 🚀 Setup Guide - ORBfood Database

## 📋 Langkah Setup

### 1. Drop Project & Database (Jika Perlu)

Jika ingin mulai dari awal:
1. Buka Supabase Dashboard
2. Settings > General > Danger Zone
3. Delete project (atau reset database)

### 2. Jalankan Migrations

Jalankan migration files **URUT** di Supabase Dashboard > SQL Editor:

#### Migration 1: Schema
**File:** `migrations/20251215000001_initial_schema.sql`
- Membuat semua tabel, types, indexes, dan functions

#### Migration 2: RLS Policies
**File:** `migrations/20251215000002_rls_policies.sql`
- Membuat RLS policies sederhana (tidak recursive)
- User bisa akses data mereka sendiri

#### Migration 3: Grants
**File:** `migrations/20251215000003_grants.sql`
- Memberikan permissions ke `authenticated` dan `anon` roles

#### Migration 4: Auto User Profile
**File:** `migrations/20251215000004_auto_user_profile.sql`
- Trigger untuk auto-create user profile saat register
- Sync user yang sudah ada ke public.users
- Default role: `user`

### 3. Setup Admin (Manual via Table Editor)

**Cara set admin:**

1. User register/login dulu (otomatis jadi role `user`)
2. Buka Supabase Dashboard > Table Editor > `users`
3. Cari user yang ingin jadi admin
4. Edit kolom `role` → ubah dari `user` menjadi `admin`
5. Save

**Atau via SQL:**
```sql
UPDATE public.users 
SET role = 'admin' 
WHERE email = 'admin@example.com';
```

### 4. Setup Toko

**Cara set toko:**

1. User register/login dulu (otomatis jadi role `user`)
2. Buka Supabase Dashboard > Table Editor > `users`
3. Cari user yang ingin jadi toko
4. Edit kolom `role` → ubah dari `user` menjadi `toko`
5. Save

**Atau via SQL:**
```sql
UPDATE public.users 
SET role = 'toko' 
WHERE email = 'toko@example.com';
```

## 📁 Struktur Migration

```
migrations/
├── 20251215000001_initial_schema.sql    # Tables, types, indexes
├── 20251215000002_rls_policies.sql      # RLS policies (simple)
├── 20251215000003_grants.sql             # Permissions
└── 20251215000004_auto_user_profile.sql  # Auto-create trigger
```

## 🔐 RLS Policies (Simple & Non-Recursive)

### Users
- ✅ User bisa view/update profile mereka sendiri
- ❌ **TIDAK ada policy admin** (untuk avoid recursion)
- Admin operations handle via service role key

### Stores
- ✅ Siapa saja bisa lihat store yang approved
- ✅ Store owner bisa manage store mereka

### Products
- ✅ Siapa saja bisa lihat produk available dari store approved
- ✅ Store owner bisa manage produk mereka

### Orders
- ✅ User bisa lihat/create order mereka sendiri
- ✅ Store owner bisa lihat/update order untuk store mereka

## ⚠️ Catatan Penting

1. **Admin harus di-set manual** via Table Editor (tidak auto-detect)
2. **Tidak ada policy recursive** - semua policy sederhana
3. **Admin operations** gunakan service role key (bypass RLS)
4. **Default role** saat register adalah `user`

## 🧪 Test Setup

### Test Login
```sql
-- Test query (harus berhasil)
SELECT role FROM public.users WHERE id = auth.uid();
```

### Test Policies
```sql
-- Check policies yang ada
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'users';
```

Seharusnya hanya ada 2 policies:
- "Users can view their own profile"
- "Users can update their own profile"

**TIDAK ada** policy "Admins can view all users"!

## 🐛 Troubleshooting

### Error 500 saat login?
- Pastikan migration 3 (grants) sudah dijalankan
- Pastikan migration 2 (RLS) sudah dijalankan

### Infinite recursion error?
- Pastikan migration 2 sudah dijalankan (menghapus policy recursive)
- Check tidak ada policy yang membaca dari tabel `users` untuk cek role

### User tidak bisa login?
- Pastikan user profile sudah dibuat (trigger sudah jalan)
- Check RLS policy "Users can view their own profile" sudah ada
- Check GRANT permissions sudah diberikan

### Error "Database error creating new user" saat register?
- ✅ **Jalankan file:** `supabase/FIX_USER_CREATION.sql` atau `supabase/SETUP_AUTO_USER_PROFILE.sql`
- Atau pastikan migration 2, 3, dan 4 sudah dijalankan urut
- Check trigger `on_auth_user_created` sudah ada
- Check function `handle_new_user()` sudah ada dan punya permission
- Check policy "Enable insert for authenticated users" sudah ada

### User yang sudah ada tidak muncul di table users?
- ✅ **Jalankan file:** `supabase/SETUP_AUTO_USER_PROFILE.sql`
- Script ini akan sync semua user dari auth.users ke public.users
- Atau jalankan migration 4 lagi (akan sync user yang belum ada)
