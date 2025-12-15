# Fix: Infinite Recursion di RLS Policy

## 🔍 Masalah
Error: `infinite recursion detected in policy for relation "users"`

## 🔧 Penyebab
RLS policy untuk admin menggunakan query ke tabel `users` yang sama, menyebabkan infinite recursion:
```sql
CREATE POLICY "Admins can view all users"
  ON public.users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users  -- ❌ Recursive query!
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

## ✅ Solusi

### 1. Hapus Policy Admin untuk Users Table
Karena kita menggunakan `createAdminClient()` dengan `SUPABASE_SERVICE_ROLE_KEY`, semua operasi admin akan **bypass RLS**. Jadi policy admin untuk users table **tidak diperlukan**.

**Migration**: `20251215000008_fix_admin_user_policies_no_recursion.sql`
- Drop policy "Admins can view all users"
- Drop policy "Admins can update user role"
- Rely on service_role untuk bypass RLS

### 2. Hapus Policy Admin untuk Stores Table
Sama seperti users, policy admin untuk stores juga tidak diperlukan karena menggunakan service_role.

**Migration**: `20251215000009_fix_store_policies_no_recursion.sql`
- Drop policy "Admins can view all stores"
- Drop policy "Admins can update store status"
- Rely on service_role untuk bypass RLS

### 3. Pastikan Service Role Key Di-Set
```env
# .env.local
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

## 📋 Policy yang Tetap Ada

### Users Table:
- ✅ "Users can view their own profile" - User bisa lihat profile sendiri
- ✅ "Users can update their own profile" - User bisa update profile sendiri
- ✅ "Enable insert for authenticated users" - Untuk registrasi

### Stores Table:
- ✅ "Anyone can view approved stores" - Public bisa lihat store approved
- ✅ "Store owners can view their own store" - Owner bisa lihat store mereka
- ✅ "Store owners can update their own store" - Owner bisa update store mereka
- ✅ "Store owners can insert their own store" - Untuk registrasi store

## 🔑 Cara Kerja

1. **Regular Users** (anon/authenticated):
   - Menggunakan regular client (`createClient()`)
   - Terbatas oleh RLS policies
   - Hanya bisa akses data mereka sendiri

2. **Admin Operations**:
   - Menggunakan admin client (`createAdminClient()`)
   - Menggunakan `SUPABASE_SERVICE_ROLE_KEY`
   - **Bypass semua RLS policies**
   - Bisa akses semua data

## ✅ Testing

1. **Test Login User Biasa**:
   - Login sebagai user biasa
   - Harus bisa akses profile sendiri
   - Tidak ada error recursion

2. **Test Admin Operations**:
   - Login sebagai admin
   - Approve toko
   - Update role user
   - Harus berhasil tanpa error

3. **Test Update Role**:
   - Admin approve toko
   - Role user harus berubah ke 'toko'
   - User login ulang harus redirect ke `/toko/dashboard`

## 🚨 Jika Masih Ada Error

1. **Cek Migration Sudah Di-Push**:
   ```bash
   npx supabase db push
   ```

2. **Cek Policies di Database**:
   ```sql
   SELECT policyname, cmd 
   FROM pg_policies 
   WHERE tablename = 'users' 
     AND policyname LIKE '%admin%';
   ```
   Harus **tidak ada** policy admin untuk users.

3. **Restart Next.js Server**:
   ```bash
   # Stop server
   # Start lagi
   npm run dev
   ```

4. **Clear Browser Cache**:
   - Hard refresh (Ctrl+Shift+R)
   - Atau clear cache dan cookies

## 📝 Catatan Penting

- **Service Role Key**: Wajib di-set untuk admin operations
- **No Admin Policies**: Policy admin tidak diperlukan karena service_role bypass RLS
- **Regular Policies**: Policy untuk user biasa tetap diperlukan untuk security
- **No Recursion**: Dengan menghapus policy admin, tidak ada lagi recursion
