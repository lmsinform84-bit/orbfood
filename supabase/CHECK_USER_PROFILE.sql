-- ============================================
-- CHECK: User Profile Status
-- ============================================
-- Cek apakah user yang sudah login ada di table users
-- ============================================

-- Check user yang ada di auth.users tapi belum di public.users
SELECT 
  'Users missing from public.users' as info,
  au.id,
  au.email,
  au.created_at as auth_created_at
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL;

-- Check total count
SELECT 
  'User count comparison' as info,
  (SELECT COUNT(*) FROM auth.users) as total_auth_users,
  (SELECT COUNT(*) FROM public.users) as total_public_users,
  (SELECT COUNT(*) FROM auth.users) - (SELECT COUNT(*) FROM public.users) as missing_count;

-- Check trigger status
SELECT 
  'Trigger status' as info,
  tgname as trigger_name,
  tgrelid::regclass as table_name,
  tgenabled as is_enabled,
  tgisinternal as is_internal
FROM pg_trigger
WHERE tgname = 'on_auth_user_created';

-- Check function status
SELECT 
  'Function status' as info,
  proname as function_name,
  prosecdef as is_security_definer,
  prorettype::regtype as return_type
FROM pg_proc
WHERE proname = 'handle_new_user';

-- ============================================
-- Jika ada user yang missing, jalankan:
-- supabase/SETUP_AUTO_USER_PROFILE.sql
-- untuk sync user yang sudah ada
-- ============================================
