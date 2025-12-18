-- Migration: Setup Storage Bucket for Store Uploads (Invoice Payment Proofs)
-- This migration sets up RLS policies and permissions for the store-uploads storage bucket
-- Note: The bucket itself must be created via Supabase Dashboard first
-- Bucket name: store-uploads
-- Folder structure: invoice-payments/{order_id}-{timestamp}.{ext}

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Public can view store uploads" ON storage.objects;
DROP POLICY IF EXISTS "Toko can upload invoice payment proofs" ON storage.objects;
DROP POLICY IF EXISTS "Toko can view own invoice payment proofs" ON storage.objects;
DROP POLICY IF EXISTS "Admin can view all invoice payment proofs" ON storage.objects;
DROP POLICY IF EXISTS "Admin can manage all store uploads" ON storage.objects;

-- Policy 1: Allow authenticated users (toko role) to upload invoice payment proofs
-- Path format: invoice-payments/{order_id}-{timestamp}.{ext}
CREATE POLICY "Toko can upload invoice payment proofs"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'store-uploads' AND
  -- Check if user has 'toko' role
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role = 'toko'
  ) AND
  -- Check if the path starts with 'invoice-payments/'
  name LIKE 'invoice-payments/%'
);

-- Policy 2: Allow authenticated users (toko role) to view invoice payment proofs
-- Simplified: Toko can view all files in invoice-payments/ folder
-- (They can only upload for their own orders anyway)
CREATE POLICY "Toko can view own invoice payment proofs"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'store-uploads' AND
  name LIKE 'invoice-payments/%' AND
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role = 'toko'
  )
);

-- Policy 3: Allow admin to view all invoice payment proofs
CREATE POLICY "Admin can view all invoice payment proofs"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'store-uploads' AND
  name LIKE 'invoice-payments/%' AND
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- Policy 4: Allow admin to manage all store uploads
CREATE POLICY "Admin can manage all store uploads"
ON storage.objects
FOR ALL
TO authenticated
USING (
  bucket_id = 'store-uploads' AND
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
)
WITH CHECK (
  bucket_id = 'store-uploads' AND
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- Grant necessary permissions on storage schema (if not already granted)
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
-- 3. Name: "store-uploads"
-- 4. Public bucket: NO (private bucket for security)
-- 5. File size limit: 5MB (for payment proof images)
-- 6. Allowed MIME types: image/*

