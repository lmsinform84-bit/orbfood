-- Migration: Add qris_url and orb_qris_url columns to stores table
-- This migration adds QRIS URL columns for store QRIS and ORBfood QRIS

-- Add qris_url column for store's own QRIS
ALTER TABLE public.stores 
ADD COLUMN IF NOT EXISTS qris_url TEXT;

-- Add orb_qris_url column for ORBfood QRIS (for fee payment)
ALTER TABLE public.stores 
ADD COLUMN IF NOT EXISTS orb_qris_url TEXT;

-- Add comments
COMMENT ON COLUMN public.stores.qris_url IS 'URL to store QRIS image for customer payment';
COMMENT ON COLUMN public.stores.orb_qris_url IS 'URL to ORBfood QRIS image for fee payment from store to ORBfood';

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_stores_qris_url ON public.stores(qris_url) WHERE qris_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_stores_orb_qris_url ON public.stores(orb_qris_url) WHERE orb_qris_url IS NOT NULL;

