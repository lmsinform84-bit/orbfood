-- Migration: Add payment_methods column to store_settings
-- This migration adds the payment_methods column to store_settings table

-- Add payment_methods column as JSONB to store_settings table
ALTER TABLE public.store_settings 
ADD COLUMN IF NOT EXISTS payment_methods JSONB DEFAULT '["COD", "TRANSFER", "QRIS"]'::jsonb;

-- Add comment to column
COMMENT ON COLUMN public.store_settings.payment_methods IS 'Array of payment methods accepted by the store. Default: ["COD", "TRANSFER", "QRIS"]';

