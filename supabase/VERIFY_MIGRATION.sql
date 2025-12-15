-- ============================================
-- VERIFY: Cek apakah migration sudah di-apply dengan benar
-- ============================================
-- Jalankan query ini di Supabase SQL Editor untuk verifikasi
-- ============================================

-- 1. Cek function handle_new_user() ada dan menggunakan role dari metadata
SELECT 
  proname as function_name,
  prosrc as function_source
FROM pg_proc
WHERE proname = 'handle_new_user';

-- 2. Cek trigger aktif
SELECT 
  tgname as trigger_name,
  tgrelid::regclass as table_name,
  tgenabled as is_enabled
FROM pg_trigger
WHERE tgname = 'on_auth_user_created';

-- 3. Cek RLS policy untuk insert
SELECT 
  policyname,
  cmd,
  roles
FROM pg_policies 
WHERE tablename = 'users' AND cmd = 'INSERT'
ORDER BY policyname;

-- 4. Test: Cek apakah function bisa membaca role dari metadata
-- (Ini hanya untuk verifikasi, tidak akan execute)
SELECT 
  'Function should read role from user_metadata->>''role''' as note,
  'Expected: user_role := role_from_metadata::user_role' as expected_behavior;

-- ============================================
-- Jika function_source tidak mengandung "role_from_metadata",
-- berarti migration belum di-apply dengan benar
-- ============================================
