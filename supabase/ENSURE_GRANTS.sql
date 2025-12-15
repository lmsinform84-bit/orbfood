-- ============================================
-- ENSURE: Pastikan Grant Permissions untuk Registrasi
-- ============================================
-- Script ini memastikan semua grant permissions sudah ada
-- untuk registrasi user dan toko
-- ============================================

-- ============================================
-- GRANT untuk REGISTRASI USER (via form, menggunakan anon)
-- ============================================

-- Grant untuk tabel users (anon perlu INSERT untuk registrasi)
GRANT SELECT, INSERT, UPDATE ON public.users TO anon;
GRANT SELECT, INSERT, UPDATE ON public.users TO authenticated;
GRANT ALL ON public.users TO service_role;

-- Grant untuk function handle_new_user() (anon perlu execute untuk trigger)
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres, anon, authenticated, service_role;

-- ============================================
-- GRANT untuk REGISTRASI TOKO (via API route, menggunakan service_role)
-- ============================================

-- Grant untuk tabel stores (service_role perlu INSERT untuk create store)
-- Note: service_role sudah punya ALL, tapi kita explicit untuk clarity
GRANT SELECT, INSERT, UPDATE, DELETE ON public.stores TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.stores TO authenticated;
GRANT SELECT ON public.stores TO anon;

-- ============================================
-- VERIFY: Cek semua grant sudah ada
-- ============================================

-- 1. Grant untuk users table
SELECT 
  'Users Table Grants' as check_type,
  grantee,
  string_agg(privilege_type, ', ') as privileges,
  CASE 
    WHEN grantee = 'anon' AND 'INSERT' = ANY(string_to_array(string_agg(privilege_type, ','), ',')) THEN '✅ anon can INSERT (registrasi user)'
    WHEN grantee = 'authenticated' AND 'INSERT' = ANY(string_to_array(string_agg(privilege_type, ','), ',')) THEN '✅ authenticated can INSERT'
    WHEN grantee = 'service_role' THEN '✅ service_role has ALL'
    ELSE '⚠️ Check manually'
  END as status
FROM information_schema.role_table_grants
WHERE table_schema = 'public' 
  AND table_name = 'users'
  AND grantee IN ('anon', 'authenticated', 'service_role')
GROUP BY grantee
ORDER BY grantee;

-- 2. Grant untuk stores table
SELECT 
  'Stores Table Grants' as check_type,
  grantee,
  string_agg(privilege_type, ', ') as privileges,
  CASE 
    WHEN grantee = 'service_role' AND ('ALL' = ANY(string_to_array(string_agg(privilege_type, ','), ',')) OR 'INSERT' = ANY(string_to_array(string_agg(privilege_type, ','), ','))) THEN '✅ service_role can INSERT (registrasi toko)'
    WHEN grantee = 'authenticated' AND 'INSERT' = ANY(string_to_array(string_agg(privilege_type, ','), ',')) THEN '✅ authenticated can INSERT'
    ELSE '⚠️ Check manually'
  END as status
FROM information_schema.role_table_grants
WHERE table_schema = 'public' 
  AND table_name = 'stores'
  AND grantee IN ('anon', 'authenticated', 'service_role')
GROUP BY grantee
ORDER BY grantee;

-- 3. Grant untuk function handle_new_user()
SELECT 
  'Function Grants' as check_type,
  grantee,
  privilege_type,
  CASE 
    WHEN grantee = 'anon' THEN '✅ anon can execute (registrasi user)'
    WHEN grantee = 'service_role' THEN '✅ service_role can execute (registrasi toko)'
    WHEN grantee = 'authenticated' THEN '✅ authenticated can execute'
    ELSE '⚠️ Check manually'
  END as status
FROM information_schema.routine_privileges
WHERE routine_schema = 'public'
  AND routine_name = 'handle_new_user'
  AND grantee IN ('anon', 'authenticated', 'service_role', 'postgres')
ORDER BY grantee;

-- 4. Summary
SELECT 
  'Summary' as check_type,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.role_table_grants
      WHERE table_name = 'users' AND grantee = 'anon' AND privilege_type = 'INSERT'
    ) THEN '✅ User Registration: anon can INSERT to users'
    ELSE '❌ User Registration: anon CANNOT INSERT to users'
  END as user_registration,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.role_table_grants
      WHERE table_name = 'stores' AND grantee = 'service_role'
    ) THEN '✅ Store Registration: service_role can INSERT to stores'
    ELSE '❌ Store Registration: service_role CANNOT INSERT to stores'
  END as store_registration,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.routine_privileges
      WHERE routine_name = 'handle_new_user' AND grantee IN ('anon', 'service_role')
    ) THEN '✅ Function Execution: Can execute handle_new_user()'
    ELSE '❌ Function Execution: CANNOT execute handle_new_user()'
  END as function_execution;

-- ============================================
-- CATATAN:
-- ============================================
-- 
-- REGISTRASI USER (via form /register):
-- ✅ anon perlu INSERT permission di users
-- ✅ anon perlu EXECUTE permission di handle_new_user()
-- ✅ RLS policy "Enable insert for anon" harus ada
--
-- REGISTRASI TOKO (via API /api/auth/register-store):
-- ✅ service_role perlu INSERT permission di users (sudah punya ALL)
-- ✅ service_role perlu INSERT permission di stores (sudah punya ALL)
-- ✅ service_role perlu EXECUTE permission di handle_new_user()
-- ✅ Function menggunakan SECURITY DEFINER (bypass RLS)
--
-- ============================================

