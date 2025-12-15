-- ============================================
-- Migration: Auto-Create User Profile dengan Role dari Metadata
-- ============================================
-- Trigger untuk otomatis membuat user profile saat user register
-- Membaca role dari user_metadata->>'role' (bisa 'user' atau 'toko')
-- Default role: 'user'
-- Admin dibuat manual, tidak via registrasi
-- ============================================

-- Function untuk auto-create user profile dengan role dari metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_email TEXT;
  user_role user_role := 'user'; -- Default role
  user_full_name TEXT;
  user_phone TEXT;
  role_from_metadata TEXT;
  is_admin BOOLEAN := false;
  admin_emails TEXT[] := ARRAY[
    'admin@orbfood.com',
    'admin@example.com'
    -- Tambahkan email admin lain di sini jika perlu
  ];
BEGIN
  -- Get user data dari auth.users
  user_email := COALESCE(NEW.email, '');
  user_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    NULL
  );
  user_phone := NEW.raw_user_meta_data->>'phone';
  role_from_metadata := NEW.raw_user_meta_data->>'role';
  
  -- Check jika email ada di list admin emails (untuk admin yang dibuat manual)
  is_admin := user_email = ANY(admin_emails);
  
  -- Tentukan role berdasarkan prioritas:
  -- 1. Admin email (jika email ada di list) -> 'admin'
  -- 2. Role dari metadata (jika ada) -> 'user' atau 'toko'
  -- 3. Default -> 'user'
  IF is_admin THEN
    user_role := 'admin'::user_role;
  ELSIF role_from_metadata IS NOT NULL THEN
    -- Validasi dan cast role dari metadata
    BEGIN
      IF role_from_metadata IN ('user', 'toko', 'admin') THEN
        user_role := role_from_metadata::user_role;
      ELSE
        -- Role tidak valid, gunakan default
        user_role := 'user'::user_role;
        RAISE WARNING 'Invalid role from metadata: %. Using default: user', role_from_metadata;
      END IF;
    EXCEPTION
      WHEN OTHERS THEN
        -- Jika casting error, gunakan default
        user_role := 'user'::user_role;
        RAISE WARNING 'Error casting role from metadata: %. Using default: user', role_from_metadata;
    END;
  ELSE
    -- Default role untuk user biasa
    user_role := 'user'::user_role;
  END IF;
  
  -- Insert ke public.users dengan role sesuai
  INSERT INTO public.users (id, email, full_name, phone, role)
  VALUES (
    NEW.id,
    user_email,
    user_full_name,
    user_phone,
    user_role
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, public.users.full_name),
    phone = COALESCE(EXCLUDED.phone, public.users.phone),
    -- Jangan update role jika sudah admin (untuk admin yang sudah dibuat manual)
    role = CASE 
      WHEN public.users.role = 'admin'::user_role THEN public.users.role
      ELSE COALESCE(EXCLUDED.role, public.users.role)
    END;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error untuk debugging
    RAISE WARNING 'Error creating user profile for user % (email: %): %', 
      NEW.id, user_email, SQLERRM;
    -- Tetap return NEW agar user creation tidak gagal
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger jika sudah ada
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger yang akan fire saat user baru dibuat
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres, anon, authenticated, service_role;

-- Pastikan RLS enabled di table users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Pastikan RLS policy mengizinkan insert dari trigger
-- Policy untuk insert (dari trigger function dengan SECURITY DEFINER)
DROP POLICY IF EXISTS "Enable insert for trigger" ON public.users;
CREATE POLICY "Enable insert for trigger"
  ON public.users FOR INSERT
  WITH CHECK (true);

-- Policy untuk insert dari anon (untuk registrasi)
DROP POLICY IF EXISTS "Enable insert for anon" ON public.users;
CREATE POLICY "Enable insert for anon"
  ON public.users FOR INSERT
  TO anon
  WITH CHECK (true);

-- Comment untuk dokumentasi
COMMENT ON FUNCTION public.handle_new_user() IS 
'Otomatis membuat user profile saat user baru register. 
Membaca role dari user_metadata->>''role'' (bisa ''user'' atau ''toko'').
Default role: ''user''.
Admin dibuat manual, tidak via registrasi.';
