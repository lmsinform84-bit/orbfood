-- Migration: Add 'diantar' status to order_status enum
-- This adds the 'diantar' status between 'diproses' and 'selesai'

-- Add 'diantar' to order_status enum
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'diantar' AFTER 'diproses';

COMMENT ON TYPE order_status IS 'Order status: pending → diproses → diantar → selesai (or dibatalkan at any point)';

