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

---

# Dokumentasi Pengembang ORBfood

## 📋 Gambaran Umum Proyek

ORBfood adalah platform pesan antar makanan online yang mendukung tiga peran pengguna utama:
- **User** (Pelanggan): Pemesan makanan dari toko
- **Toko**: Pemilik toko yang menyediakan makanan
- **Admin**: Administrator platform yang mengawasi seluruh sistem

## 🛠️ Teknologi Stack

### Frontend
- **Framework**: Next.js 13.5.1 (App Router)
- **Language**: TypeScript 5.2.2
- **Styling**: Tailwind CSS 3.3.3 + shadcn/ui components
- **Icons**: Lucide React
- **State Management**: React Hook Form, Zod (validation)

### Backend
- **Backend-as-a-Service**: Supabase
  - Database: PostgreSQL
  - Authentication: Supabase Auth
  - Storage: File upload
  - Row Level Security (RLS) untuk otorisasi

### Dependencies Penting
- **Database Client**: Supabase JS SDK
- **Form Handling**: react-hook-form, zod
- **UI Components**: Radix UI Primitives, Shadcn UI
- **Date Handling**: date-fns
- **Charts**: Recharts
- **Notifications**: Sonner

## 🏗️ Struktur Proyek

```
ORBfood/
├── app/                    # Next.js App Router Pages
│   ├── (auth)/             # Halaman autentikasi (login, register)
│   ├── admin/              # Area admin (dashboard, approval toko)
│   ├── api/                # API Routes (stores, users, auth)
│   ├── toko/               # Area toko (dashboard, produk, pesanan)
│   ├── user/               # Area pengguna (beranda, keranjang, riwayat)
│   ├── globals.css         # Global CSS
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Homepage
├── components/             # Komponen React
│   ├── admin/              # Komponen khusus admin
│   ├── providers/          # Context providers (theme, dll)
│   ├── toko/               # Komponen khusus toko
│   ├── ui/                 # Komponen UI shadcn
│   ├── user/               # Komponen khusus user
│   └── navbar.tsx          # Komponen navbar global
├── hooks/                  # React Hooks kustom
├── lib/                    # Logic utilities
│   ├── supabase/           # Klien Supabase
│   ├── auth.ts             # Fungsi auth helper
│   └── utils.ts            # Utilities umum
├── scripts/                # Script pembantu
│   └── create-admin.js     # Script pembuatan admin
├── supabase/               # Schema dan migrasi database
│   └── schema.sql          # Schema database PostgreSQL
├── types/                  # Type definitions
│   └── database.ts         # Interface TypeScript
├── public/                 # File statis
├── .env.local.example      # Template variabel environment
└── ...
```

## 🗄️ Skema Database

### Enum Types
```sql
user_role: 'user' | 'toko' | 'admin'
order_status: 'pending' | 'diproses' | 'selesai' | 'dibatalkan'
store_status: 'pending' | 'approved' | 'suspended' | 'rejected'
```

### Tabel Utama

#### `users`
```typescript
interface User {
  id: string;           // UUID, referensi auth.users.id
  email: string;        // Diambil dari auth.users
  full_name: string | null;
  role: UserRole;       // 'user' | 'toko' | 'admin'
  phone: string | null;
  address: string | null;
  created_at: string;
  updated_at: string;
}
```

#### `stores`
```typescript
interface Store {
  id: string;           // UUID otomatis
  user_id: string;      // FK ke users.id
  name: string;
  description: string | null;
  address: string;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  email: string | null;
  logo_url: string | null;
  banner_url: string | null;
  status: StoreStatus;  // 'pending' | 'approved' | 'suspended' | 'rejected'
  is_open: boolean;     // Status operasional toko
  created_at: string;
  updated_at: string;
}
```

#### `products`
```typescript
interface Product {
  id: string;           // UUID otomatis
  store_id: string;     // FK ke stores.id
  name: string;
  description: string | null;
  price: number;        // DECIMAL(10, 2)
  image_url: string | null;
  stock: number;
  is_available: boolean;
  category: string | null;
  created_at: string;
  updated_at: string;
}
```

#### `orders`
```typescript
interface Order {
  id: string;           // UUID otomatis
  user_id: string;      // FK ke users.id
  store_id: string;     // FK ke stores.id
  total_price: number;
  delivery_fee: number;
  final_total: number;
  status: OrderStatus;  // 'pending' | 'diproses' | 'selesai' | 'dibatalkan'
  delivery_address: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}
```

#### `order_items`
```typescript
interface OrderItem {
  id: string;           // UUID otomatis
  order_id: string;     // FK ke orders.id
  product_id: string;   // FK ke products.id
  quantity: number;
  price: number;
  subtotal: number;
  created_at: string;
}
```

## 🔐 Sistem Otentikasi & Otorisasi

### Arsitektur Otentikasi
- **Otentikasi**: Menggunakan Supabase Auth
- **Otorisasi**: Berbasis role dengan Row Level Security (RLS) di PostgreSQL
- **Manajemen Session**: Middleware Next.js dengan Supabase SSR

### Policy RLS
**Users Table**:
- User hanya bisa melihat dan memperbarui profil mereka sendiri
- Admin bisa melihat semua user

**Stores Table**:
- Siapa pun bisa melihat toko yang sudah disetujui
- Pemilik toko bisa mengelola toko mereka
- Admin bisa melihat dan memperbarui status toko

**Products Table**:
- Siapa pun bisa melihat produk dari toko yang disetujui
- Pemilik toko bisa mengelola produk mereka

**Orders Table**:
- User bisa melihat pesanan mereka sendiri
- Pemilik toko bisa melihat dan memperbarui pesanan di tokonya
- Admin bisa melihat semua pesanan

### Fungsi Auth Helper
```typescript
getCurrentUser()         // Mendapatkan user yang sedang login
getCurrentUserRole()     // Mendapatkan role user
requireAuth()           // Memastikan user login
requireRole(roles)      // Memastikan user memiliki role tertentu
```

## 🚀 Setup Development

### Prasyarat
- Node.js 18+
- Akun Supabase

### Langkah-Langkah Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Buat Project Supabase**
   - Buat akun di https://supabase.com
   - Buat project baru
   - Catat **Project URL** dan **anon/public key**

3. **Setup Database Schema**
   - Buka SQL Editor di Supabase Dashboard
   - Copy isi `supabase/schema.sql` dan jalankan di SQL Editor

4. **Setup Storage Bucket**
   - Buat bucket `product-images` (publik)
   - Buat bucket `store-images` (publik)

5. **Environment Variables**
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key  // Untuk admin operations
   ```

6. **Jalankan Development Server**
   ```bash
   npm run dev
   ```

### Pembuatan Admin User

Gunakan script untuk membuat admin:
```bash
node scripts/create-admin.js admin@example.com "Admin Name" "password123"
```

Atau buat manual di SQL:
```sql
-- Buat user baru
INSERT INTO auth.users (email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES ('admin@example.com', crypt('password123', gen_salt('bf')), now(), now(), now())
RETURNING id;

-- Set role sebagai admin
INSERT INTO public.users (id, email, full_name, role)
VALUES ('id-dari-query-sebelumnya', 'admin@example.com', 'Admin User', 'admin');
```

## 📦 Scripts Tersedia

- `npm run dev`: Jalankan development server
- `npm run build`: Build untuk production
- `npm run start`: Jalankan production server
- `npm run lint`: Lint code
- `npm run typecheck`: Periksa tipe TypeScript
- `npm run create-admin`: Buat user admin

## 📡 API Structure

### Route Convention
API routes terletak di `app/api/` dan diorganisir berdasarkan entitas:
```
/app/api/
├── auth/           # Autentikasi (login, register, logout)
├── stores/         # Operasi toko (all, create, approve, update-status)
└── users/          # Operasi user
```

### Server Clients
- **`createClient()`**: Client server-side untuk akses user (dengan RLS)
- **`createAdminClient()`**: Client server-side untuk admin (bypass RLS)
- **`supabase`**: Klien client-side untuk operasi frontend

## 🔧 Arsitektur Penting

### Middleware
File `middleware.ts` menangani validasi session secara global:
- Mengizinkan akses publik ke halaman yang diperlukan (/, /login, /register)
- Mengarahkan user yang belum login ke halaman login

### Layout System
Menggunakan Next.js App Router dengan layout bersarang:
- `app/layout.tsx`: Root layout dengan theme provider
- Area role spesifik dengan layout tersendiri (admin, toko, user)

### Type Safety
- Semua tipe database didefinisikan di `types/database.ts`
- Dijamin type-safe dalam query dan response

## 🎨 Styling & UI

### Theme System
- Menggunakan `next-themes` untuk dark/light mode
- CSS variable berbasis Tailwind
- Warna dinamis berdasarkan theme

### Component Library
- shadcn/ui + Radix UI untuk komponen accessible
- Custom component berbasis role di folder spesifik

## 🧪 Testing & Quality

### Type Checking
```bash
npm run typecheck
```

### ESLint Integration
ESLint dikonfigurasi untuk menegakkan standar kode.

## 🚢 Deployment

### Frontend (Vercel)
1. Push ke GitHub
2. Import project ke Vercel
3. Set environment variables
4. Deploy

### Backend (Supabase)
- Database dan auth dihost di Supabase
- Pastikan schema.sql sudah dijalankan
- Pastikan storage buckets sudah dibuat

## 💡 Best Practices

### Security
- Gunakan RLS untuk kontrol akses granular
- Selalu validasi input di sisi server
- Jangan expose service role key di client
- Gunakan stored procedure untuk operasi kompleks

### Performance
- Gunakan pagination untuk query besar
- Implementasi image compression otomatis
- Gunakan Next.js caching strategi

### Database
- Gunakan indexes untuk kolom yang sering difilter
- Gunakan triggers untuk updated_at fields
- Gunakan enum untuk kolom dengan nilai tetap

## 📞 Support & Troubleshooting

Lihat dokumentasi tambahan:
- SETUP.md: Panduan setup detail
- README_ADMIN.md: Panduan admin
- README_SQL.md: Informasi database
- FIX_404_ERROR.md: Solusi error umum
- TROUBLESHOOTING_LOGIN.md: Penyelesaian masalah login

---

## 🔧 Fitur yang Harus Dikembangkan - ORBfood

### 📋 Gambaran Umum

Dokumentasi ini mencakup fitur-fitur yang perlu dikembangkan untuk melengkapi platform ORBfood. Berdasarkan analisis kode yang ada, berikut adalah fitur-fitur yang belum selesai atau perlu ditambahkan.

### 🔄 Fitur Incomplete/Perlu Dikembangkan

#### 1. Sistem Notifikasi
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

#### 2. Rating & Review Sistem
**Status:** Belum Terimplementasi
**Deskripsi:** Sistem untuk pelanggan memberikan rating dan review pada toko dan produk
**Lokasi Terkait:** Tidak ada file terkait
**Detail Implementasi:**
- Tabel `reviews` (product_id, store_id, user_id, rating, comment, created_at)
- Form untuk submit review setelah pesanan selesai
- Tampilan rating di halaman toko dan produk
- Rata-rata rating untuk toko dan produk

#### 3. Sistem Pembayaran
**Status:** Belum Terimplementasi
**Deskripsi:** Integrasi gateway pembayaran untuk transaksi online
**Lokasi Terkait:**
- `app/user/cart/page.tsx` - Pembayaran hanya simulasional
- `app/api/stores/create/route.ts` - Tidak ada verifikasi pembayaran
**Detail Implementasi:**
- Integrasi dengan midtrans, doku, atau payment gateway lainnya
- Status pembayaran di tabel orders
- Callback system untuk verifikasi pembayaran

#### 4. Sistem Tracking Pesanan
**Status:** Belum Terimplementasi
**Deskripsi:** Fitur untuk melacak status pesanan secara real-time
**Lokasi Terkait:**
- `app/user/orders/page.tsx` - Hanya menampilkan status statis
- `app/toko/orders/page.tsx` - Tidak ada sistem tracking
**Detail Implementasi:**
- Real-time status update via WebSocket
- Fitur pelacakan posisi pengiriman
- Timeline perjalanan pesanan

#### 5. Sistem Voucher & Promo
**Status:** Belum Terimplementasi
**Deskripsi:** Fitur untuk mengelola dan menggunakan kode promo/voucher
**Lokasi Terkait:** Tidak ada file terkait
**Detail Implementasi:**
- Tabel `vouchers` (code, type, value, usage_limit, used_count, etc.)
- Validasi voucher di checkout
- Dashboard pembuatan voucher untuk toko/admin

#### 6. Geolocation & Lokasi Terdekat
**Status:** Belum Terimplementasi
**Deskripsi:** Fitur untuk menampilkan toko terdekat berdasarkan lokasi pengguna
**Lokasi Terkait:**
- `app/user/home/page.tsx` - Toko ditampilkan tanpa urutan lokasi terdekat
**Detail Implementasi:**
- Geolocation API client-side
- Perhitungan jarak antar titik (Haversine formula)
- Filter toko berdasarkan jarak

#### 7. Sistem Manajemen Toko Lengkap
**Status:** Sebagian Terimplementasi
**Deskripsi:** Fitur tambahan untuk manajemen toko
**Lokasi Terkait:**
- `app/toko/settings/page.tsx` - Kurang fitur jam operasional
**Detail Implementasi:**
- Jadwal jam operasional (store_work_hours)
- Fitur tutup sementara
- Fitur manajemen staf toko

#### 8. Fitur Wishlist
**Status:** Belum Terimplementasi
**Deskripsi:** Sistem untuk menyimpan produk/toko favorit
**Lokasi Terkait:** Tidak ada file terkait
**Detail Implementasi:**
- Tabel `wishlists` (user_id, item_type, item_id, created_at)
- UI tombol favorite di produk/toko
- Halaman wishlists

#### 9. Sistem Rekomendasi
**Status:** Belum Terimplementasi
**Deskripsi:** Sistem untuk merekomendasikan toko/produk berdasarkan histori
**Lokasi Terkait:** Tidak ada file terkait
**Detail Implementasi:**
- Rekomendasi berdasarkan histori pesanan
- Rekomendasi berdasarkan kategori produk
- Rekomendasi berdasarkan rating dan popularitas

#### 10. Fitur Laporan dan Analitik Lengkap
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

#### 11. Sistem Sub-Admin
**Status:** Belum Terimplementasi
**Deskripsi:** Role tambahan untuk sub-admin toko
**Lokasi Terkait:**
- `types/database.ts` - Hanya mendefinisikan 'user', 'toko', 'admin'
**Detail Implementasi:**
- Role 'subadmin' untuk toko
- Hak akses lebih terbatas dari pemilik toko
- Manajemen akses sub-pegawai

#### 12. Fitur Fitur Diskusi/Chat
**Status:** Belum Terimplementasi
**Deskripsi:** Sistem komunikasi antara pelanggan dan toko
**Lokasi Terkait:** Tidak ada file terkait
**Detail Implementasi:**
- Chat real-time untuk konfirmasi pesanan
- History percakapan
- Chat bot otomatis untuk FAQ

#### 13. Fitur Manajemen Kurir
**Status:** Belum Terimplementasi
**Deskripsi:** Sistem untuk mengelola kurir dan pengiriman
**Lokasi Terkait:** Tidak ada file terkait
**Detail Implementasi:**
- Manajemen kurir untuk toko
- Sistem assign kurir ke pesanan
- Tracking pengiriman oleh kurir

#### 14. Fitur Loyalty Points
**Status:** Belum Terimplementasi
**Deskripsi:** Sistem poin loyalitas untuk pelanggan
**Lokasi Terkait:** Tidak ada file terkait
**Detail Implementasi:**
- Tabel `loyalty_points` (user_id, points, history)
- Penukaran poin untuk diskon
- Program reward

#### 15. Fitur Multi-Language
**Status:** Belum Terimplementasi
**Deskripsi:** Dukungan untuk bahasa selain Indonesia
**Lokasi Terkait:** Tidak ada file terkait
**Detail Implementasi:**
- Internationalization (i18n) setup
- Translation files
- Language switcher

### 🔧 Teknis Development

#### Database Schema Tambahan
- `reviews` - Untuk rating & review
- `vouchers` - Untuk sistem promo
- `wishlists` - Untuk wishlist
- `notifications` - Untuk sistem notifikasi
- `loyalty_points` - Untuk poin loyalitas
- `chats` dan `chat_messages` - Untuk sistem chat
- `couriers` - Untuk manajemen kurir
- `carts` - Untuk keranjang yang lebih lengkap (saat ini di localStorage)

#### API Endpoint yang Perlu Ditambahkan
- `/api/reviews` - CRUD review
- `/api/vouchers` - CRUD voucher
- `/api/notifications` - CRUD notifikasi
- `/api/payments` - Integrasi payment gateway
- `/api/trackings` - Sistem tracking pesanan

#### UI/UX Components yang Perlu Dibuat
- NotificationBell component
- StarRating component
- LocationMap component
- PaymentForm component
- OrderTracker component
- VoucherForm component

### 📅 Prioritas Pengembangan

#### Prioritas Tinggi
1. Sistem Pembayaran
2. Sistem Tracking Pesanan
3. Sistem Notifikasi

#### Prioritas Menengah
1. Rating & Review Sistem
2. Geolocation & Lokasi Terdekat
3. Sistem Voucher & Promo

#### Prioritas Rendah
1. Fitur Wishlist
2. Sistem Rekomendasi
3. Fitur Fitur Diskusi/Chat
4. Fitur Manajemen Kurir
5. Fitur Loyalty Points
6. Fitur Multi-Language

### 🔍 Catatan Tambahan

Beberapa fitur yang teridentifikasi mungkin sudah dalam rencana pengembangan tetapi belum ditandai secara eksplisit di codebase. Pengembangan harus mengikuti arsitektur yang sudah ada dengan menggunakan:

- Supabase untuk database dan auth
- Next.js App Router untuk routing
- shadcn/ui untuk komponen UI
- TypeScript untuk type safety
- Row Level Security untuk kontrol akses

Dokumentasi ini mencakup arsitektur, teknologi, struktur kode, dan praktik terbaik yang digunakan dalam proyek ORBfood. Gunakan dokumentasi ini sebagai referensi utama saat mengembangkan fitur baru atau memperbaiki bug.