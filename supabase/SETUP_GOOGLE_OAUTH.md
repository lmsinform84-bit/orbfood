# Setup Google OAuth di Supabase

## 🎯 Tujuan
Mengaktifkan login dengan Google untuk mempermudah user login tanpa perlu membuat password.

## 📋 Prerequisites
- Akun Google (untuk membuat OAuth credentials)
- Akses ke Supabase Dashboard
- Akses ke Google Cloud Console

## 🔧 Langkah-langkah Setup

### Step 1: Buat OAuth Credentials di Google Cloud Console

1. **Buka Google Cloud Console**:
   - Login ke [Google Cloud Console](https://console.cloud.google.com/)
   - Pilih atau buat project baru

2. **Enable Google+ API**:
   - Buka **APIs & Services** → **Library**
   - Cari "Google+ API" atau "People API"
   - Klik **Enable**

3. **Buat OAuth 2.0 Credentials**:
   - Buka **APIs & Services** → **Credentials**
   - Klik **Create Credentials** → **OAuth client ID**
   - Jika pertama kali, setup OAuth consent screen terlebih dahulu:
     - **User Type**: External (untuk testing) atau Internal (untuk G Suite)
     - **App name**: ORBfood
     - **User support email**: Email Anda
     - **Developer contact**: Email Anda
     - Klik **Save and Continue**
     - **Scopes**: Klik **Add or Remove Scopes**, pilih:
       - `.../auth/userinfo.email`
       - `.../auth/userinfo.profile`
     - **Test users**: Tambahkan email yang akan digunakan untuk testing
     - Klik **Save and Continue**

4. **Create OAuth Client ID**:
   - **Application type**: Web application
   - **Name**: ORBfood Web Client
   - **Authorized JavaScript origins**:
     ```
     http://localhost:3000
     https://your-domain.com
     ```
   - **Authorized redirect URIs**:
     ```
     https://lzcltixoejvptmjtianw.supabase.co/auth/v1/callback
     ```
     (Ganti dengan Supabase project URL Anda)
   - Klik **Create**
   - **Copy Client ID dan Client Secret** (akan digunakan di Supabase)

### Step 2: Setup di Supabase Dashboard

1. **Buka Supabase Dashboard**:
   - Login ke [Supabase Dashboard](https://app.supabase.com)
   - Pilih project ORBfood

2. **Buka Authentication Settings**:
   - Klik **Authentication** di sidebar
   - Klik **Providers**

3. **Enable Google Provider**:
   - Scroll ke **Google**
   - Toggle **Enable Google provider** menjadi ON
   - Masukkan:
     - **Client ID (for OAuth)**: Client ID dari Google Cloud Console
     - **Client Secret (for OAuth)**: Client Secret dari Google Cloud Console
   - Klik **Save**

4. **Configure Redirect URLs**:
   - Buka **URL Configuration** di Authentication settings
   - Pastikan **Redirect URLs** berisi:
     ```
     http://localhost:3000/auth/callback
     https://your-domain.com/auth/callback
     ```
   - Klik **Save**

### Step 3: Verifikasi Setup

1. **Test Login dengan Google**:
   - Buka aplikasi di `http://localhost:3000/login`
   - Klik tombol **"Login dengan Google"**
   - Harus redirect ke Google login page
   - Setelah login, harus kembali ke aplikasi

2. **Verifikasi User Profile**:
   - Setelah login dengan Google, cek di Supabase Dashboard:
     - **Authentication** → **Users**
     - User harus ada dengan provider "google"
   - Cek di **Table Editor** → **users**:
     - User profile harus dibuat oleh trigger
     - Role default: 'user'

## 🔍 Troubleshooting

### Error: "redirect_uri_mismatch"
**Solusi**:
- Pastikan redirect URI di Google Cloud Console sama dengan:
  `https://your-project-ref.supabase.co/auth/v1/callback`
- Pastikan tidak ada trailing slash atau perbedaan http/https

### Error: "invalid_client"
**Solusi**:
- Pastikan Client ID dan Client Secret sudah benar
- Pastikan credentials sudah di-save di Supabase Dashboard

### User tidak dibuat di public.users setelah Google login
**Solusi**:
- Cek trigger `on_auth_user_created` aktif
- Cek function `handle_new_user()` bisa di-execute
- Cek RLS policy untuk insert
- Jalankan script `FIX_REGISTRATION_ERROR.sql` jika perlu

### Redirect tidak bekerja
**Solusi**:
- Pastikan redirect URL di Supabase Dashboard sudah benar
- Pastikan callback route `/auth/callback` sudah dibuat
- Cek browser console untuk error

## 📝 Catatan Penting

1. **OAuth User Role**:
   - User yang login dengan Google akan mendapat role default 'user'
   - Jika perlu role berbeda, bisa update manual di database

2. **User Metadata**:
   - Google OAuth akan otomatis set:
     - `email`: Email dari Google
     - `full_name`: Nama dari Google profile
   - Trigger akan membaca metadata ini untuk membuat user profile

3. **Security**:
   - Jangan expose Client Secret di client-side
   - Client Secret hanya digunakan di Supabase Dashboard
   - Pastikan redirect URLs sudah benar untuk security

## ✅ Checklist Setup

- [✅ ] Google Cloud Console project dibuat
- [ ✅] OAuth consent screen sudah di-setup
- [ ✅] OAuth 2.0 Client ID dibuat
- [ ✅] Authorized redirect URI sudah di-set (Supabase callback URL)
- [ ✅] Google provider enabled di Supabase Dashboard
- [✅ ] Client ID dan Client Secret sudah di-input
- [ ] Redirect URLs di Supabase sudah dikonfigurasi
- [ ] Test login dengan Google berhasil
- [ ] User profile dibuat setelah Google login

## 🔗 Referensi

- [Supabase OAuth Docs](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Google OAuth Setup](https://developers.google.com/identity/protocols/oauth2)
