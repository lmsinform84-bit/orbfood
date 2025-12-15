-- Function untuk membuat admin user langsung
-- Cara penggunaan:
-- 1. Buat user di Supabase Auth Dashboard terlebih dahulu (Authentication > Users > Add User)
-- 2. Atau gunakan function ini untuk create user langsung
-- 3. Jalankan query ini dengan mengganti email dan password

-- Method 1: Create admin via Supabase Auth Dashboard lalu update role
-- Setelah membuat user di Auth Dashboard, jalankan query ini:
-- UPDATE public.users SET role = 'admin' WHERE email = 'admin@example.com';

-- Method 2: Create admin langsung dengan function (jika belum ada user)
-- Function ini akan create user di auth.users dan public.users sekaligus

CREATE OR REPLACE FUNCTION create_admin_user(
  admin_email TEXT,
  admin_password TEXT,
  admin_full_name TEXT DEFAULT 'Admin User'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_user_id UUID;
BEGIN
  -- Create user di auth.users menggunakan Supabase Auth
  -- Note: Ini hanya bisa dilakukan via Supabase Auth API atau Dashboard
  -- Function ini hanya untuk create profile di public.users
  
  -- Get user ID dari auth.users berdasarkan email
  SELECT id INTO new_user_id
  FROM auth.users
  WHERE email = admin_email;
  
  -- Jika user belum ada di auth.users, kita tidak bisa create langsung
  -- User harus dibuat via Supabase Auth Dashboard atau API terlebih dahulu
  IF new_user_id IS NULL THEN
    RAISE EXCEPTION 'User dengan email % belum ada di auth.users. Silakan buat user di Supabase Auth Dashboard terlebih dahulu.', admin_email;
  END IF;
  
  -- Create atau update profile di public.users dengan role admin
  INSERT INTO public.users (id, email, full_name, role)
  VALUES (new_user_id, admin_email, admin_full_name, 'admin')
  ON CONFLICT (id) 
  DO UPDATE SET 
    role = 'admin',
    full_name = COALESCE(EXCLUDED.full_name, public.users.full_name);
  
  RETURN new_user_id;
END;
$$;

-- Trigger untuk auto-create user profile saat user dibuat di auth
-- Trigger ini akan otomatis create profile dengan role 'user' default
-- Untuk admin, perlu diupdate manual atau via function create_admin_user

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NULL),
    'user' -- Default role, bisa diubah ke 'admin' jika diperlukan
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Buat trigger jika belum ada
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Function untuk update user menjadi admin
CREATE OR REPLACE FUNCTION make_user_admin(user_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.users
  SET role = 'admin'
  WHERE email = user_email;
  
  IF FOUND THEN
    RETURN TRUE;
  ELSE
    RAISE EXCEPTION 'User dengan email % tidak ditemukan', user_email;
  END IF;
END;
$$;

