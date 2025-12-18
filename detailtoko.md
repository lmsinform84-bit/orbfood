# Detail UI/UX Halaman Admin Store Detail (`/admin/stores/[id]`)

## Overview
Halaman detail toko admin adalah halaman lengkap untuk melihat dan mengelola informasi toko individual. Halaman ini menggunakan sistem tab dengan 5 bagian utama untuk mengorganisir semua informasi toko secara terstruktur.

## Layout Utama

### Header Section
Di bagian atas halaman terdapat:
- **Tombol Kembali:** Tombol dengan ikon panah kiri untuk kembali ke daftar toko
- **Nama Toko:** Judul besar dengan nama toko yang sedang dilihat
- **Badge Status:** Label warna yang menunjukkan status toko (Aktif, Pending, Suspended, Rejected)
- **Informasi Tambahan:** Detail pemilik toko, wilayah operasi, dan tanggal bergabung

### Navigasi Tab
Terdapat 5 tab horizontal di bawah header:
1. **Ringkasan** - Ikon trending up
2. **Operasional** - Ikon settings
3. **Pesanan** - Ikon shopping bag
4. **Keuangan** - Ikon receipt
5. **Dokumen** - Ikon file text

Pada layar kecil, tab menampilkan ikon saja tanpa teks untuk efisiensi ruang.

## Konten Tab

### Tab Ringkasan
Tab ini menampilkan overview utama toko dengan:
- **4 Kartu Metrik:** Dalam grid yang responsif
  - Order hari ini (dengan ikon shopping bag)
  - Order bulan ini (ikon trending)
  - Omzet estimasi (ikon dollar sign)
  - Fee ORB (ikon receipt)
- **Kartu Informasi Toko:** Berisi alamat lengkap, nomor telepon, email, dan deskripsi toko

### Tab Operasional
Tab ini fokus pada status dan pengaturan operasional:
- **Kartu Status Operasional:**
  - Status toko saat ini
  - Status buka/tutup toko
  - Catatan admin (area untuk catatan internal)
- **Kartu Rekap Keuangan:**
  - Total fee bulan ini
  - Total omzet bulan ini
  - Order bulan ini
  - Order hari ini

### Tab Pesanan
Tab untuk monitoring pesanan toko:
- **3 Kartu Statistik:**
  - Total pesanan keseluruhan
  - Perbandingan pembayaran COD vs QRIS
  - Tingkat pembatalan (cancel rate)
- **Daftar Pesanan:** Menampilkan 10 pesanan terbaru dengan:
  - Nama pelanggan dan waktu pemesanan
  - Total harga dan status pesanan
  - Setiap pesanan dalam card terpisah dengan border halus

### Tab Keuangan
Tab untuk pengelolaan aspek keuangan:
- **Ringkasan Keuangan:**
  - Total fee yang harus dibayar bulan ini
  - Status setoran (sudah/belum dibayar)
- **Verifikasi Pembayaran:** Area khusus untuk memverifikasi pembayaran dari pesanan yang sudah selesai

### Tab Dokumen
Tab untuk dokumen dan file terkait toko:
- **QRIS Toko:**
  - Jika sudah diupload: menampilkan gambar QRIS code berukuran 128x128px
  - Jika belum: pesan "Belum diupload"
- **Dokumen Lainnya:** Area untuk dokumen tambahan (saat ini kosong)

## Design Responsif

### Pada Desktop (layar besar)
- Grid 4 kolom untuk kartu metrik
- Semua teks tab terlihat
- Layout penuh dengan spacing yang luas

### Pada Tablet
- Grid 2-3 kolom tergantung konten
- Teks tab masih terlihat
- Layout medium dengan penyesuaian spacing

### Pada Mobile (layar kecil)
- Semua kartu dalam 1 kolom vertikal
- Tab menampilkan ikon saja
- Typography lebih kecil untuk efisiensi ruang
- Touch-friendly button sizes

## Skema Warna dan Tema

### Badge Status
- **Aktif:** Badge hijau
- **Pending:** Badge abu-abu
- **Suspended:** Badge merah
- **Rejected:** Badge merah

### Elemen UI
- **Primary:** Biru untuk tombol interaktif
- **Secondary:** Abu-abu untuk teks tambahan dan ikon
- **Success:** Hijau untuk status positif
- **Warning/Danger:** Merah untuk error atau status negatif

## Pola Interaksi

### Navigasi
- Klik tombol kembali untuk return ke daftar toko
- Klik tab untuk berpindah antar section
- Semua transisi smooth tanpa page reload

### Update Data
- Tombol refresh untuk update data real-time
- Loading spinner saat memuat data
- Pesan error jika gagal memuat

### Aksi Admin
- Update status toko melalui tombol aksi
- Upload QRIS dengan preview gambar
- Verifikasi pembayaran pesanan

## Fitur Aksesibilitas

### Navigasi Keyboard
- Tab melalui semua elemen interaktif
- Enter/Space untuk aktivasi tombol
- Arrow keys untuk navigasi tab

### Screen Reader
- Alt text pada gambar QRIS
- Label deskriptif pada tombol
- Struktur heading yang logis

## Kesimpulan
Halaman detail toko admin dirancang untuk memberikan overview komprehensif tentang performa dan operasional toko. Dengan layout tabbed yang intuitif, admin dapat dengan cepat mengakses informasi penting mulai dari metrik penjualan hingga dokumen resmi. Design responsif memastikan pengalaman yang konsisten di semua device, sementara color coding yang jelas membantu identifikasi status dengan cepat.