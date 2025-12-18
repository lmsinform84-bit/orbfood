# Analisis Halaman Admin Bagian Pengelolaan Toko

## Overview
Halaman admin untuk pengelolaan toko di ORBfood terdiri dari beberapa komponen utama yang memungkinkan admin untuk mengelola lifecycle toko dari pendaftaran hingga operasional sehari-hari.

## Struktur Halaman

### 1. Dashboard Admin (`/admin/dashboard`)
Halaman utama admin yang menampilkan ringkasan keseluruhan sistem.

**Fitur:**
- **Statistik Utama:** Total pengguna, toko, pesanan, dan pendapatan
- **Toko Menunggu Persetujuan:** Daftar toko pending dengan opsi approve/reject
- **Pesanan Terbaru:** 10 pesanan terakhir dari semua toko
- **Upload QRIS ORB:** Manajemen QRIS global untuk semua toko

**UI/UX:**
- Grid layout responsif dengan cards
- Icons dari Lucide React untuk visual clarity
- Real-time stats dengan data terbaru

### 2. Kelola Toko (`/admin/stores`)
Halaman utama untuk mengelola semua toko yang terdaftar.

**Fitur:**
- **Tabel Daftar Toko:** Menampilkan nama, wilayah, status, jumlah order, dan fee
- **Status Management:** Approve, reject, suspend toko
- **Detail View:** Link ke halaman detail toko
- **Refresh:** Update data real-time

**UI/UX:**
- Table dengan sorting dan pagination
- Badge status dengan warna berbeda (Aktif=green, Pending=secondary, Suspended/Rejected=destructive)
- Action buttons dengan icons (Eye untuk view, UpdateStoreStatusButton untuk status)

### 3. Detail Toko (`/admin/stores/[id]`)
Halaman detail lengkap untuk setiap toko dengan 5 tab utama.

#### Tab Ringkasan
- **Statistik Harian/Bulanan:** Order hari ini, order bulan ini, omzet estimasi, fee ORB
- **Informasi Toko:** Alamat, telepon, email, deskripsi

#### Tab Operasional
- **Status Toko:** Status aktif/pending/suspended
- **Status Buka:** Status operasional toko
- **Catatan Admin:** Area untuk catatan internal
- **Rekap Keuangan:** Total fee dan omzet bulan ini

#### Tab Pesanan
- **Statistik Pesanan:** Total pesanan, COD vs QRIS, cancel rate
- **Daftar Pesanan:** 10 pesanan terbaru dengan detail pelanggan dan status

#### Tab Keuangan
- **Ringkasan Keuangan:** Total fee bulan ini, status setoran
- **Verifikasi Pembayaran:** Sistem verifikasi pembayaran untuk order selesai
- **Invoice Management:** Pengelolaan invoice dan pembayaran fee

#### Tab Dokumen
- **QRIS Toko:** Upload dan display QRIS code toko
- **Dokumen Lainnya:** Area untuk dokumen tambahan

**UI/UX:**
- Tab navigation dengan icons
- Responsive grid layout
- Cards dengan header dan content yang jelas
- Badge dan status indicators
- Back button untuk navigasi

## Fitur Utama

### Manajemen Status Toko
- **Pending:** Toko baru menunggu approval
- **Approved:** Toko aktif beroperasi
- **Suspended:** Toko ditangguhkan sementara
- **Rejected:** Toko ditolak

### Sistem Fee
- Fee 5% dari total order selesai
- Tracking fee per toko dan global
- Invoice generation untuk pembayaran fee

### Monitoring Operasional
- Real-time order tracking
- Revenue dan fee calculation
- COD vs QRIS payment analysis
- Cancel rate monitoring

### Payment Verification
- Verifikasi pembayaran untuk order selesai
- Upload bukti pembayaran
- Status tracking pembayaran fee

## UI/UX Design Principles

### Design System
- **Framework:** Next.js dengan Tailwind CSS
- **Component Library:** shadcn/ui
- **Icons:** Lucide React
- **Color Scheme:** Consistent dengan brand ORBfood

### Responsiveness
- Mobile-first approach
- Grid layouts yang adaptif
- Hidden text pada mobile untuk tab icons

### User Experience
- **Navigation:** Clear breadcrumbs dan back buttons
- **Feedback:** Loading states, success/error messages
- **Data Refresh:** Real-time updates dengan refresh buttons
- **Empty States:** Informative messages ketika tidak ada data

### Accessibility
- Semantic HTML structure
- Keyboard navigation support
- Screen reader friendly labels
- High contrast color schemes

## Technical Implementation

### Data Fetching
- Server-side rendering untuk initial load
- Client-side updates untuk real-time data
- Supabase sebagai database backend
- API routes untuk data manipulation

### State Management
- React hooks untuk local state
- Server state dengan SWR pattern
- Optimistic updates untuk better UX

### Security
- Admin-only access dengan middleware
- Row Level Security (RLS) di Supabase
- Input validation dan sanitization

## Kesimpulan
Halaman admin pengelolaan toko ORBfood dirancang dengan fokus pada efisiensi operasional dan user experience yang baik. Dengan struktur yang jelas dan fitur yang komprehensif, admin dapat dengan mudah mengelola seluruh ekosistem toko dari satu dashboard terpusat.