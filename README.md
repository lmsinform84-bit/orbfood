# ORBfood - Food Delivery Platform

Platform pesan makanan online dengan tiga role utama: **User**, **Toko**, dan **Admin**.

## 🎯 Fitur Utama

### User (Pelanggan)
- ✅ Register/Login
- ✅ Lihat daftar toko terdekat
- ✅ Lihat menu dari setiap toko
- ✅ Pesan makanan (keranjang & checkout)
- ✅ Lihat status pesanan (menunggu → diproses → selesai)
- ✅ Riwayat pesanan

### Toko
- ✅ Register dan buat profil toko
- ✅ Upload foto logo dan banner (auto compress)
- ✅ CRUD menu (nama, harga, stok, foto)
- ✅ Kelola pesanan masuk (terima, proses, selesai)
- ✅ Dashboard dengan statistik
- ✅ Pengaturan toko (ongkir, min order, dll)

### Admin
- ✅ Dashboard monitoring
- ✅ Approve/reject/suspend toko
- ✅ Lihat statistik order, user, toko
- ✅ Kontrol semua data platform

## 🏗️ Teknologi

- **Frontend:** Next.js 15 (App Router) + React Server Components + Tailwind CSS
- **Backend & Database:** Supabase (PostgreSQL + Auth + Storage)
- **UI Components:** shadcn/ui
- **Hosting:**
  - Frontend: Vercel (Free Tier)
  - Backend: Supabase (Free Tier)

## 📦 Instalasi

### 1. Clone Repository

```bash
git clone <repository-url>
cd ORBfood
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Supabase

1. Buat project baru di [Supabase](https://supabase.com)
2. Jalankan SQL schema dari file `supabase/schema.sql` di SQL Editor Supabase
3. Buat Storage Buckets:
   - `product-images` (public)
   - `store-images` (public)

### 4. Environment Variables

Buat file `.env.local` di root project:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 5. Run Development Server

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser.

## 🗄️ Struktur Database

Database terdiri dari tabel-tabel berikut:

- `users` - Data pengguna (extends auth.users)
- `stores` - Data toko
- `products` - Menu/produk dari toko
- `orders` - Pesanan
- `order_items` - Item dalam pesanan
- `store_work_hours` - Jam operasional toko (opsional)
- `store_settings` - Pengaturan toko

Semua tabel menggunakan **Row Level Security (RLS)** untuk keamanan berdasarkan role.

## 🚀 Deployment

### Frontend (Vercel)

1. Push code ke GitHub
2. Import project ke Vercel
3. Tambahkan environment variables
4. Deploy

### Backend (Supabase)

Database dan backend sudah di-host oleh Supabase. Pastikan:
- Schema sudah dijalankan
- Storage buckets sudah dibuat
- RLS policies sudah aktif

## 🔐 Autentikasi & Role

Platform menggunakan Supabase Auth dengan role-based access:

- **user** - Pelanggan biasa
- **toko** - Pemilik toko
- **admin** - Administrator platform

Role ditentukan saat registrasi (kecuali admin yang dibuat manual).

## 📸 Optimasi Free Tier

Aplikasi dioptimasi untuk free tier:

- ✅ Image compression otomatis (300-600px)
- ✅ Pagination pada query besar
- ✅ Realtime hanya untuk status order
- ✅ Cache menggunakan Next.js ISR
- ✅ Edge Functions untuk logic berat (future)

## 🧪 Testing

Testing dapat dilakukan dengan:

1. **Manual Testing:** Test setiap fitur berdasarkan role
2. **Database Testing:** Test RLS policies di Supabase
3. **Load Testing:** Simulasi 1000 order (future)

## 📝 Struktur Project

```
ORBfood/
├── app/
│   ├── (auth)/          # Auth pages (login, register)
│   ├── user/            # User pages
│   ├── toko/            # Toko pages
│   ├── admin/           # Admin pages
│   └── layout.tsx       # Root layout
├── components/
│   ├── ui/              # shadcn/ui components
│   ├── user/            # User-specific components
│   ├── toko/            # Toko-specific components
│   └── admin/           # Admin-specific components
├── lib/
│   ├── supabase/        # Supabase clients
│   ├── auth.ts          # Auth utilities
│   └── utils/           # Utility functions
├── supabase/
│   └── schema.sql       # Database schema
└── types/
    └── database.ts      # TypeScript types
```

## 🎨 UI/UX

- Modern minimalis design
- Mobile-first responsive
- Dark & light mode support
- Accessible components (shadcn/ui)

## 📄 License

MIT License

## 🤝 Kontribusi

Silakan buat issue atau pull request untuk kontribusi.

# orbfood
