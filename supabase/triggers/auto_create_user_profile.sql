-- Trigger untuk otomatis membuat user profile saat user dibuat di auth.users
-- Trigger ini akan otomatis insert ke public.users dengan role default 'user'
-- Untuk set admin, bisa langsung update role di Supabase Dashboard atau gunakan function

-- Function untuk auto-create user profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_email TEXT;
  is_admin BOOLEAN := false;
  admin_emails TEXT[] := ARRAY[
    'admin@orbfood.com',
    'admin@example.com'
    -- Tambahkan email admin lain di sini
  ];
BEGIN
  user_email := NEW.email;
  
  -- Check jika email ada di list admin emails
  is_admin := user_email = ANY(admin_emails);
  
  -- Insert ke public.users dengan role sesuai
  INSERT INTO public.users (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', NULL),
    CASE 
      WHEN is_admin THEN 'admin'::user_role
      ELSE 'user'::user_role
    END
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, public.users.full_name);
  
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

-- Function untuk update role user (bisa dipanggil manual)
CREATE OR REPLACE FUNCTION public.set_user_role(user_id UUID, new_role user_role)
RETURNS void AS $$
BEGIN
  UPDATE public.users
  SET role = new_role
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function untuk set admin berdasarkan email (bisa dipanggil manual)
CREATE OR REPLACE FUNCTION public.set_admin_by_email(user_email TEXT)
RETURNS void AS $$
BEGIN
  UPDATE public.users
  SET role = 'admin'::user_role
  WHERE email = user_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.set_user_role(UUID, user_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_admin_by_email(TEXT) TO authenticated;

