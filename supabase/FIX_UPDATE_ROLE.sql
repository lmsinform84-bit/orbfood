-- ============================================
-- SQL Script: Fix Update Role Issue
-- ============================================
-- Script ini untuk memperbaiki masalah update role user
-- Run di Supabase SQL Editor jika update role tidak bekerja
-- ============================================

-- 1. Pastikan RLS enabled
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies jika ada
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Admins can update user role" ON public.users;

-- 3. Create policy untuk admin view all users
CREATE POLICY "Admins can view all users"
  ON public.users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 4. Create policy untuk admin update user role
CREATE POLICY "Admins can update user role"
  ON public.users FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 5. Grant permissions untuk service_role (bypass RLS)
GRANT ALL ON public.users TO service_role;

-- 6. Test query (uncomment untuk test)
-- UPDATE public.users SET role = 'toko' WHERE id = 'USER_ID_HERE';
-- SELECT id, email, role FROM public.users WHERE id = 'USER_ID_HERE';
