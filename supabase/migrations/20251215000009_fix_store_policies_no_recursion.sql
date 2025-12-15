-- ============================================
-- Migration: Fix Store Policies (No Recursion)
-- ============================================
-- Memperbaiki potential recursion di store policies
-- ============================================

-- Drop existing admin store policies
DROP POLICY IF EXISTS "Admins can view all stores" ON public.stores;
DROP POLICY IF EXISTS "Admins can update store status" ON public.stores;

-- Catatan: Policy admin untuk stores juga tidak diperlukan karena:
-- 1. Admin operations menggunakan createAdminClient() dengan service_role
-- 2. Service role bypass semua RLS
-- 3. Policy admin hanya untuk regular client (anon/authenticated)
-- 4. Tapi untuk avoid recursion, kita akan buat policy yang lebih sederhana

-- Untuk admin view stores: Skip policy, rely on service_role
-- Untuk admin update stores: Skip policy, rely on service_role

-- Policy yang tetap ada (tidak recursive):
-- - "Anyone can view approved stores" -> untuk public
-- - "Store owners can view their own store" -> untuk owner
-- - "Store owners can update their own store" -> untuk owner
-- - "Store owners can insert their own store" -> untuk registrasi
