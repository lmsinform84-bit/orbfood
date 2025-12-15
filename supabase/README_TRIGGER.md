# Dokumentasi Trigger handle_new_user

## 📋 Overview

Trigger `on_auth_user_created` otomatis membuat user profile di `public.users` saat user baru dibuat di `auth.users`.

## 🎯 Alur Registrasi

### 1. Admin (Manual)
- **Cara**: Dibuat manual via script `npm run create-admin`
- **Email**: Auto-confirm (email_confirm: true via admin API)
- **Role**: 'admin' (deteksi via email list di trigger)
- **Konfirmasi Email**: ❌ Tidak perlu (auto-confirm)
- **Registrasi**: ❌ Tidak via form registrasi

### 2. Toko (Via Form)
- **Cara**: Registrasi via form `/register` dengan pilihan "Toko"
- **Email**: Auto-confirm (email_confirm: true via API route)
- **Role**: 'toko' (dari user_metadata->>'role')
- **Konfirmasi Email**: ❌ Tidak perlu (auto-confirm)
- **Store**: Otomatis dibuat dengan status 'pending'

### 3. User/Pelanggan (Via Form)
- **Cara**: Registrasi via form `/register` dengan pilihan "Pelanggan"
- **Email**: Perlu konfirmasi (email_confirm: false, default)
- **Role**: 'user' (dari user_metadata->>'role' atau default)
- **Konfirmasi Email**: ✅ Perlu (menggunakan custom template)
- **Store**: Tidak dibuat

## 🔧 Logic Trigger

### Prioritas Role:
1. **Admin Email List** → Jika email ada di list admin → role 'admin'
2. **Role dari Metadata** → Jika `user_metadata->>'role'` ada → role dari metadata
3. **Default** → role 'user'

### Code Logic:
```sql
IF is_admin THEN
  user_role := 'admin'::user_role;
ELSIF NEW.raw_user_meta_data->>'role' IS NOT NULL THEN
  user_role := (NEW.raw_user_meta_data->>'role')::user_role;
ELSE
  user_role := 'user'::user_role;
END IF;
```

## ⚠️ Penting

### Admin
- ✅ **JANGAN** ubah logic admin (deteksi via email list)
- ✅ Admin dibuat manual, tidak via registrasi
- ✅ Admin tidak perlu konfirmasi email
- ✅ Logic admin sudah berfungsi dengan baik

### Toko & User
- ✅ Toko: Role dari metadata 'toko', auto-confirm email
- ✅ User: Role dari metadata 'user', perlu konfirmasi email
- ✅ Default role 'user' jika tidak ada di metadata

## 📝 Metadata yang Dikirim

### Registrasi Pelanggan:
```json
{
  "full_name": "Nama Lengkap",
  "phone": "081234567890",
  "role": "user"
}
```

### Registrasi Toko (via API):
```json
{
  "full_name": "Nama Pemilik",
  "phone": "081234567890",
  "role": "toko"
}
```

## 🔍 Verifikasi

Setelah registrasi, cek:
1. User ada di `auth.users`
2. User ada di `public.users` dengan role yang benar
3. Untuk toko: Store record dibuat dengan status 'pending'
4. Untuk user: Email konfirmasi terkirim

## 🐛 Troubleshooting

### User tidak masuk ke public.users
- Cek trigger aktif: `SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created'`
- Cek function ada: `SELECT * FROM pg_proc WHERE proname = 'handle_new_user'`
- Cek error log di Supabase Dashboard

### Role tidak sesuai
- Pastikan role dikirim di `user_metadata` saat registrasi
- Cek trigger sudah update (jalankan script `UPDATE_TRIGGER_WITH_ROLE.sql`)
- Manual update role jika perlu

### Admin tidak terdeteksi
- Pastikan email admin ada di list `admin_emails` di function
- Atau buat admin manual via script `npm run create-admin`
