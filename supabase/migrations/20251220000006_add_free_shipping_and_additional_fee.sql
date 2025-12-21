-- Migration: Add free shipping threshold and additional delivery fee support
-- This migration adds:
-- 1. min_order_free_shipping to store_settings (minimal belanja gratis ongkir)
-- 2. additional_delivery_fee to orders (ongkir tambahan yang diajukan toko)
-- 3. additional_delivery_note to orders (catatan toko untuk ongkir tambahan)
-- 4. additional_delivery_status to orders (status persetujuan ongkir tambahan)

-- Add min_order_free_shipping to store_settings
ALTER TABLE public.store_settings 
ADD COLUMN IF NOT EXISTS min_order_free_shipping DECIMAL(10, 2) DEFAULT NULL;

COMMENT ON COLUMN public.store_settings.min_order_free_shipping IS 'Minimal belanja untuk mendapatkan gratis ongkir. NULL = tidak ada gratis ongkir.';

-- Add additional delivery fee fields to orders
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS additional_delivery_fee DECIMAL(10, 2) DEFAULT NULL;

COMMENT ON COLUMN public.orders.additional_delivery_fee IS 'Ongkir tambahan yang diajukan toko. NULL = tidak ada ongkir tambahan.';

ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS additional_delivery_note TEXT DEFAULT NULL;

COMMENT ON COLUMN public.orders.additional_delivery_note IS 'Catatan toko untuk ongkir tambahan.';

-- Add status for additional delivery fee approval
-- We'll use a new status 'menunggu_persetujuan' in order_status enum
-- But first check if it exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'order_status' 
    AND EXISTS (
      SELECT 1 FROM pg_enum 
      WHERE enumlabel = 'menunggu_persetujuan' 
      AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'order_status')
    )
  ) THEN
    ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'menunggu_persetujuan' AFTER 'pending';
  END IF;
END $$;

COMMENT ON TYPE order_status IS 'Order status: pending → menunggu_persetujuan (ongkir tambahan) → diproses → diantar → selesai (or dibatalkan at any point)';

