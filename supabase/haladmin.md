# Halaman Admin ORBfood

## Fitur Admin yang Tersedia

### 1. Dashboard (`/admin/dashboard`)
- **Statistik Ringkas:**
  - Total Pengguna
  - Total Toko
  - Total Pesanan
  - Total Pendapatan
- **Toko Menunggu Persetujuan:** Daftar toko dengan status pending
- **Pesanan Terbaru:** 10 pesanan terakhir

### 2. Kelola Toko (`/admin/stores`)
- **Daftar Semua Toko:**
  - Filter berdasarkan status (approved, pending, suspended, rejected)
  - Update status toko (approve, reject, suspend)
  - Lihat detail toko dan owner
- **Fitur:**
  - Refresh data
  - Search toko
  - Filter by status

### 3. Kelola Pengguna (`/admin/users`)
- **Daftar Semua Pengguna:**
  - Lihat semua user, toko, dan admin
  - Update role pengguna
  - Lihat detail pengguna
- **Fitur:**
  - Refresh data
  - Search pengguna
  - Filter by role

### 4. Pesanan (`/admin/orders`)
- **Daftar Semua Pesanan:**
  - Lihat semua pesanan dari semua toko
  - Detail pesanan lengkap (items, total, alamat)
  - Status pesanan
- **Fitur:**
  - Filter by status
  - Filter by tanggal
  - Lihat detail lengkap

### 5. Pembayaran & Fee (`/admin/payment`)
- **QRIS ORBfood:**
  - Upload QRIS ORBfood untuk pembayaran fee
  - Display QRIS untuk toko
- **Mutasi Fee:**
  - Lihat mutasi fee dari toko
  - Filter by periode (hari ini, 7 hari, 30 hari)
  - Status pembayaran fee

## Fitur yang Perlu Ditambahkan

### 6. Kelola Wilayah/Area (`/admin/areas`) - **BARU**
- **Manajemen Area:**
  - Tambah area/wilayah baru
  - Edit area
  - Hapus area
  - Assign area ke toko
- **Fitur:**
  - Daftar semua area
  - Jumlah toko per area
  - Filter dan search

### 7. Laporan & Analytics - **PENGEMBANGAN**
- **Laporan Pendapatan:**
  - Grafik pendapatan per periode
  - Laporan per toko
  - Laporan per area
- **Analytics:**
  - Top produk
  - Top toko
  - Trend pesanan

## Struktur Navigasi Admin

```
/admin
├── dashboard (Dashboard utama)
├── stores (Kelola toko)
├── users (Kelola pengguna)
├── orders (Semua pesanan)
├── payment (QRIS & Fee)
└── areas (Kelola wilayah) - BARU
```

## Catatan Implementasi

- Semua halaman menggunakan `createAdminClient()` untuk bypass RLS
- Komponen client-side untuk interaktif (refresh, update status)
- Server components untuk data fetching
- Tidak ada duplikasi komponen, menggunakan komponen yang sudah ada


