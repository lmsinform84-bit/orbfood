# 🎯 File SQL - Yang Harus Dijalankan

## ⚠️ URGENT: Fix Error 500

### File: `supabase/FIX_RECURSIVE_ERROR.sql`

**Jalankan jika login error dengan:**
- `Error 500: Internal Server Error`
- `infinite recursion detected in policy for relation "users"`

**Langkah:**
1. Buka **Supabase Dashboard > SQL Editor**
2. Copy seluruh isi file `supabase/FIX_RECURSIVE_ERROR.sql`
3. Paste dan **RUN**
4. Test login lagi

---

## 📦 File Lainnya

| File | Status | Kapan Dijalankan |
|------|--------|------------------|
| `FIX_RECURSIVE_ERROR.sql` | ⚠️ **JALANKAN SEKARANG** | Jika ada error 500 |
| `QUICK_SETUP_AUTO_ADMIN.sql` | Opsional | Setup auto-admin via email |
| `FLEKSIBEL_ADMIN_SETUP.sql` | Opsional | Setup admin fleksibel |
| `schema.sql` | ❌ Tidak perlu | Reference saja |
| `migrations/*.sql` | ✅ Sudah dijalankan | Via `npx supabase db push` |

---

## ✅ Yang Sudah Dibersihkan

File-file berikut sudah dihapus (duplicate/tidak perlu):
- ❌ `FIX_RLS_POLICY.sql`
- ❌ `FIX_500_ERROR.sql`
- ❌ `FIX_RECURSIVE_RLS.sql`
- ❌ `FIX_500_COMPLETE.sql`
- ❌ `FIX_RECURSION_NOW.sql`

---

## 🚀 Quick Start

**Jika ada error 500, jalankan:**
```sql
-- File: supabase/FIX_RECURSIVE_ERROR.sql
-- Copy-paste ke Supabase Dashboard > SQL Editor
```

