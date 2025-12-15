-- Migration: Setup Storage Bucket for Product Images
-- This migration sets up RLS policies and permissions for the product-images storage bucket
-- Note: The bucket itself must be created via Supabase Dashboard first
-- Note: RLS is already enabled on storage.objects by Supabase, so we don't need to enable it

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Public can view product images" ON storage.objects;
DROP POLICY IF EXISTS "Toko can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Toko can update own product images" ON storage.objects;
DROP POLICY IF EXISTS "Toko can delete own product images" ON storage.objects;
DROP POLICY IF EXISTS "Admin can manage all product images" ON storage.objects;

-- Policy 1: Allow public read access to product images
-- Anyone can view product images (for displaying in the app)
CREATE POLICY "Public can view product images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'product-images');

-- Policy 2: Allow authenticated users (toko role) to upload images
-- Only users with 'toko' role can upload to their own store folder
-- Path format: products/{store_id}/{filename}
CREATE POLICY "Toko can upload product images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'product-images' AND
  -- Check if user has 'toko' role
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role = 'toko'
  ) AND
  -- Check if the path starts with 'products/' and contains user's store_id
  name LIKE 'products/%' AND
  -- Extract store_id from path (format: products/{store_id}/{filename})
  -- Split by '/' and get second element (index 1)
  EXISTS (
    SELECT 1 FROM public.stores
    WHERE stores.user_id = auth.uid()
    AND (string_to_array(name, '/'))[2] = stores.id::text
  )
);

-- Policy 3: Allow authenticated users (toko role) to update their own images
CREATE POLICY "Toko can update own product images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'product-images' AND
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role = 'toko'
  ) AND
  name LIKE 'products/%' AND
  EXISTS (
    SELECT 1 FROM public.stores
    WHERE stores.user_id = auth.uid()
    AND (string_to_array(name, '/'))[2] = stores.id::text
  )
);

-- Policy 4: Allow authenticated users (toko role) to delete their own images
CREATE POLICY "Toko can delete own product images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'product-images' AND
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role = 'toko'
  ) AND
  name LIKE 'products/%' AND
  EXISTS (
    SELECT 1 FROM public.stores
    WHERE stores.user_id = auth.uid()
    AND (string_to_array(name, '/'))[2] = stores.id::text
  )
);

-- Policy 5: Allow admin to manage all product images
CREATE POLICY "Admin can manage all product images"
ON storage.objects
FOR ALL
TO authenticated
USING (
  bucket_id = 'product-images' AND
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
)
WITH CHECK (
  bucket_id = 'product-images' AND
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- Grant necessary permissions on storage schema (if not already granted)
-- Note: These grants may fail if already granted, but that's okay
DO $$
BEGIN
  GRANT USAGE ON SCHEMA storage TO authenticated;
  GRANT USAGE ON SCHEMA storage TO anon;
  GRANT SELECT ON storage.objects TO public;
  GRANT INSERT, UPDATE, DELETE ON storage.objects TO authenticated;
  GRANT SELECT ON storage.buckets TO public;
EXCEPTION
  WHEN OTHERS THEN
    -- Permissions may already be granted, ignore error
    NULL;
END $$;

-- Note: If the bucket doesn't exist, create it via Supabase Dashboard:
-- 1. Go to Storage in Supabase Dashboard
-- 2. Click "New bucket"
-- 3. Name: "product-images"
-- 4. Public bucket: YES (for public read access)
-- 5. File size limit: Set as needed (e.g., 5MB)
-- 6. Allowed MIME types: image/*
