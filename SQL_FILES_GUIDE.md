# 📋 Panduan File SQL - Yang Harus Dijalankan

## 🚨 URGENT: Fix Error 500 (Jalankan SEKARANG jika ada error)

### File: `supabase/FIX_RECURSIVE_ERROR.sql`

**KAPAN:** Jika login error dengan pesan:
- `Error 500: Internal Server Error`
- `infinite recursion detected in policy for relation "users"`

**CARA:**
1. Buka Supabase Dashboard > SQL Editor
2. Copy seluruh isi file `supabase/FIX_RECURSIVE_ERROR.sql`
3. Paste dan RUN
4. Test login lagi

**FUNGSI:**
- Fix recursive RLS policy
- Buat helper function `is_current_user_admin()`
- Buat policies yang tidak recursive

---

## 📦 Setup Awal (Jalankan Sekali Saja)

### File: `supabase/migrations/20251213203746_initial_schema.sql`

**KAPAN:** Setup awal database (sudah dijalankan via migration)

**FUNGSI:**
- Create semua tabel
- Create indexes
- Create triggers
- Setup RLS policies dasar

**STATUS:** ✅ Sudah dijalankan (tidak perlu jalankan lagi)

---

### File: `supabase/migrations/20251214064456_auto_user_profile.sql`

**KAPAN:** Setup auto-create user profile (sudah dijalankan via migration)

**FUNGSI:**
- Buat trigger `handle_new_user()`
- Auto-create user profile saat user dibuat di auth.users
- Auto-set admin berdasarkan email

**STATUS:** ✅ Sudah dijalankan (tidak perlu jalankan lagi)

---

## 🔧 Setup Admin (Opsional)

### File: `supabase/QUICK_SETUP_AUTO_ADMIN.sql`

**KAPAN:** Jika ingin setup auto-admin berdasarkan email

**CARA:**
1. Edit array `admin_emails` di dalam file
2. Jalankan di SQL Editor

**FUNGSI:**
- Setup trigger untuk auto-create user profile
- Auto-set admin jika email ada di list

---

### File: `supabase/FLEKSIBEL_ADMIN_SETUP.sql`

**KAPAN:** Jika ingin setup admin lebih fleksibel (via metadata atau manual)

**FUNGSI:**
- Support auto-admin via email list
- Support auto-admin via metadata `{"role": "admin"}`
- Function untuk set admin manual

---

## 📄 File Reference (Tidak Perlu Dijalankan)

### File: `supabase/schema.sql`

**FUNGSI:** Reference schema lengkap (untuk dokumentasi/backup)

**STATUS:** ❌ Tidak perlu dijalankan (sudah ada di migrations)

---

### File: `supabase/triggers/auto_create_user_profile.sql`

**FUNGSI:** Reference trigger (sudah ada di migration)

**STATUS:** ❌ Tidak perlu dijalankan (sudah ada di migrations)

---

### File: `supabase/functions/create_admin_user.sql`

**FUNGSI:** Reference function (jika ada)

**STATUS:** ❌ Tidak perlu dijalankan (sudah ada di migrations)

---

## ✅ Checklist Setup

### Setup Baru:

- [ ] Jalankan migration `20251213203746_initial_schema.sql` (via `npx supabase db push`)
- [ ] Jalankan migration `20251214064456_auto_user_profile.sql` (via `npx supabase db push`)
- [ ] Jika ada error 500, jalankan `FIX_RECURSIVE_ERROR.sql`

### Setup Admin:

- [ ] Pilih salah satu:
  - **Cara 1:** Edit email di `QUICK_SETUP_AUTO_ADMIN.sql` lalu jalankan
  - **Cara 2:** Set admin manual via SQL: `UPDATE users SET role = 'admin' WHERE email = '...'`
  - **Cara 3:** Gunakan `FLEKSIBEL_ADMIN_SETUP.sql` untuk setup lebih fleksibel

---

## 🎯 File yang HARUS Dijalankan Sekarang:

### Jika Ada Error 500:
```
supabase/FIX_RECURSIVE_ERROR.sql  ← JALANKAN INI SEKARANG!
```

### Jika Ingin Setup Admin Auto:
```
supabase/QUICK_SETUP_AUTO_ADMIN.sql  ← Edit email dulu, lalu jalankan
```

---

## 📝 Catatan:

- ✅ File migration sudah dijalankan via `npx supabase db push`
- ✅ Tidak perlu jalankan file migration manual lagi
- ⚠️ Jika ada error, jalankan `FIX_RECURSIVE_ERROR.sql`
- 🔧 File lain adalah reference/opsional

