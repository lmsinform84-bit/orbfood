# Setup Storage Bucket untuk Upload Bukti Pembayaran

## Masalah
Jika upload bukti pembayaran gagal dengan error "Bucket not found" atau "RLS policy violation", pastikan bucket `store-uploads` sudah dibuat dan migration sudah dijalankan.

## Langkah-langkah Setup

### 1. Buat Bucket di Supabase Dashboard

1. Login ke [Supabase Dashboard](https://app.supabase.com)
2. Pilih project Anda
3. Buka menu **Storage** di sidebar kiri
4. Klik tombol **"New bucket"** atau **"Create bucket"**
5. Isi form:
   - **Name**: `store-uploads`
   - **Public bucket**: **NO** (uncheck - ini adalah private bucket untuk keamanan)
   - **File size limit**: `5242880` (5MB dalam bytes)
   - **Allowed MIME types**: `image/*` (opsional, untuk validasi)
6. Klik **"Create bucket"**

### 2. Jalankan Migration

Setelah bucket dibuat, jalankan migration untuk setup RLS policies:

```bash
# Jika menggunakan Supabase CLI
supabase db push

# Atau jalankan migration secara manual di SQL Editor
# File: supabase/migrations/20251215000015_setup_store_uploads_bucket.sql
```

### 3. Verifikasi Setup

Setelah migration dijalankan, verifikasi bahwa policies sudah dibuat:

1. Buka **Storage** → **Policies** di Supabase Dashboard
2. Pastikan ada policies berikut untuk bucket `store-uploads`:
   - ✅ "Toko can upload invoice payment proofs" (INSERT)
   - ✅ "Toko can view own invoice payment proofs" (SELECT)
   - ✅ "Admin can view all invoice payment proofs" (SELECT)
   - ✅ "Admin can manage all store uploads" (ALL)

### 4. Test Upload

Setelah setup selesai, coba upload bukti pembayaran dari halaman invoice toko. Jika masih error, cek:

1. **Console browser** untuk error message detail
2. **Supabase Dashboard** → **Storage** → **Logs** untuk melihat error dari server
3. Pastikan user yang login memiliki role `toko` di tabel `users`

## Troubleshooting

### Error: "Bucket not found"
- **Solusi**: Buat bucket `store-uploads` di Supabase Dashboard (lihat langkah 1)

### Error: "new row violates row-level security policy"
- **Solusi**: 
  1. Pastikan migration sudah dijalankan
  2. Pastikan user memiliki role `toko` di tabel `users`
  3. Pastikan file path dimulai dengan `invoice-payments/`

### Error: "The resource already exists"
- **Solusi**: File dengan nama yang sama sudah ada. Sistem akan membuat nama file baru dengan timestamp, jadi ini seharusnya jarang terjadi.

### Error: "File size exceeds limit"
- **Solusi**: 
  1. Pastikan file tidak lebih dari 5MB
  2. Sistem akan otomatis compress gambar, tapi jika file asli terlalu besar, compress manual terlebih dahulu

## Struktur Folder

Bucket `store-uploads` menggunakan struktur folder berikut:

```
store-uploads/
  └── invoice-payments/
      ├── {order_id}-{timestamp}.jpg
      ├── {order_id}-{timestamp}.png
      └── ...
```

Contoh nama file:
- `invoice-payments/123e4567-e89b-12d3-a456-426614174000-1703123456789.jpg`

## Security Notes

- Bucket `store-uploads` adalah **private bucket** (tidak public)
- Hanya user dengan role `toko` yang bisa upload ke folder `invoice-payments/`
- Hanya user dengan role `toko` atau `admin` yang bisa melihat file
- Admin memiliki akses penuh untuk manage semua file

