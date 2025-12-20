-- Migration: Create function to auto-complete diantar orders after 24 hours
-- This function automatically changes status from 'diantar' to 'selesai' if > 24 hours

CREATE OR REPLACE FUNCTION auto_complete_diantar_orders()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  order_record RECORD;
  updated_count INTEGER := 0;
BEGIN
  -- Find orders with status 'diantar' that were updated more than 24 hours ago
  FOR order_record IN
    SELECT id, updated_at
    FROM public.orders
    WHERE status = 'diantar'
      AND updated_at < NOW() - INTERVAL '24 hours'
  LOOP
    -- Update status to 'selesai'
    UPDATE public.orders
    SET 
      status = 'selesai',
      updated_at = NOW()
    WHERE id = order_record.id;
    
    updated_count := updated_count + 1;
    
    RAISE NOTICE 'Auto-completed order % (was diantar since %)', order_record.id, order_record.updated_at;
  END LOOP;
  
  IF updated_count > 0 THEN
    RAISE NOTICE 'Auto-completed % orders', updated_count;
  END IF;
END;
$$;

-- Create a scheduled job to run this function daily
-- Note: This requires pg_cron extension which may not be available in all Supabase plans
-- Alternative: Use Supabase Edge Functions with cron triggers or external scheduler

COMMENT ON FUNCTION auto_complete_diantar_orders() IS 'Automatically completes orders with status diantar after 24 hours. Should be run daily via cron or scheduled job.';

