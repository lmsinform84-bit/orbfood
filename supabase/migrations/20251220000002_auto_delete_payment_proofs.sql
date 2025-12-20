-- Migration: Create function to auto-delete payment proofs after 7 days
-- This function deletes payment proof images from storage after 7 days
-- Only deletes the image, not the order data

-- Create function to delete old payment proofs
CREATE OR REPLACE FUNCTION delete_old_payment_proofs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  proof_record RECORD;
  file_path TEXT;
  days_old INTEGER;
BEGIN
  -- Find orders with payment proofs older than 7 days
  FOR proof_record IN
    SELECT 
      id,
      payment_proof_url,
      payment_proof_uploaded_at
    FROM public.orders
    WHERE payment_proof_url IS NOT NULL
      AND payment_proof_uploaded_at IS NOT NULL
      AND payment_proof_uploaded_at < NOW() - INTERVAL '7 days'
  LOOP
    -- Extract file path from URL
    -- URL format: https://...supabase.co/storage/v1/object/public/store-uploads/order-payments/{filename}
    -- We need: order-payments/{filename}
    file_path := substring(proof_record.payment_proof_url from 'order-payments/[^?]+');
    
    IF file_path IS NOT NULL THEN
      -- Delete from storage (this will be handled by a scheduled job or edge function)
      -- For now, we just clear the URL from database
      -- The actual file deletion should be done via Supabase Storage API or Edge Function
      
      -- Clear payment proof URL (keep uploaded_at for audit)
      UPDATE public.orders
      SET payment_proof_url = NULL
      WHERE id = proof_record.id;
      
      RAISE NOTICE 'Cleared payment proof URL for order % (file: %)', proof_record.id, file_path;
    END IF;
  END LOOP;
END;
$$;

-- Create a scheduled job to run this function daily
-- Note: This requires pg_cron extension which may not be available in all Supabase plans
-- Alternative: Use Supabase Edge Functions with cron triggers or external scheduler

COMMENT ON FUNCTION delete_old_payment_proofs() IS 'Deletes payment proof URLs from orders table after 7 days. Actual file deletion should be handled separately via Storage API.';

