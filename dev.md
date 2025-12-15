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

Dokumentasi ini mencakup arsitektur, teknologi, struktur kode, dan praktik terbaik yang digunakan dalam proyek ORBfood. Gunakan dokumentasi ini sebagai referensi utama saat mengembangkan fitur baru atau memperbaiki bug.