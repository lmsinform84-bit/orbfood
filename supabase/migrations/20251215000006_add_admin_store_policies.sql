-- ============================================
-- Migration: Add Admin Policies for Stores
-- ============================================
-- Menambahkan RLS policies untuk admin agar bisa melihat semua stores
-- termasuk yang status 'pending' untuk approval
-- ============================================

-- Drop existing admin policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Admins can view all stores" ON public.stores;
DROP POLICY IF EXISTS "Admins can update store status" ON public.stores;

-- Admin bisa melihat semua stores (termasuk pending, rejected, dll)
CREATE POLICY "Admins can view all stores"
  ON public.stores FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admin bisa update status store (untuk approval/rejection)
CREATE POLICY "Admins can update store status"
  ON public.stores FOR UPDATE
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
