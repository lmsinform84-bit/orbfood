# Troubleshooting: Role Update Tidak Berfungsi

## 🔍 Masalah
Setelah admin approve toko, role user tidak berubah dari 'user' menjadi 'toko', dan user masih di-redirect ke halaman user.

## ✅ Solusi

### 1. Pastikan Environment Variable Sudah Di-Set

Pastikan file `.env.local` atau `.env` memiliki:
```env
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

**Cara mendapatkan Service Role Key:**
1. Buka Supabase Dashboard
2. Pilih project Anda
3. Settings → API
4. Copy "service_role" key (bukan anon key!)

### 2. Pastikan Migration Sudah Di-Push

Jalankan:
```bash
npx supabase db push
```

Pastikan migration `20251215000007_add_admin_user_policies.sql` sudah di-apply.

### 3. Verifikasi RLS Policies

Jalankan query ini di Supabase SQL Editor:
```sql
-- Cek apakah policies sudah ada
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'users' 
  AND policyname LIKE '%admin%';
```

Harus ada 2 policies:
- `Admins can view all users`
- `Admins can update user role`

### 4. Manual Update Role (Jika Masih Gagal)

Jika update role masih gagal, jalankan SQL ini di Supabase SQL Editor:

```sql
-- Update role user secara manual
UPDATE public.users 
SET role = 'toko' 
WHERE id = 'USER_ID_HERE';

-- Verifikasi
SELECT id, email, role 
FROM public.users 
WHERE id = 'USER_ID_HERE';
```

**Cara mendapatkan USER_ID:**
1. Buka Supabase Dashboard
2. Authentication → Users
3. Cari user yang toko-nya sudah di-approve
4. Copy User ID

### 5. Cek Console Log

Saat admin approve toko, cek console log di terminal Next.js. Harus ada:
```
✅ User role updated successfully: { id: '...', oldRole: 'user', newRole: 'toko' }
✅ Verified user role: toko
```

Jika ada error, akan muncul:
```
❌ Error updating user role: ...
```

### 6. Test dengan SQL Script

Jalankan script `supabase/FIX_UPDATE_ROLE.sql` di Supabase SQL Editor untuk memastikan semua policies dan grants sudah benar.

## 🔧 Debugging Steps

1. **Cek Service Role Key:**
   ```bash
   # Di terminal Next.js, cek apakah env var ter-load
   console.log('Service Role Key exists:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
   ```

2. **Test Update Role Manual:**
   - Login sebagai admin di Supabase Dashboard
   - Jalankan SQL:
     ```sql
     UPDATE public.users SET role = 'toko' WHERE id = 'USER_ID';
     ```
   - Jika berhasil, berarti RLS policy sudah benar
   - Jika gagal, berarti ada masalah dengan RLS

3. **Cek API Response:**
   - Buka Network tab di browser
   - Approve toko
   - Cek response dari `/api/stores/approve`
   - Lihat apakah ada error atau warning

## 📝 Checklist

- [ ] `SUPABASE_SERVICE_ROLE_KEY` sudah di-set di `.env.local`
- [ ] Migration `20251215000007_add_admin_user_policies.sql` sudah di-push
- [ ] RLS policies untuk admin sudah dibuat
- [ ] Service role key benar (bukan anon key)
- [ ] Console log menunjukkan update berhasil
- [ ] Database menunjukkan role sudah 'toko'

## 🚨 Jika Masih Gagal

1. **Restart Next.js server** setelah mengubah `.env.local`
2. **Clear cache** browser
3. **Cek Supabase Dashboard** → Logs untuk melihat error dari database
4. **Run SQL script manual** `supabase/FIX_UPDATE_ROLE.sql`
5. **Update role manual** via SQL Editor sebagai workaround sementara

## 📞 Support

Jika masalah masih terjadi setelah semua langkah di atas:
1. Cek console log di terminal Next.js
2. Cek Supabase Dashboard → Logs
3. Screenshot error message
4. Cek apakah service role key benar-benar ter-load
