# Dokumentasi: Approve Store dan Update Role User

## 📋 Overview

Ketika admin menyetujui toko, sistem akan:
1. Update status store menjadi 'approved'
2. Update role user dari 'user' menjadi 'toko'
3. User akan otomatis redirect ke `/toko/dashboard` saat login berikutnya

## 🔄 Alur Approve Store

### 1. Admin Dashboard
- Admin melihat daftar toko dengan status 'pending'
- Setiap toko memiliki tombol **Approve** (✓) dan **Reject** (✗)

### 2. Approve Action
- Admin klik tombol **Approve**
- API route `/api/stores/approve` dipanggil dengan:
  - `storeId`: ID toko yang akan di-approve
  - `action`: 'approve'

### 3. Backend Process
- **Update Store Status**: 
  - `status` → 'approved'
  - `is_open` → `true`
- **Update User Role**:
  - `role` di tabel `users` → 'toko'

### 4. User Experience
- User yang toko-nya di-approve akan memiliki role 'toko'
- Saat login berikutnya, user akan otomatis redirect ke `/toko/dashboard`
- User bisa langsung mengelola menu dan pesanan

## 📁 File yang Dibuat/Diubah

### 1. API Route: Approve Store
**File**: `app/api/stores/approve/route.ts`

**Fungsi**:
- Validasi admin (hanya admin yang bisa approve/reject)
- Update status store
- Update role user menjadi 'toko' jika approve
- Return success/error response

**Request Body**:
```json
{
  "storeId": "uuid",
  "action": "approve" | "reject"
}
```

**Response Success**:
```json
{
  "success": true,
  "message": "Store berhasil disetujui. User sekarang memiliki role toko.",
  "store": {
    "id": "uuid",
    "name": "Nama Toko",
    "status": "approved"
  }
}
```

### 2. Komponen: Pending Store Item
**File**: `components/admin/pending-store-item.tsx`

**Fungsi**:
- Menampilkan informasi toko pending
- Tombol Approve (hijau) dan Reject (merah)
- Loading state saat proses
- Toast notification untuk feedback
- Auto refresh setelah approve/reject

### 3. Admin Dashboard
**File**: `app/admin/dashboard/page.tsx`

**Perubahan**:
- Import `PendingStoreItem` component
- Replace static list dengan interactive component
- Setiap item sekarang punya tombol approve/reject

## 🔧 Technical Details

### Role Update Logic
```typescript
// Jika approve, update role user menjadi 'toko'
if (action === 'approve') {
  const { error: roleError } = await adminClient
    .from('users')
    .update({ role: 'toko' })
    .eq('id', storeData.user_id);
}
```

### Redirect Logic
User dengan role 'toko' akan otomatis redirect ke `/toko/dashboard` melalui:
1. **Middleware** (`lib/supabase/middleware.ts`): Check role dan redirect
2. **Home Page** (`app/page.tsx`): Redirect berdasarkan role
3. **Auth Callback** (`app/auth/callback/route.ts`): Redirect setelah login

### Security
- Hanya admin yang bisa approve/reject (dicek di API route)
- Menggunakan `createAdminClient()` untuk bypass RLS
- Validasi input (storeId, action)

## 🧪 Testing

### Test Approve Store
1. **Login sebagai admin**
2. **Buka `/admin/dashboard`**
3. **Cari toko dengan status 'pending'**
4. **Klik tombol Approve (✓)**
5. **Verifikasi**:
   - Toast notification muncul: "Toko Disetujui"
   - Toko hilang dari daftar pending
   - Store status menjadi 'approved' di database
   - User role menjadi 'toko' di database

### Test User Redirect
1. **Login sebagai user yang toko-nya sudah di-approve**
2. **Verifikasi**:
   - User otomatis redirect ke `/toko/dashboard`
   - Navbar menampilkan role 'Toko'
   - User bisa akses semua fitur toko

### Test Reject Store
1. **Login sebagai admin**
2. **Klik tombol Reject (✗)**
3. **Verifikasi**:
   - Toast notification muncul: "Toko Ditolak"
   - Toko hilang dari daftar pending
   - Store status menjadi 'rejected'
   - User role tetap 'user' (tidak berubah)

## ⚠️ Catatan Penting

1. **Role Update**: Role user hanya berubah saat approve, tidak saat reject
2. **Session Refresh**: User perlu logout dan login lagi untuk role baru aktif (atau refresh browser)
3. **Multiple Stores**: Satu user hanya bisa punya satu toko (dicek saat create store)
4. **Admin Only**: Hanya admin yang bisa approve/reject (dicek di API route)

## 🔗 File Terkait

- `app/api/stores/approve/route.ts` - API route untuk approve/reject
- `components/admin/pending-store-item.tsx` - Komponen UI untuk pending store
- `app/admin/dashboard/page.tsx` - Admin dashboard dengan list pending stores
- `app/toko/dashboard/page.tsx` - Dashboard toko (destination setelah approve)
- `app/page.tsx` - Home page dengan redirect logic
- `app/auth/callback/route.ts` - Auth callback dengan redirect logic
- `lib/supabase/middleware.ts` - Middleware dengan redirect logic
