-- Migration: Add payment_method column to orders table
-- This migration adds the payment_method column to track how customer paid for each order

-- Add payment_method column to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS payment_method TEXT;

-- Add comment to column
COMMENT ON COLUMN public.orders.payment_method IS 'Payment method used by customer: COD, QRIS, or TRANSFER';

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_orders_payment_method ON public.orders(payment_method);

