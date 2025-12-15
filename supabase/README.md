# Supabase Setup ORBfood

## 📋 Overview

Dokumentasi setup dan migration Supabase untuk ORBfood.

## 🚀 Quick Start

### 1. Push Migration ke Supabase

```bash
# Menggunakan npx (tanpa install global)
npx supabase db push

# Atau install Supabase CLI global
npm install -g supabase
supabase login
supabase link --project-ref your-project-ref
supabase db push
```

### 2. Setup Email Template

1. Buka Supabase Dashboard → Authentication → Email Templates
2. Edit template "Confirm signup"
3. Copy isi dari `supabase/email-templates/confirm-email.html`
4. Paste ke editor dan save

Lihat panduan lengkap: `supabase/email-templates/SETUP_EMAIL_TEMPLATE.md`

## 📁 Struktur File

```
supabase/
├── migrations/           # Migration files (versioned)
│   ├── 20251215000001_initial_schema.sql
│   ├── 20251215000002_rls_policies.sql
│   ├── 20251215000003_grants.sql
│   └── 20251215000004_auto_user_profile.sql
├── email-templates/      # Custom email templates
│   ├── confirm-email.html
│   └── SETUP_EMAIL_TEMPLATE.md
├── triggers/            # Trigger functions
└── README.md           # File ini
```

## 🔧 Migration Files

### 1. Initial Schema (`20251215000001_initial_schema.sql`)
- Custom types: `user_role`, `order_status`, `store_status`
- Tabel: `users`, `stores`, `products`, `orders`, `order_items`, `transactions`

### 2. RLS Policies (`20251215000002_rls_policies.sql`)
- Row-Level Security untuk semua tabel
- Policies untuk users, stores, products, orders

### 3. Grants (`20251215000003_grants.sql`)
- Grant permissions untuk authenticated, anon, service_role

### 4. Auto User Profile (`20251215000004_auto_user_profile.sql`)
- Function `handle_new_user()` untuk auto-create user profile
- Trigger `on_auth_user_created` yang fire saat user register
- Membaca role dari `user_metadata->>'role'` (bisa 'user' atau 'toko')
- Default role: 'user'
- Admin dibuat manual, tidak via registrasi

## ✅ Fitur Registrasi

### User/Pelanggan
- Registrasi via form `/register`
- Role: 'user' (dari metadata)
- Perlu konfirmasi email (custom template)
- Default role 'user' jika tidak ada di metadata

### Toko
- Registrasi via form `/register` → pilih "Toko"
- Role: 'toko' (dari metadata)
- Auto-confirm email (tidak perlu konfirmasi)
- Store record dibuat dengan status 'pending'
- Toko muncul setelah admin approve

### Admin
- Dibuat manual via script: `npm run create-admin`
- Tidak via registrasi
- Auto-confirm email
- Deteksi via email list di trigger

## 🧪 Testing

Setelah push migration:

1. **Test Registrasi Pelanggan**:
   - Buka `/register` → Pilih "Pelanggan"
   - Isi form dan submit
   - Verifikasi user masuk ke `auth.users` dan `public.users` dengan role 'user'
   - Cek email konfirmasi (harus menggunakan custom template)

2. **Test Registrasi Toko**:
   - Buka `/register` → Pilih "Toko"
   - Isi form (termasuk nama toko dan alamat)
   - Submit
   - Verifikasi user masuk ke `auth.users` dan `public.users` dengan role 'toko'
   - Verifikasi store record dibuat dengan status 'pending'
   - Bisa langsung login (tidak perlu konfirmasi email)

## 📚 Dokumentasi Terkait

- `MIGRATION_GUIDE.md` - Panduan push migration
- `email-templates/SETUP_EMAIL_TEMPLATE.md` - Setup email template
- `SETUP_COMPLETE.md` - Checklist setup lengkap
- `README_TRIGGER.md` - Dokumentasi trigger

## 🔗 Referensi

- [Supabase Migration Docs](https://supabase.com/docs/guides/cli/local-development#database-migrations)
- [Supabase CLI Docs](https://supabase.com/docs/reference/cli)
