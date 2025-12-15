-- ============================================
-- DEBUG: Cek Error Registrasi
-- ============================================
-- Jalankan query ini untuk debug error registrasi
-- ============================================

-- 1. Cek apakah function ada dan benar
SELECT 
  'Function Status' as check_type,
  proname as function_name,
  prosecdef as is_security_definer,
  CASE 
    WHEN prosrc LIKE '%role_from_metadata%' THEN '✅ Reads role from metadata'
    ELSE '❌ Does NOT read role from metadata'
  END as verification,
  prosrc as function_source
FROM pg_proc
WHERE proname = 'handle_new_user';

-- 2. Cek trigger aktif
SELECT 
  'Trigger Status' as check_type,
  tgname as trigger_name,
  tgrelid::regclass as table_name,
  tgenabled as is_enabled,
  CASE 
    WHEN tgenabled = 'O' THEN '✅ Enabled'
    ELSE '❌ Disabled'
  END as status
FROM pg_trigger
WHERE tgname = 'on_auth_user_created';

-- 3. Cek RLS enabled
SELECT 
  'RLS Status' as check_type,
  tablename,
  rowsecurity as rls_enabled,
  CASE 
    WHEN rowsecurity THEN '✅ RLS Enabled'
    ELSE '❌ RLS Disabled'
  END as status
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'users';

-- 4. Cek semua RLS policies untuk INSERT
SELECT 
  'RLS Policies (INSERT)' as check_type,
  policyname,
  cmd,
  roles,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'users' AND cmd = 'INSERT'
ORDER BY policyname;

-- 5. Cek table permissions
SELECT 
  'Table Permissions' as check_type,
  grantee,
  privilege_type,
  is_grantable
FROM information_schema.role_table_grants
WHERE table_schema = 'public' 
  AND table_name = 'users'
  AND grantee IN ('anon', 'authenticated', 'service_role', 'postgres')
ORDER BY grantee, privilege_type;

-- 6. Cek function permissions
SELECT 
  'Function Permissions' as check_type,
  grantee,
  privilege_type
FROM information_schema.routine_privileges
WHERE routine_schema = 'public'
  AND routine_name = 'handle_new_user'
ORDER BY grantee;

-- 7. Test: Cek apakah bisa insert (simulasi)
-- Ini hanya untuk verifikasi, tidak akan benar-benar insert
SELECT 
  'Test Insert Capability' as check_type,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE tablename = 'users' 
        AND cmd = 'INSERT' 
        AND (roles = '{anon}' OR roles = '{}' OR roles IS NULL)
    ) THEN '✅ Policy exists for anon insert'
    ELSE '❌ No policy for anon insert'
  END as anon_insert_policy,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.role_table_grants
      WHERE table_schema = 'public'
        AND table_name = 'users'
        AND grantee = 'anon'
        AND privilege_type = 'INSERT'
    ) THEN '✅ anon has INSERT permission'
    ELSE '❌ anon does NOT have INSERT permission'
  END as anon_insert_permission;

-- 8. Cek error log terakhir (jika ada)
-- Note: Ini hanya akan work jika ada error log yang bisa diakses
SELECT 
  'Recent Errors' as check_type,
  'Check Supabase Dashboard → Logs → Postgres Logs for recent errors' as note;

-- ============================================
-- INTERPRETASI HASIL:
-- ============================================
-- 
-- 1. Function harus ada dengan is_security_definer = true
-- 2. Trigger harus enabled (tgenabled = 'O')
-- 3. RLS harus enabled (rowsecurity = true)
-- 4. Harus ada policy INSERT untuk anon
-- 5. anon harus punya INSERT permission
--
-- Jika ada yang ❌, jalankan FIX_REGISTRATION_ERROR.sql
--
-- ============================================

