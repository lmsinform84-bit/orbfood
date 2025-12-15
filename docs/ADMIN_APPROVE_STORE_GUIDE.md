# Panduan: Admin Approve/Reject Store

## 🔍 Masalah yang Diperbaiki

1. **Tombol Approve/Reject tidak berfungsi**
2. **Role user tidak berubah dari 'user' ke 'toko' saat approve**

## ✅ Perbaikan yang Dilakukan

### 1. Komponen Client-Side untuk Refresh
**File**: `components/admin/pending-stores-list.tsx`
- Komponen client-side untuk handle refresh dengan benar
- Auto refresh setelah approve/reject
- Loading state dan error handling

### 2. Perbaikan Error Handling
**File**: `components/admin/pending-store-item.tsx`
- Error handling yang lebih baik
- Menampilkan warning jika ada masalah
- Logging untuk debugging

### 3. Validasi Service Role Key
**File**: `app/api/stores/approve/route.ts`
- Validasi service role key sebelum update
- Error yang lebih jelas jika key tidak di-set
- Logging detail untuk debugging

### 4. Perbaikan Admin Client
**File**: `lib/supabase/admin-server.ts`
- Validasi dan logging service role key
- Warning jika key tidak di-set

## 🔧 Setup yang Diperlukan

### 1. Environment Variable
Pastikan file `.env.local` memiliki:
```env
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

**Cara mendapatkan Service Role Key:**
1. Buka Supabase Dashboard
2. Pilih project Anda
3. Settings → API
4. Copy "service_role" key (bukan anon key!)

### 2. Restart Server
Setelah mengubah `.env.local`:
```bash
# Stop server (Ctrl+C)
npm run dev
```

## 🧪 Testing

### Test Approve Store
1. **Login sebagai admin**
2. **Buka `/admin/dashboard`**
3. **Cari toko dengan status 'pending'**
4. **Klik tombol Approve (✓ hijau)**
5. **Verifikasi**:
   - Toast notification muncul: "Toko Disetujui"
   - Toko hilang dari daftar pending
   - Console log menunjukkan: `✅ User role updated successfully`
   - Database: `users.role` harus 'toko'

### Test Reject Store
1. **Klik tombol Reject (✗ merah)**
2. **Verifikasi**:
   - Toast notification muncul: "Toko Ditolak"
   - Toko hilang dari daftar pending
   - Store status menjadi 'rejected'
   - User role tetap 'user' (tidak berubah)

### Test Update Role
1. **Cek console log di terminal Next.js**:
   ```
   🔑 Using admin client with service role key: true
   🔄 Updating user role to toko for user_id: ...
   ✅ User role updated successfully: { oldRole: 'user', newRole: 'toko' }
   ✅ Verified user role: toko
   ```

2. **Cek database**:
   ```sql
   SELECT id, email, role 
   FROM users 
   WHERE id = 'USER_ID';
   ```
   Role harus 'toko'

## 🚨 Troubleshooting

### Masalah: Tombol tidak berfungsi
**Solusi**:
1. Cek browser console untuk error
2. Cek Network tab untuk melihat request ke `/api/stores/approve`
3. Pastikan user adalah admin (role = 'admin')

### Masalah: Role tidak berubah
**Solusi**:
1. **Cek Service Role Key**:
   ```bash
   # Di terminal Next.js, cek log:
   🔑 Using admin client with service role key: true
   ```
   Jika `false`, berarti key tidak di-set.

2. **Cek Console Log**:
   - Harus ada: `✅ User role updated successfully`
   - Jika ada error: `❌ Error updating user role`, cek error message

3. **Manual Update** (jika masih gagal):
   ```sql
   UPDATE public.users 
   SET role = 'toko' 
   WHERE id = 'USER_ID';
   ```

### Masalah: Error 500
**Kemungkinan penyebab**:
1. Service role key tidak di-set
2. RLS policy blocking
3. Database connection issue

**Solusi**:
1. Cek console log untuk error detail
2. Pastikan `SUPABASE_SERVICE_ROLE_KEY` sudah di-set
3. Restart Next.js server

## 📋 Checklist

- [ ] `SUPABASE_SERVICE_ROLE_KEY` sudah di-set di `.env.local`
- [ ] Next.js server sudah di-restart setelah set env var
- [ ] User yang login adalah admin (role = 'admin')
- [ ] Console log menunjukkan service role key ter-load
- [ ] Approve berhasil dan role berubah ke 'toko'
- [ ] User bisa login ulang dan redirect ke `/toko/dashboard`

## 🔗 File Terkait

- `app/api/stores/approve/route.ts` - API route untuk approve/reject
- `components/admin/pending-store-item.tsx` - Komponen tombol approve/reject
- `components/admin/pending-stores-list.tsx` - List pending stores dengan refresh
- `app/admin/dashboard/page.tsx` - Admin dashboard
- `lib/supabase/admin-server.ts` - Admin client dengan service role
