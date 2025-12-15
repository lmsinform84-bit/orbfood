-- ============================================
-- Migration: Grant Permissions
-- ============================================
-- Memberikan permissions ke authenticated dan anon roles
-- ============================================

-- GRANT permissions untuk tabel users
GRANT SELECT, INSERT, UPDATE ON public.users TO authenticated;
GRANT SELECT, INSERT ON public.users TO anon;
GRANT ALL ON public.users TO service_role;

-- GRANT permissions untuk tabel stores
GRANT SELECT, INSERT, UPDATE ON public.stores TO authenticated;
GRANT SELECT ON public.stores TO anon;

-- GRANT permissions untuk tabel store_work_hours
GRANT SELECT, INSERT, UPDATE, DELETE ON public.store_work_hours TO authenticated;
GRANT SELECT ON public.store_work_hours TO anon;

-- GRANT permissions untuk tabel store_settings
GRANT SELECT, INSERT, UPDATE ON public.store_settings TO authenticated;
GRANT SELECT ON public.store_settings TO anon;

-- GRANT permissions untuk tabel products
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT SELECT ON public.products TO anon;

-- GRANT permissions untuk tabel orders
GRANT SELECT, INSERT, UPDATE ON public.orders TO authenticated;
GRANT SELECT ON public.orders TO anon;

-- GRANT permissions untuk tabel order_items
GRANT SELECT, INSERT ON public.order_items TO authenticated;
GRANT SELECT ON public.order_items TO anon;
