# Cara Membuat Admin User

Ada 3 cara untuk membuat admin user di aplikasi ORBfood:

## Method 1: Via Supabase Auth Dashboard (Recommended)

### Langkah-langkah:

1. **Buka Supabase Dashboard**
   - Login ke [Supabase Dashboard](https://supabase.com/dashboard)
   - Pilih project Anda

2. **Buat User di Authentication**
   - Buka **Authentication** > **Users**
   - Klik **Add User** atau **Invite User**
   - Isi email dan password
   - Klik **Create User**

3. **Update Role ke Admin**
   - Buka **SQL Editor** di Supabase Dashboard
   - Jalankan query berikut (ganti email dengan email user yang baru dibuat):

```sql
UPDATE public.users 
SET role = 'admin' 
WHERE email = 'admin@example.com';
```

Atau gunakan function yang sudah dibuat:

```sql
SELECT make_user_admin('admin@example.com');
```

### Verifikasi:
```sql
SELECT id, email, full_name, role 
FROM public.users 
WHERE email = 'admin@example.com';
```

## Method 2: Via SQL Editor (Langsung Create User)

Jika ingin create user langsung via SQL:

```sql
-- 1. Insert ke auth.users (menggunakan Supabase Auth function)
-- Note: Cara ini lebih kompleks, lebih baik gunakan Dashboard

-- 2. Setelah user dibuat di Dashboard, langsung set sebagai admin
INSERT INTO public.users (id, email, full_name, role)
SELECT id, email, 'Admin User', 'admin'
FROM auth.users
WHERE email = 'admin@example.com'
ON CONFLICT (id) DO UPDATE SET role = 'admin';
```

## Method 3: Via Function (Jika sudah ada user)

Jika user sudah ada di auth.users, gunakan function:

```sql
-- Pastikan user sudah ada di auth.users terlebih dahulu
-- Lalu jalankan:
SELECT create_admin_user(
  'admin@example.com',
  'password123', -- Password tidak digunakan di function ini, hanya untuk dokumentasi
  'Admin User'
);
```

**Note:** Function ini memerlukan user sudah ada di auth.users. Untuk create user baru, tetap harus via Dashboard.

## Cara Paling Mudah (Recommended Workflow):

1. **Create User via Dashboard:**
   - Authentication > Users > Add User
   - Email: `admin@example.com`
   - Password: `secure_password_here`
   - Create User

2. **Set sebagai Admin via SQL:**
   ```sql
   UPDATE public.users SET role = 'admin' WHERE email = 'admin@example.com';
   ```

3. **Verifikasi:**
   ```sql
   SELECT * FROM public.users WHERE role = 'admin';
   ```

## Auto-Trigger

Sistem sudah memiliki trigger `on_auth_user_created` yang otomatis:
- Create profile di `public.users` saat user dibuat di `auth.users`
- Default role adalah `'user'`
- Untuk admin, perlu diupdate manual dengan query di atas

## Tips:

1. **Untuk production:** Gunakan email khusus admin dan password yang kuat
2. **Multiple admins:** Bisa membuat beberapa admin dengan query yang sama
3. **Security:** Jangan share credentials admin
4. **Backup:** Simpan list admin user untuk recovery

## Troubleshooting:

### User tidak muncul di public.users?
- Cek apakah trigger sudah aktif
- Jalankan trigger manual jika perlu:
  ```sql
  SELECT handle_new_user();
  ```

### Error "user already exists"?
- User sudah ada, langsung update role:
  ```sql
  UPDATE public.users SET role = 'admin' WHERE email = 'admin@example.com';
  ```

### Cara lihat semua admin?
```sql
SELECT id, email, full_name, role, created_at
FROM public.users
WHERE role = 'admin'
ORDER BY created_at;
```

