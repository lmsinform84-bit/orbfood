# Dokumentasi Alur Pendaftaran Toko

## 📋 Overview

Alur pendaftaran toko telah diubah menjadi lebih fleksibel:
1. User login/registrasi (manual atau Google)
2. Setelah login, user bisa memilih untuk buka toko
3. Form pendaftaran toko sederhana
4. Toko akan muncul setelah disetujui admin

## 🔄 Alur Baru

### 1. Registrasi/Login User
- **Registrasi**: Hanya untuk user biasa (pelanggan)
- **Login**: Manual (email/password) atau Google OAuth
- **Role**: Selalu 'user' saat registrasi

### 2. Buka Toko (Setelah Login)
- User yang sudah login bisa akses form "Buka Toko"
- Form pendaftaran toko sederhana
- Store dibuat dengan status 'pending'
- User tetap dengan role 'user' (tidak berubah ke 'toko')

### 3. Approval Admin
- Admin review dan approve toko
- Setelah approve, toko muncul di daftar untuk pelanggan
- User bisa manage menu dan order

## 📁 File yang Diubah/Dibuat

### 1. Register Page (`app/(auth)/register/page.tsx`)
- ✅ Hapus opsi "Toko" dari form registrasi
- ✅ Hapus field khusus toko (nama toko, alamat, dll)
- ✅ Registrasi hanya untuk user biasa
- ✅ Role selalu 'user'

### 2. Form Buka Toko (`app/user/open-store/page.tsx`)
- ✅ Halaman baru untuk pendaftaran toko
- ✅ Form sederhana: nama, deskripsi, alamat, phone, email
- ✅ Check apakah user sudah punya toko
- ✅ Validasi dan error handling

### 3. API Create Store (`app/api/stores/create/route.ts`)
- ✅ API route baru untuk create store dari user yang sudah login
- ✅ Validasi user sudah login
- ✅ Check apakah user sudah punya toko
- ✅ Create store dengan status 'pending'

### 4. User Home Page (`app/user/home/page.tsx`)
- ✅ Tambahkan button "Buka Toko" untuk user yang belum punya toko
- ✅ Tampilkan status jika toko sedang pending

### 5. Navbar (`components/navbar.tsx`)
- ✅ Tambahkan button "Buka Toko" di navbar untuk user

## 🎯 Fitur

### Form Buka Toko
- **Field Wajib**: Nama toko, Alamat
- **Field Opsional**: Deskripsi, No. Telepon, Email
- **Validasi**: 
  - User harus login
  - User belum punya toko
  - Nama dan alamat harus diisi

### Status Toko
- **pending**: Menunggu persetujuan admin
- **approved**: Disetujui, toko muncul di daftar
- **rejected**: Ditolak
- **suspended**: Ditangguhkan

### User Experience
- User bisa buka toko kapan saja setelah login
- Tidak perlu registrasi ulang
- Status toko ditampilkan dengan jelas
- Redirect ke home setelah submit form

## 🔧 API Endpoints

### POST `/api/stores/create`
Membuat store baru untuk user yang sudah login.

**Request Body:**
```json
{
  "name": "Nama Toko",
  "description": "Deskripsi toko (opsional)",
  "address": "Alamat lengkap toko",
  "phone": "081234567890 (opsional)",
  "email": "toko@email.com (opsional)"
}
```

**Response Success:**
```json
{
  "success": true,
  "message": "Toko berhasil didaftarkan. Menunggu persetujuan admin.",
  "store": {
    "id": "uuid",
    "name": "Nama Toko",
    "status": "pending"
  }
}
```

**Response Error:**
```json
{
  "error": "Error message"
}
```

## 📝 Catatan Penting

1. **User Role**: User tetap dengan role 'user', tidak berubah ke 'toko'
2. **Store Ownership**: Store memiliki `user_id` yang link ke user
3. **Multiple Stores**: Satu user hanya bisa punya satu toko (dicek di API)
4. **Approval**: Toko hanya muncul setelah admin approve

## 🧪 Testing

1. **Test Registrasi User**:
   - Daftar sebagai user biasa
   - Verifikasi tidak ada opsi toko di form
   - Verifikasi role 'user' setelah registrasi

2. **Test Buka Toko**:
   - Login sebagai user
   - Klik "Buka Toko" di home atau navbar
   - Isi form dan submit
   - Verifikasi store dibuat dengan status 'pending'

3. **Test Duplicate Store**:
   - User yang sudah punya toko tidak bisa buka toko lagi
   - Form akan menampilkan status toko yang sudah ada

4. **Test Approval**:
   - Login sebagai admin
   - Approve toko
   - Verifikasi toko muncul di daftar untuk pelanggan

## 🔗 File Terkait

- `app/(auth)/register/page.tsx` - Form registrasi (hanya user)
- `app/user/open-store/page.tsx` - Form buka toko
- `app/api/stores/create/route.ts` - API create store
- `app/user/home/page.tsx` - Home page dengan button buka toko
- `components/navbar.tsx` - Navbar dengan link buka toko
