# Custom Email Templates untuk ORBfood

Dokumentasi ini menjelaskan cara setup custom email template di Supabase untuk konfirmasi email yang sesuai dengan tema web ORBfood.

## File Template

- `confirm-email.html` - Template untuk email konfirmasi registrasi

## Cara Setup di Supabase Dashboard

### 1. Login ke Supabase Dashboard
1. Buka [Supabase Dashboard](https://app.supabase.com)
2. Pilih project Anda
3. Buka menu **Authentication** → **Email Templates**

### 2. Setup Template Konfirmasi Email

1. Klik pada template **"Confirm signup"**
2. Copy isi dari file `confirm-email.html`
3. Paste ke editor template di Supabase Dashboard
4. **PENTING**: Ganti placeholder berikut dengan variable Supabase:
   - `{{ .Email }}` → `{{ .Email }}` (sudah benar)
   - `{{ .ConfirmationURL }}` → `{{ .ConfirmationURL }}` (sudah benar)

### 3. Variable yang Tersedia di Supabase

Supabase menyediakan variable berikut untuk email template:

- `{{ .Email }}` - Email user yang mendaftar
- `{{ .ConfirmationURL }}` - URL untuk konfirmasi email
- `{{ .SiteURL }}` - URL website Anda
- `{{ .RedirectTo }}` - URL redirect setelah konfirmasi

### 4. Konfigurasi Email Settings

1. Buka **Authentication** → **Settings**
2. Pastikan **"Enable email confirmations"** diaktifkan untuk user biasa
3. Untuk toko, email confirmation bisa dinonaktifkan (toko langsung aktif)

### 5. Testing

1. Daftar sebagai user baru
2. Cek email inbox (dan spam folder)
3. Verifikasi bahwa email menggunakan template custom
4. Klik link konfirmasi dan pastikan redirect berfungsi

## Catatan Penting

- Template menggunakan warna gradient orange-red sesuai tema ORBfood
- Template responsive dan mobile-friendly
- Link konfirmasi valid selama 24 jam (default Supabase)
- Pastikan `{{ .ConfirmationURL }}` tidak diubah karena ini variable khusus Supabase

## Troubleshooting

### Email tidak terkirim
- Cek SMTP settings di Supabase Dashboard
- Pastikan email tidak masuk ke spam folder
- Verifikasi domain email sender di Supabase

### Template tidak muncul
- Pastikan sudah save template di Dashboard
- Clear cache browser dan coba daftar lagi
- Cek apakah menggunakan variable yang benar

### Link tidak berfungsi
- Pastikan `{{ .ConfirmationURL }}` menggunakan format yang benar
- Cek redirect URL di Authentication settings
- Pastikan domain sudah dikonfigurasi dengan benar

## Customisasi Lebih Lanjut

Anda bisa menyesuaikan template dengan:
- Mengubah warna gradient (saat ini orange-red)
- Menambahkan logo ORBfood
- Mengubah teks dan pesan
- Menambahkan footer informasi tambahan

**PENTING**: Jangan hapus atau ubah variable `{{ .ConfirmationURL }}` dan `{{ .Email }}` karena ini diperlukan oleh Supabase untuk fungsi konfirmasi email.
