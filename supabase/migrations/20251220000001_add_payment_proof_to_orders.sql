-- Migration: Add payment_proof_url and payment_proof_uploaded_at to orders table
-- This migration adds columns to store payment proof for QRIS orders

-- Add payment_proof_url column to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS payment_proof_url TEXT;

COMMENT ON COLUMN public.orders.payment_proof_url IS 'URL to payment proof image uploaded by customer for QRIS orders';

-- Add payment_proof_uploaded_at column
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS payment_proof_uploaded_at TIMESTAMPTZ;

COMMENT ON COLUMN public.orders.payment_proof_uploaded_at IS 'Timestamp when payment proof was uploaded by customer';

