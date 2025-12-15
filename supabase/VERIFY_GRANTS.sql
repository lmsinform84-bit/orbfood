-- ============================================
-- VERIFY: Cek Grant Permissions untuk Registrasi
-- ============================================
-- Jalankan query ini untuk verifikasi grant permissions
-- ============================================

-- 1. Cek grant untuk tabel users (untuk registrasi user dan toko)
SELECT 
  'Users Table Grants' as check_type,
  grantee,
  privilege_type,
  is_grantable,
  CASE 
    WHEN grantee = 'anon' AND privilege_type = 'INSERT' THEN '✅ anon can INSERT (registrasi)'
    WHEN grantee = 'authenticated' AND privilege_type = 'INSERT' THEN '✅ authenticated can INSERT'
    WHEN grantee = 'service_role' AND privilege_type = 'ALL' THEN '✅ service_role has ALL'
    ELSE 'ℹ️ ' || privilege_type
  END as status
FROM information_schema.role_table_grants
WHERE table_schema = 'public' 
  AND table_name = 'users'
  AND grantee IN ('anon', 'authenticated', 'service_role')
ORDER BY grantee, privilege_type;

-- 2. Cek grant untuk tabel stores (untuk registrasi toko)
SELECT 
  'Stores Table Grants' as check_type,
  grantee,
  privilege_type,
  is_grantable,
  CASE 
    WHEN grantee = 'authenticated' AND privilege_type = 'INSERT' THEN '✅ authenticated can INSERT stores'
    WHEN grantee = 'service_role' AND privilege_type = 'ALL' THEN '✅ service_role has ALL'
    ELSE 'ℹ️ ' || privilege_type
  END as status
FROM information_schema.role_table_grants
WHERE table_schema = 'public' 
  AND table_name = 'stores'
  AND grantee IN ('anon', 'authenticated', 'service_role')
ORDER BY grantee, privilege_type;

-- 3. Cek grant untuk function handle_new_user()
SELECT 
  'Function Grants' as check_type,
  grantee,
  privilege_type,
  CASE 
    WHEN grantee IN ('anon', 'authenticated', 'service_role') THEN '✅ ' || grantee || ' can execute'
    ELSE 'ℹ️ ' || grantee
  END as status
FROM information_schema.routine_privileges
WHERE routine_schema = 'public'
  AND routine_name = 'handle_new_user'
ORDER BY grantee;

-- 4. Summary: Grant yang diperlukan untuk registrasi
SELECT 
  'Summary' as check_type,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.role_table_grants
      WHERE table_name = 'users' AND grantee = 'anon' AND privilege_type = 'INSERT'
    ) THEN '✅ anon can INSERT to users (registrasi user)'
    ELSE '❌ anon CANNOT INSERT to users'
  END as user_registration,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.role_table_grants
      WHERE table_name = 'stores' AND grantee = 'authenticated' AND privilege_type = 'INSERT'
    ) OR EXISTS (
      SELECT 1 FROM information_schema.role_table_grants
      WHERE table_name = 'stores' AND grantee = 'service_role'
    ) THEN '✅ Can INSERT to stores (registrasi toko)'
    ELSE '❌ CANNOT INSERT to stores'
  END as store_registration,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.routine_privileges
      WHERE routine_name = 'handle_new_user' AND grantee IN ('anon', 'authenticated', 'service_role')
    ) THEN '✅ Function can be executed'
    ELSE '❌ Function CANNOT be executed'
  END as function_execution;

-- ============================================
-- INTERPRETASI:
-- ============================================
-- 
-- Untuk REGISTRASI USER:
-- ✅ anon harus punya INSERT permission di users
-- ✅ Function handle_new_user() harus bisa di-execute oleh anon
--
-- Untuk REGISTRASI TOKO:
-- ✅ API route menggunakan service_role (sudah punya ALL)
-- ✅ Function handle_new_user() harus bisa di-execute oleh service_role
-- ✅ service_role harus bisa INSERT ke stores
--
-- Jika ada ❌, jalankan FIX_REGISTRATION_ERROR.sql
--
-- ============================================

