-- Migration: Add cod_max_limit column to store_settings
-- This migration adds the cod_max_limit column to set maximum COD payment amount per store

-- Add cod_max_limit column to store_settings table
ALTER TABLE public.store_settings 
ADD COLUMN IF NOT EXISTS cod_max_limit DECIMAL(10, 2) DEFAULT 50000.00;

-- Add comment to column
COMMENT ON COLUMN public.store_settings.cod_max_limit IS 'Maximum amount allowed for COD (Cash on Delivery) payment. Default: 50000.00';

