# Pengembangan ORBfood - Food Delivery MVP

## Gambaran Umum
Buat web Food Delivery MVP menggunakan React (Next.js atau CRA) dan Supabase sebagai backend/database. Platform ini untuk desa / UKM lokal, dengan tiga role saja: Admin, Toko, Pelanggan.

## Status Implementasi Saat Ini

### 1. Fitur Frontend

#### Pelanggan:
- **Register / login**: ❌ Belum diimplementasikan
- **Lihat daftar toko dan menu**: ❌ Belum diimplementasikan
- **Pilih menu → masukkan jumlah → checkout**: ❌ Belum diimplementasikan
- **Lihat status order: pending → diproses → selesai**: ❌ Belum diimplementasikan

#### Toko:
- **Register / login**: ❌ Belum diimplementasikan
- **Lihat order masuk dan update status**: ❌ Belum diimplementasikan
- **Manage menu: tambah / edit / hapus menu**: ❌ Belum diimplementasikan

#### Admin:
- **Lihat semua order dan semua toko**: ❌ Belum diimplementasikan
- **Lihat laporan transaksi / total pendapatan**: ❌ Belum diimplementasikan

### 2. Backend / Database (Supabase)
- **Tabel users: id, nama, email, password, role (admin / toko / pelanggan)**: ❌ Struktur tabel belum dibuat
- **Tabel toko: id, nama_toko, alamat, jam_buka, user_id (owner)**: ❌ Belum dibuat
- **Tabel menu: id, nama_menu, deskripsi, harga, foto, toko_id**: ❌ Belum dibuat
- **Tabel orders: id, user_id, toko_id, total_harga, status (pending / diproses / selesai), tanggal**: ❌ Belum dibuat
- **Tabel transactions: id, order_id, total_fee, status_pembayaran**: ❌ Belum dibuat
- **Gunakan Supabase Auth untuk login/register user**: ❌ Belum diimplementasikan
- **Gunakan Row-Level Security (RLS)**:
  - Pelanggan hanya lihat order mereka sendiri: ❌ Belum diimplementasikan
  - Toko hanya lihat order toko mereka: ❌ Belum diimplementasikan
  - Admin lihat semua data: ❌ Belum diimplementasikan

### 3. UI / UX
- **Tampilan sederhana, ramah desa**: ❌ Belum diimplementasikan
- **Mobile-friendly dan responsif**: ✅ Dasar Next.js ada, tetapi UI untuk fitur food delivery belum ada
- **Minimal 3 halaman: Home, Menu / Order, Dashboard Admin / Toko**: ❌ Belum diimplementasikan

### 4. Bonus (Opsional)
- **Upload foto menu (Supabase Storage)**: ❌ Belum diimplementasikan
- **Rating / review menu**: ❌ Belum diimplementasikan

### 5. Dokumentasi
- **Buat dokumentasi lengkap untuk setiap fitur dan langkah-langkah pengembangan**: ❌ Belum ada
- **Dokumentasikan struktur database dan API**: ❌ Belum didokumentasikan
- **Buat panduan penggunaan untuk Admin, Toko, dan Pelanggan**: ❌ Belum ada
- **Dokumentasikan cara menambahkan fitur baru (misal: upload foto menu, rating/review)**: ❌ Belum didokumentasikan

### 6. Pengujian
- **Buat test case untuk setiap fitur**: ❌ Belum ada
- **Gunakan Jest untuk testing frontend**: ❌ Tidak diimplementasikan
- **Gunakan Supabase testing tools untuk testing backend**: ❌ Tidak digunakan

### 7. Maintenance
- **Buat dokumentasi untuk maintenance dan troubleshooting**: ❌ Belum ada
- **Dokumentasikan cara backup dan restore database**: ❌ Belum didokumentasikan
- **Dokumentasikan cara update aplikasi**: ❌ Belum didokumentasikan

## Rencana Pengembangan Lanjutan

### Fase 1: Persiapan dan Konfigurasi Dasar
1. Buat file konfigurasi Supabase
2. Setup environment variables untuk Supabase
3. Implementasi sistem autentikasi dasar
4. Setup struktur folder sesuai dengan role (admin, toko, pelanggan)

### Fase 2: Backend dan Database
1. Implementasi struktur tabel di Supabase
2. Setup Row-Level Security (RLS) untuk masing-masing role
3. Buat stored procedures atau views untuk operasi kompleks
4. Implementasi API calls untuk berbagai operasi

### Fase 3: UI/UX dan Fitur Dasar
1. Buat layout dan komponen dasar untuk halaman utama
2. Implementasi fitur register/login untuk ketiga role
3. Buat halaman Home untuk pelanggan
4. Implementasi tampilan daftar toko dan menu

### Fase 4: Fitur Inti
1. Implementasi fitur checkout pelanggan
2. Buat sistem manajemen menu untuk toko
3. Implementasi sistem manajemen order untuk toko
4. Buat dashboard admin dasar

### Fase 5: Fitur Lanjutan dan Bonus
1. Tambahkan fitur upload foto menu
2. Implementasi rating dan review
3. Buat laporan transaksi untuk admin
4. Tambahkan payment gateway dummy untuk MVP

### Fase 6: Testing dan Dokumentasi
1. Buat test case untuk semua fitur
2. Implementasi testing unit dan integrasi
3. Dokumentasikan semua fitur dan API
4. Buat panduan penggunaan untuk masing-masing role
5. Dokumentasikan cara menambahkan fitur baru (misal: upload foto menu, rating/review)

### Fase 7: Deploy dan Maintenance
1. Persiapan untuk deployment
2. Dokumentasi deployment process
3. Setup monitoring dan logging
4. Dokumentasi backup dan recovery

## Catatan
Saat ini, proyek hanya berisi struktur dasar Next.js dengan komponen UI dari shadcn/ui, tetapi belum ada implementasi dari fitur-fitur food delivery MVP seperti yang tercantum dalam file pengembangan.md.