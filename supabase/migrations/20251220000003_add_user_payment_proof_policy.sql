-- Migration: Add RLS policy for users to upload order payment proofs
-- This allows users to upload payment proof images for their QRIS orders

-- Policy: Allow users to upload order payment proofs
CREATE POLICY "Users can upload order payment proofs"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'store-uploads' AND
  -- Check if user has 'user' role
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role = 'user'
  ) AND
  -- Check if the path starts with 'order-payments/'
  name LIKE 'order-payments/%'
);

-- Policy: Allow users to view their own order payment proofs
CREATE POLICY "Users can view own order payment proofs"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'store-uploads' AND
  name LIKE 'order-payments/%' AND
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role = 'user'
  )
);

-- Policy: Allow toko to view order payment proofs for their orders
CREATE POLICY "Toko can view order payment proofs"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'store-uploads' AND
  name LIKE 'order-payments/%' AND
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role = 'toko'
  )
);

-- Policy: Allow admin to view all order payment proofs
CREATE POLICY "Admin can view all order payment proofs"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'store-uploads' AND
  name LIKE 'order-payments/%' AND
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

