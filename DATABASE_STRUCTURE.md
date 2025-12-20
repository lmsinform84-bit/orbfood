# 📊 Struktur Database ORBfood

Dokumen ini menjelaskan struktur database ORBfood yang telah diupdate dan konsisten dengan aplikasi.

## 📋 Tabel Utama

### 1. `users`
Tabel untuk menyimpan data pengguna (extends Supabase auth.users)

**Kolom:**
- `id` (UUID, PK) - Referensi ke auth.users.id
- `email` (TEXT, NOT NULL)
- `full_name` (TEXT)
- `role` (user_role ENUM: 'user', 'toko', 'admin')
- `phone` (TEXT)
- `address` (TEXT)
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

### 2. `stores`
Tabel untuk menyimpan data toko

**Kolom:**
- `id` (UUID, PK)
- `user_id` (UUID, FK → users.id)
- `name` (TEXT, NOT NULL)
- `description` (TEXT)
- `address` (TEXT, NOT NULL)
- `latitude` (DECIMAL)
- `longitude` (DECIMAL)
- `phone` (TEXT)
- `email` (TEXT)
- `logo_url` (TEXT)
- `banner_url` (TEXT)
- `qris_url` (TEXT) ⭐ **DITAMBAHKAN** - URL QRIS toko untuk pembayaran customer
- `orb_qris_url` (TEXT) ⭐ **DITAMBAHKAN** - URL QRIS ORBfood untuk pembayaran fee dari toko
- `status` (store_status ENUM: 'pending', 'approved', 'suspended', 'rejected')
- `is_open` (BOOLEAN)
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

**Migration:** `20251219000003_add_qris_url_to_stores.sql`

### 3. `store_settings`
Tabel untuk menyimpan pengaturan toko

**Kolom:**
- `id` (UUID, PK)
- `store_id` (UUID, FK → stores.id, UNIQUE)
- `auto_accept_orders` (BOOLEAN)
- `min_order_amount` (DECIMAL)
- `delivery_fee` (DECIMAL)
- `estimated_preparation_time` (INTEGER)
- `payment_methods` (JSONB) ⭐ **DITAMBAHKAN** - Array metode pembayaran yang diterima: ["COD", "TRANSFER", "QRIS"]
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

**Migration:** `20251219000001_add_payment_methods_to_store_settings.sql`

### 4. `products`
Tabel untuk menyimpan data produk/menu

**Kolom:**
- `id` (UUID, PK)
- `store_id` (UUID, FK → stores.id)
- `name` (TEXT, NOT NULL)
- `description` (TEXT)
- `price` (DECIMAL, NOT NULL)
- `image_url` (TEXT)
- `stock` (INTEGER)
- `is_available` (BOOLEAN)
- `category` (TEXT)
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

### 5. `orders`
Tabel untuk menyimpan data pesanan

**Kolom:**
- `id` (UUID, PK)
- `user_id` (UUID, FK → users.id)
- `store_id` (UUID, FK → stores.id)
- `total_price` (DECIMAL, NOT NULL)
- `delivery_fee` (DECIMAL)
- `final_total` (DECIMAL, NOT NULL)
- `status` (order_status ENUM: 'pending', 'diproses', 'selesai', 'dibatalkan')
- `delivery_address` (TEXT, NOT NULL)
- `notes` (TEXT)
- `payment_method` (TEXT) ⭐ **DITAMBAHKAN** - Metode pembayaran: 'COD', 'QRIS', atau 'TRANSFER'
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

**Migration:** `20251219000002_add_payment_method_to_orders.sql`

**Index:** `idx_orders_payment_method` untuk performa query

### 6. `order_items`
Tabel untuk menyimpan item-item dalam pesanan

**Kolom:**
- `id` (UUID, PK)
- `order_id` (UUID, FK → orders.id)
- `product_id` (UUID, FK → products.id)
- `quantity` (INTEGER, NOT NULL)
- `price` (DECIMAL, NOT NULL)
- `subtotal` (DECIMAL, NOT NULL)
- `created_at` (TIMESTAMPTZ)

### 7. `invoices`
Tabel untuk menyimpan invoice pembayaran fee dari toko ke ORBfood

**Kolom:**
- `id` (UUID, PK)
- `store_id` (UUID, FK → stores.id)
- `period_id` (UUID, FK → store_periods.id)
- `order_id` (UUID, FK → orders.id)
- `total_orders` (INTEGER)
- `total_revenue` (DECIMAL)
- `fee_amount` (DECIMAL)
- `status` (invoice_status ENUM: 'menunggu_pembayaran', 'menunggu_verifikasi', 'lunas')
- `payment_proof_url` (TEXT)
- `payment_proof_uploaded_at` (TIMESTAMPTZ)
- `payment_proof_rejected` (BOOLEAN)
- `payment_proof_rejection_reason` (TEXT)
- `verified_by` (UUID, FK → users.id)
- `verified_at` (TIMESTAMPTZ)
- `period_start` (TIMESTAMPTZ)
- `period_end` (TIMESTAMPTZ)
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

**Migration:** `20251215000016_create_invoices_table.sql`

### 8. `store_periods`
Tabel untuk menyimpan periode billing toko

**Kolom:**
- `id` (UUID, PK)
- `store_id` (UUID, FK → stores.id)
- `start_date` (TIMESTAMPTZ)
- `end_date` (TIMESTAMPTZ)
- `is_active` (BOOLEAN)
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

**Migration:** `20251215000016_create_invoices_table.sql`

### 9. `invoice_activity_logs`
Tabel untuk audit trail aktivitas invoice

**Kolom:**
- `id` (UUID, PK)
- `invoice_id` (UUID, FK → invoices.id)
- `action` (TEXT)
- `description` (TEXT)
- `performed_by` (UUID, FK → users.id)
- `created_at` (TIMESTAMPTZ)

**Migration:** `20251215000016_create_invoices_table.sql`

## 🔄 Konsistensi dengan Types

Semua kolom di database sudah sesuai dengan interface di `types/database.ts`:

✅ **Store** - Sudah termasuk `qris_url` dan `orb_qris_url`
✅ **StoreSettings** - Sudah termasuk `payment_methods: string[] | null`
✅ **Order** - Sudah termasuk `payment_method: string | null`
✅ **Invoice** - Sudah sesuai dengan struktur di migration

## 📝 Migration Files Terkait

1. `20251219000001_add_payment_methods_to_store_settings.sql` - Menambahkan kolom `payment_methods` ke `store_settings`
2. `20251219000002_add_payment_method_to_orders.sql` - Menambahkan kolom `payment_method` ke `orders`
3. `20251219000003_add_qris_url_to_stores.sql` - Menambahkan kolom `qris_url` dan `orb_qris_url` ke `stores`
4. `20251215000016_create_invoices_table.sql` - Membuat tabel `invoices`, `store_periods`, dan `invoice_activity_logs`

## ✅ Status

- ✅ Semua migration sudah di-push ke Supabase
- ✅ Types di `types/database.ts` sudah konsisten dengan struktur database
- ✅ Query di aplikasi sudah menggunakan kolom-kolom baru
- ✅ UI sudah menampilkan informasi pembayaran dengan benar

---

**Terakhir Diperbarui:** Desember 2024

