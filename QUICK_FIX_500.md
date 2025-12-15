# 🚨 Quick Fix Error 500 - Infinite Recursion

## Error:
```
Error Postgres: 42P17 infinite recursion detected in policy for relation "users"
```

## Penyebab:
RLS policy untuk admin melakukan query ke table `users` di dalam policy itu sendiri, menyebabkan recursive loop.

## ✅ Solusi Cepat:

### Jalankan SQL ini di Supabase Dashboard > SQL Editor:

File: `supabase/FIX_500_COMPLETE.sql`

Atau copy-paste script lengkap di bawah:

```sql
-- Drop semua policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;

-- Buat helper function (bypass RLS)
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  current_user_id UUID;
  user_role user_role;
BEGIN
  current_user_id := auth.uid();
  IF current_user_id IS NULL THEN RETURN FALSE; END IF;
  
  SELECT role INTO user_role FROM public.users WHERE id = current_user_id;
  RETURN COALESCE(user_role = 'admin', false);
END;
$$;

GRANT EXECUTE ON FUNCTION public.is_current_user_admin() TO authenticated, anon;

-- Buat policies (tidak recursive)
CREATE POLICY "Users can view their own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all users"
  ON public.users FOR SELECT
  USING (public.is_current_user_admin());

CREATE POLICY "Users can update their own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
```

## Setelah Fix:

1. ✅ Test login di aplikasi
2. ✅ Pastikan tidak ada error 500
3. ✅ User bisa read role mereka sendiri
4. ✅ Admin bisa view semua users

## Penjelasan:

Function `is_current_user_admin()` menggunakan `SECURITY DEFINER` yang:
- Bypass RLS saat query ke table users
- Tidak trigger policy check lagi
- Menghindari infinite recursive loop

---

**File lengkap ada di: `supabase/FIX_500_COMPLETE.sql`**

