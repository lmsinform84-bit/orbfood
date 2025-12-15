-- ============================================
-- Migration: Fix Admin User Policies (No Recursion)
-- ============================================
-- Memperbaiki infinite recursion di RLS policy untuk users table
-- Solusi: Hapus policy admin untuk users karena service_role sudah bypass RLS
-- ============================================

-- Drop existing admin policies yang menyebabkan recursion
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Admins can update user role" ON public.users;

-- Catatan penting:
-- Policy admin untuk users table TIDAK DIPERLUKAN karena:
-- 1. createAdminClient() menggunakan SUPABASE_SERVICE_ROLE_KEY
-- 2. Service role key BYPASS semua RLS policies
-- 3. Semua operasi admin (view/update users) dilakukan via service_role
-- 4. Policy admin hanya akan menyebabkan infinite recursion

-- Untuk operasi admin:
-- - View users: Gunakan createAdminClient() -> bypass RLS
-- - Update role: Gunakan createAdminClient() -> bypass RLS
-- - Tidak perlu policy khusus karena service_role sudah bypass

-- Policy yang tetap ada:
-- - "Users can view their own profile" -> untuk user biasa
-- - "Users can update their own profile" -> untuk user biasa
-- - "Enable insert for authenticated users" -> untuk registrasi
