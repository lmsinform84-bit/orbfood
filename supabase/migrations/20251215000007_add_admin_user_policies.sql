-- ============================================
-- Migration: Add Admin Policies for Users Table
-- ============================================
-- Menambahkan RLS policies untuk admin agar bisa update role user
-- ============================================

-- Drop existing admin policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Admins can update user role" ON public.users;

-- Admin bisa melihat semua users
CREATE POLICY "Admins can view all users"
  ON public.users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admin bisa update role user (untuk approve store)
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
