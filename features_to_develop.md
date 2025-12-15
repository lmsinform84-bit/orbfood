# Features yang Harus Dikembangkan - ORBfood

## 📋 Gambaran Umum

Dokumentasi ini mencakup fitur-fitur yang perlu dikembangkan untuk melengkapi platform ORBfood. Berdasarkan analisis kode yang ada, berikut adalah fitur-fitur yang belum selesai atau perlu ditambahkan.

## 🔄 Fitur Incomplete/Perlu Dikembangkan

### 1. Sistem Notifikasi
**Status:** Belum Terimplementasi
**Deskripsi:** Sistem untuk mengirim notifikasi kepada pengguna dan toko tentang status pesanan, approval toko, dll.
**Lokasi Terkait:** 
- `app/user/home/page.tsx` - Tidak ada notifikasi saat toko disetujui
- `components/user/store-approval-alert.tsx` - Hanya alert sederhana, bukan sistem notifikasi lengkap
- `app/toko/orders/page.tsx` - Tidak ada notifikasi ke pelanggan saat status pesanan berubah

**Detail Implementasi:**
- Sistem push notification ke deperated device
- Email notification untuk event penting
- Dashboard notifikasi dalam aplikasi

### 2. Rating & Review Sistem
**Status:** Belum Terimplementasi
**Deskripsi:** Sistem untuk pelanggan memberikan rating dan review pada toko dan produk
**Lokasi Terkait:** Tidak ada file terkait
**Detail Implementasi:**
- Tabel `reviews` (product_id, store_id, user_id, rating, comment, created_at)
- Form untuk submit review setelah pesanan selesai
- Tampilan rating di halaman toko dan produk
- Rata-rata rating untuk toko dan produk

### 3. Sistem Pembayaran
**Status:** Belum Terimplementasi
**Deskripsi:** Integrasi gateway pembayaran untuk transaksi online
**Lokasi Terkait:** 
- `app/user/cart/page.tsx` - Pembayaran hanya simulasional
- `app/api/stores/create/route.ts` - Tidak ada verifikasi pembayaran
**Detail Implementasi:**
- Integrasi dengan midtrans, doku, atau payment gateway lainnya
- Status pembayaran di tabel orders
- Callback system untuk verifikasi pembayaran

### 4. Sistem Tracking Pesanan
**Status:** Belum Terimplementasi
**Deskripsi:** Fitur untuk melacak status pesanan secara real-time
**Lokasi Terkait:** 
- `app/user/orders/page.tsx` - Hanya menampilkan status statis
- `app/toko/orders/page.tsx` - Tidak ada sistem tracking
**Detail Implementasi:**
- Real-time status update via WebSocket
- Fitur pelacakan posisi pengiriman
- Timeline perjalanan pesanan

### 5. Sistem Voucher & Promo
**Status:** Belum Terimplementasi
**Deskripsi:** Fitur untuk mengelola dan menggunakan kode promo/voucher
**Lokasi Terkait:** Tidak ada file terkait
**Detail Implementasi:**
- Tabel `vouchers` (code, type, value, usage_limit, used_count, etc.)
- Validasi voucher di checkout
- Dashboard pembuatan voucher untuk toko/admin

### 6. Geolocation & Lokasi Terdekat
**Status:** Belum Terimplementasi
**Deskripsi:** Fitur untuk menampilkan toko terdekat berdasarkan lokasi pengguna
**Lokasi Terkait:** 
- `app/user/home/page.tsx` - Toko ditampilkan tanpa urutan lokasi terdekat
**Detail Implementasi:**
- Geolocation API client-side
- Perhitungan jarak antar titik (Haversine formula)
- Filter toko berdasarkan jarak

### 7. Sistem Manajemen Toko Lengkap
**Status:** Sebagian Terimplementasi
**Deskripsi:** Fitur tambahan untuk manajemen toko
**Lokasi Terkait:** 
- `app/toko/settings/page.tsx` - Kurang fitur jam operasional
**Detail Implementasi:**
- Jadwal jam operasional (store_work_hours)
- Fitur tutup sementara
- Fitur manajemen staf toko

### 8. Fitur Wishlist
**Status:** Belum Terimplementasi
**Deskripsi:** Sistem untuk menyimpan produk/toko favorit
**Lokasi Terkait:** Tidak ada file terkait
**Detail Implementasi:**
- Tabel `wishlists` (user_id, item_type, item_id, created_at)
- UI tombol favorite di produk/toko
- Halaman wishlists

### 9. Sistem Rekomendasi
**Status:** Belum Terimplementasi
**Deskripsi:** Sistem untuk merekomendasikan toko/produk berdasarkan histori
**Lokasi Terkait:** Tidak ada file terkait
**Detail Implementasi:**
- Rekomendasi berdasarkan histori pesanan
- Rekomendasi berdasarkan kategori produk
- Rekomendasi berdasarkan rating dan popularitas

### 10. Fitur Laporan dan Analitik Lengkap
**Status:** Sebagian Terimplementasi
**Deskripsi:** Dashboard analitik yang lebih lengkap untuk toko dan admin
**Lokasi Terkait:** 
- `app/toko/dashboard/page.tsx` - Hanya menampilkan metrik dasar
- `app/admin/dashboard/page.tsx` - Diperlukan analitik lebih lengkap
**Detail Implementasi:**
- Grafik penjualan harian/mingguan/bulanan
- Analisis produk terlaris
- Tren pesanan
- Export laporan ke PDF/Excel

### 11. Sistem Sub-Admin
**Status:** Belum Terimplementasi
**Deskripsi:** Role tambahan untuk sub-admin toko
**Lokasi Terkait:** 
- `types/database.ts` - Hanya mendefinisikan 'user', 'toko', 'admin'
**Detail Implementasi:**
- Role 'subadmin' untuk toko
- Hak akses lebih terbatas dari pemilik toko
- Manajemen akses sub-pegawai

### 12. Fitur Fitur Diskusi/Chat
**Status:** Belum Terimplementasi
**Deskripsi:** Sistem komunikasi antara pelanggan dan toko
**Lokasi Terkait:** Tidak ada file terkait
**Detail Implementasi:**
- Chat real-time untuk konfirmasi pesanan
- History percakapan
- Chat bot otomatis untuk FAQ

### 13. Fitur Manajemen Kurir
**Status:** Belum Terimplementasi
**Deskripsi:** Sistem untuk mengelola kurir dan pengiriman
**Lokasi Terkait:** Tidak ada file terkait
**Detail Implementasi:**
- Manajemen kurir untuk toko
- Sistem assign kurir ke pesanan
- Tracking pengiriman oleh kurir

### 14. Fitur Loyalty Points
**Status:** Belum Terimplementasi
**Deskripsi:** Sistem poin loyalitas untuk pelanggan
**Lokasi Terkait:** Tidak ada file terkait
**Detail Implementasi:**
- Tabel `loyalty_points` (user_id, points, history)
- Penukaran poin untuk diskon
- Program reward

### 15. Fitur Multi-Language
**Status:** Belum Terimplementasi
**Deskripsi:** Dukungan untuk bahasa selain Indonesia
**Lokasi Terkait:** Tidak ada file terkait
**Detail Implementasi:**
- Internationalization (i18n) setup
- Translation files
- Language switcher

## 🔧 Teknis Development

### Database Schema Tambahan
- `reviews` - Untuk rating & review
- `vouchers` - Untuk sistem promo
- `wishlists` - Untuk wishlist
- `notifications` - Untuk sistem notifikasi
- `loyalty_points` - Untuk poin loyalitas
- `chats` dan `chat_messages` - Untuk sistem chat
- `couriers` - Untuk manajemen kurir
- `carts` - Untuk keranjang yang lebih lengkap (saat ini di localStorage)

### API Endpoint yang Perlu Ditambahkan
- `/api/reviews` - CRUD review
- `/api/vouchers` - CRUD voucher
- `/api/notifications` - CRUD notifikasi
- `/api/payments` - Integrasi payment gateway
- `/api/trackings` - Sistem tracking pesanan

### UI/UX Components yang Perlu Dibuat
- NotificationBell component
- StarRating component
- LocationMap component
- PaymentForm component
- OrderTracker component
- VoucherForm component

## 📅 Prioritas Pengembangan

### Prioritas Tinggi
1. Sistem Pembayaran
2. Sistem Tracking Pesanan
3. Sistem Notifikasi

### Prioritas Menengah
1. Rating & Review Sistem
2. Geolocation & Lokasi Terdekat
3. Sistem Voucher & Promo

### Prioritas Rendah
1. Fitur Wishlist
2. Sistem Rekomendasi
3. Fitur Fitur Diskusi/Chat
4. Fitur Manajemen Kurir
5. Fitur Loyalty Points
6. Fitur Multi-Language

## 🔍 Catatan Tambahan

Beberapa fitur yang teridentifikasi mungkin sudah dalam rencana pengembangan tetapi belum ditandai secara eksplisit di codebase. Pengembangan harus mengikuti arsitektur yang sudah ada dengan menggunakan:

- Supabase untuk database dan auth
- Next.js App Router untuk routing
- shadcn/ui untuk komponen UI
- TypeScript untuk type safety
- Row Level Security untuk kontrol akses