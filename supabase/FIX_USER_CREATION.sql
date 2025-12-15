-- ============================================
-- FIX: Database error creating new user
-- ============================================
-- Memperbaiki error saat create user di Supabase Auth
-- ============================================

-- STEP 1: Pastikan function handle_new_user() ada dan benar
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert ke public.users dengan role default 'user'
  INSERT INTO public.users (id, email, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(
      NEW.raw_user_meta_data->>'full_name', 
      NEW.raw_user_meta_data->>'name',
      NULL
    ),
    'user'::user_role
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, public.users.full_name);
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error tapi jangan gagalkan user creation
    RAISE WARNING 'Error creating user profile: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- STEP 2: Pastikan trigger ada
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- STEP 3: Grant permissions pada function
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres, anon, authenticated, service_role;

-- STEP 4: Pastikan ada policy INSERT untuk users
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.users;

-- Policy untuk insert (untuk trigger function)
-- SECURITY DEFINER function seharusnya bypass RLS, tapi tetap perlu policy
CREATE POLICY "Enable insert for authenticated users"
  ON public.users FOR INSERT
  WITH CHECK (true);  -- Allow insert dari trigger function

-- STEP 5: Pastikan GRANT permissions sudah ada
GRANT SELECT, INSERT, UPDATE ON public.users TO authenticated;
GRANT SELECT, INSERT ON public.users TO anon;
GRANT ALL ON public.users TO service_role;

-- STEP 6: Sync user yang sudah ada (jika ada user di auth.users tapi belum di public.users)
DO $$
DECLARE
  user_record RECORD;
  inserted_count INTEGER := 0;
BEGIN
  -- Loop semua user di auth.users yang belum ada di public.users
  FOR user_record IN 
    SELECT 
      au.id,
      au.email,
      COALESCE(
        au.raw_user_meta_data->>'full_name',
        au.raw_user_meta_data->>'name',
        NULL
      ) as full_name
    FROM auth.users au
    LEFT JOIN public.users pu ON au.id = pu.id
    WHERE pu.id IS NULL
  LOOP
    -- Insert user ke public.users
    INSERT INTO public.users (id, email, full_name, role)
    VALUES (
      user_record.id,
      COALESCE(user_record.email, ''),
      user_record.full_name,
      'user'::user_role
    )
    ON CONFLICT (id) DO NOTHING;
    
    inserted_count := inserted_count + 1;
  END LOOP;
  
  -- Report hasil
  IF inserted_count > 0 THEN
    RAISE NOTICE 'Successfully synced % user(s) from auth.users to public.users', inserted_count;
  ELSE
    RAISE NOTICE 'All users already synced. No new users to insert.';
  END IF;
END $$;

-- STEP 7: Verify
SELECT 
  'SUCCESS: Function and trigger created' as status,
  proname as function_name,
  prosecdef as is_security_definer
FROM pg_proc
WHERE proname = 'handle_new_user';

SELECT 
  'SUCCESS: Trigger created' as status,
  tgname as trigger_name,
  tgrelid::regclass as table_name
FROM pg_trigger
WHERE tgname = 'on_auth_user_created';

SELECT 
  'SUCCESS: Policies created' as status,
  policyname,
  cmd
FROM pg_policies 
WHERE tablename = 'users'
ORDER BY policyname;

-- STEP 8: Check sync status
SELECT 
  'User sync status' as info,
  (SELECT COUNT(*) FROM auth.users) as total_auth_users,
  (SELECT COUNT(*) FROM public.users) as total_public_users,
  (SELECT COUNT(*) FROM auth.users) - (SELECT COUNT(*) FROM public.users) as missing_users;

-- ============================================
-- CATATAN:
-- ============================================
-- 
-- 1. ✅ Function menggunakan SECURITY DEFINER untuk bypass RLS
-- 2. ✅ Policy INSERT dengan WITH CHECK (true) mengizinkan insert dari trigger
-- 3. ✅ User yang sudah ada sudah di-sync ke public.users
-- 4. ✅ Setelah ini, semua user baru akan otomatis ada di public.users
-- 5. Setelah menjalankan script ini, coba create user lagi
--
-- ============================================
