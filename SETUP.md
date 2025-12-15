# Setup Guide - ORBfood

Panduan lengkap untuk setup project ORBfood dari awal.

## Prerequisites

- Node.js 18+ terinstall
- Akun Supabase (gratis)
- Akun Vercel (untuk deployment, opsional)

## Langkah-langkah Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Supabase Project

1. Kunjungi [supabase.com](https://supabase.com) dan buat akun (jika belum)
2. Buat project baru
3. Tunggu hingga project selesai dibuat
4. Catat **Project URL** dan **anon/public key** dari Settings > API

### 3. Setup Database Schema

1. Buka SQL Editor di Supabase Dashboard
2. Buka file `supabase/schema.sql`
3. Copy seluruh isi file dan paste ke SQL Editor
4. Jalankan query (Run)

Ini akan membuat:
- Semua tabel yang diperlukan
- Indexes untuk performa
- Row Level Security (RLS) policies
- Triggers untuk updated_at

### 4. Setup Storage Buckets

1. Buka **Storage** di Supabase Dashboard
2. Buat bucket baru dengan nama `product-images`
   - Set sebagai **Public bucket**
3. Buat bucket baru dengan nama `store-images`
   - Set sebagai **Public bucket**

### 5. Setup Environment Variables

1. Buat file `.env.local` di root project:

```env
NEXT_PUBLIC_SUPABASs_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

2. Ganti dengan URL dan key dari Supabase project Anda

### 6. Buat Admin User (Manual)

Untuk membuat user admin pertama kali:

1. Registrasi melalui aplikasi sebagai role biasa
2. Buka Supabase Dashboard > Authentication > Users
3. Buka SQL Editor dan jalankan:

```sql
-- Ganti user_id dengan UUID dari user yang ingin dijadikan admin
UPDATE users SET role = 'admin' WHERE id = 'user-id-di-sini';
```

Atau buat langsung di SQL:

```sql
-- Buat user admin baru (ganti email dan password)
INSERT INTO auth.users (email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES ('admin@example.com', crypt('password123', gen_salt('bf')), now(), now(), now())
RETURNING id;

-- Simpan id yang di-return, lalu jalankan:
INSERT INTO public.users (id, email, full_name, role)
VALUES ('id-dari-query-sebelumnya', 'admin@example.com', 'Admin User', 'admin');
```

### 7. Jalankan Development Server

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000)

## Testing Checklist

### User (Pelanggan)
- [ ] Registrasi sebagai user
- [ ] Login
- [ ] Lihat daftar toko
- [ ] Lihat menu toko
- [ ] Tambah item ke keranjang
- [ ] Checkout pesanan
- [ ] Lihat riwayat pesanan

### Toko
- [ ] Registrasi sebagai toko
- [ ] Login
- [ ] Buat profil toko
- [ ] Tambah menu
- [ ] Edit menu
- [ ] Hapus menu
- [ ] Lihat pesanan masuk
- [ ] Update status pesanan
- [ ] Lihat dashboard statistik

### Admin
- [ ] Login sebagai admin
- [ ] Lihat dashboard
- [ ] Approve/reject toko
- [ ] Lihat semua user
- [ ] Lihat semua pesanan

## Troubleshooting

### Error: "Failed to fetch"
- Pastikan environment variables sudah benar
- Pastikan Supabase project masih aktif
- Cek network tab di browser console

### Error: "Row Level Security policy"
- Pastikan schema.sql sudah dijalankan
- Pastikan user sudah login dengan role yang benar
- Cek RLS policies di Supabase Dashboard > Authentication > Policies

### Error: "Storage bucket not found"
- Pastikan buckets `product-images` dan `store-images` sudah dibuat
- Pastikan buckets set sebagai public

### Error: "Image upload failed"
- Pastikan storage bucket sudah dibuat dan public
- Pastikan file size tidak terlalu besar (recommend < 5MB)
- Cek storage policies di Supabase

## Deployment

### Vercel (Recommended)

1. Push code ke GitHub
2. Import project di [vercel.com](https://vercel.com)
3. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy

### Environment Variables di Production

Pastikan environment variables sudah diset di platform hosting Anda.

## Next Steps

Setelah setup selesai, Anda bisa:
- Customize UI/UX sesuai kebutuhan
- Tambah fitur baru (rating, review, dll)
- Setup email notifications (opsional)
- Setup payment gateway (opsional)
- Optimasi lebih lanjut untuk production

## Support

Jika ada masalah, buat issue di repository atau cek dokumentasi:
- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)

