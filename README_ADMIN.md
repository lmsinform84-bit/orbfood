# 🔐 Setup Auto-Admin User

Dokumentasi ini menjelaskan cara setup agar user yang ditambahkan via Supabase Auth Dashboard otomatis dibuat profile-nya dan bisa jadi admin.

## 🚀 Quick Setup (Paling Mudah)

### 1. Jalankan SQL Trigger

Buka **Supabase Dashboard > SQL Editor** dan jalankan file:
```
supabase/QUICK_SETUP_AUTO_ADMIN.sql
```

Atau copy-paste isi file tersebut ke SQL Editor dan jalankan.

### 2. Setup Email Admin

Edit array `admin_emails` di function untuk menambahkan email yang akan otomatis jadi admin:

```sql
admin_emails TEXT[] := ARRAY[
  'admin@orbfood.com',
  'your-admin-email@example.com',  -- Tambahkan email admin di sini
];
```

### 3. Tambah User via Supabase Dashboard

1. Buka **Authentication** > **Users**
2. Klik **Add user** atau **Create new user**
3. Isi email dan password
4. ✅ Centang **Auto Confirm User**
5. Klik **Create user**

**Hasil:**
- ✅ User profile otomatis dibuat di `public.users`
- ✅ Jika email ada di `admin_emails`, otomatis jadi `admin`
- ✅ Jika tidak, jadi `user` (default)

### 4. Test Login

1. Buka aplikasi di browser
2. Login dengan email dan password yang baru dibuat
3. Jika admin, akan redirect ke `/admin/dashboard`
4. Jika user, akan redirect ke `/user/home`

---

## 📋 Cara Lain: Set Admin Manual

Jika user sudah ada dan ingin dijadikan admin:

### Via SQL Editor:

```sql
-- Cara 1: Via function
SELECT public.set_admin_by_email('user@example.com');

-- Cara 2: Langsung update
UPDATE public.users 
SET role = 'admin' 
WHERE email = 'user@example.com';
```

### Via Supabase Dashboard:

1. Buka **Table Editor** > **users**
2. Cari user berdasarkan email
3. Edit kolom `role` menjadi `admin`
4. Save

---

## ✅ Verifikasi

Untuk memastikan trigger berfungsi:

```sql
-- Cek trigger ada
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';

-- Cek function ada
SELECT proname FROM pg_proc WHERE proname = 'handle_new_user';

-- Cek user dan role
SELECT id, email, full_name, role 
FROM public.users 
ORDER BY created_at DESC 
LIMIT 10;
```

---

## 🔄 Update Email Admin List

Untuk menambah/ubah email yang otomatis jadi admin:

1. Buka SQL Editor
2. Jalankan:

```sql
-- Drop function dulu
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Recreate dengan email baru
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_email TEXT;
  is_admin BOOLEAN := false;
  admin_emails TEXT[] := ARRAY[
    'admin@orbfood.com',
    'new-admin@example.com',  -- Email admin baru
    'another-admin@example.com'
  ];
BEGIN
  -- ... (sisa function sama seperti di QUICK_SETUP_AUTO_ADMIN.sql)
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 🐛 Troubleshooting

### User tidak otomatis dibuat profile-nya

1. Cek trigger sudah dibuat:
   ```sql
   SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
   ```

2. Test trigger manual:
   ```sql
   -- Lihat log error (jika ada)
   SELECT * FROM pg_stat_statements WHERE query LIKE '%handle_new_user%';
   ```

3. Buat profile manual jika perlu:
   ```sql
   INSERT INTO public.users (id, email, role)
   SELECT id, email, 'user'::user_role
   FROM auth.users
   WHERE id NOT IN (SELECT id FROM public.users);
   ```

### Email admin tidak jadi admin

1. Cek email ada di array:
   ```sql
   -- Lihat function definition
   SELECT pg_get_functiondef(oid) 
   FROM pg_proc 
   WHERE proname = 'handle_new_user';
   ```

2. Set manual jika perlu:
   ```sql
   UPDATE public.users 
   SET role = 'admin' 
   WHERE email = 'your-email@example.com';
   ```

### Login tidak berfungsi

1. Pastikan user profile ada:
   ```sql
   SELECT * FROM public.users WHERE email = 'your-email@example.com';
   ```

2. Pastikan role sudah di-set:
   ```sql
   SELECT role FROM public.users WHERE email = 'your-email@example.com';
   ```

3. Cek error di console browser (F12 > Console)

---

## 📝 Catatan Penting

- ✅ Trigger `handle_new_user()` akan otomatis fire saat user baru dibuat di `auth.users`
- ✅ Email yang ada di `admin_emails` akan otomatis jadi admin
- ✅ User lain akan jadi `user` secara default
- ✅ Register via form tetap berfungsi (trigger juga akan fire)
- ⚠️ Pastikan trigger sudah dijalankan sebelum tambah user via Dashboard

---

## 🎯 Ringkasan Alur

```
1. User dibuat di auth.users (via Dashboard atau Register Form)
   ↓
2. Trigger on_auth_user_created fire
   ↓
3. Function handle_new_user() dipanggil
   ↓
4. Insert ke public.users dengan role:
   - 'admin' jika email ada di admin_emails
   - 'user' jika tidak
   ↓
5. User bisa login dengan email/password
   ↓
6. Redirect berdasarkan role:
   - admin → /admin/dashboard
   - toko → /toko/dashboard
   - user → /user/home
```

