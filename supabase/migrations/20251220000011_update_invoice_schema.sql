-- Update invoice schema to match devvoc.md specifications
-- 1. Change status enum to ACTIVE/PENDING_VERIFICATION/PAID
-- 2. Add opened_at/closed_at columns
-- 3. Create invoice_items table to track fees per order
-- 4. Update logic to have one active invoice per store

-- First, add new columns to invoices table
ALTER TABLE public.invoices
ADD COLUMN IF NOT EXISTS opened_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS closed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS previous_invoice_id UUID REFERENCES public.invoices(id);

-- Create invoice_items table (equivalent to InvoiceItem in devvoc.md)
CREATE TABLE IF NOT EXISTS public.invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES public.orders(id),
  fee_amount DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(invoice_id, order_id) -- One entry per order per invoice
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON public.invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_order_id ON public.invoice_items(order_id);

-- Update existing invoices to set opened_at from period_start
UPDATE public.invoices
SET opened_at = period_start
WHERE opened_at IS NULL;

-- For active invoices, set opened_at to store creation date if not set
UPDATE public.invoices
SET opened_at = stores.created_at
FROM public.stores
WHERE invoices.store_id = stores.id
  AND invoices.opened_at IS NULL
  AND invoices.status IN ('menunggu_pembayaran', 'menunggu_verifikasi');

-- Migrate invoice_orders data to invoice_items
INSERT INTO public.invoice_items (invoice_id, order_id, fee_amount)
SELECT io.invoice_id, io.order_id, io.order_fee
FROM public.invoice_orders io
ON CONFLICT (invoice_id, order_id) DO NOTHING;

-- Update status values to match devvoc.md
UPDATE public.invoices
SET status = CASE
  WHEN status = 'menunggu_pembayaran' THEN 'ACTIVE'
  WHEN status = 'menunggu_verifikasi' THEN 'PENDING_VERIFICATION'
  WHEN status = 'lunas' THEN 'PAID'
  ELSE status
END;

-- Create new function to get active invoice per store (devvoc.md style)
CREATE OR REPLACE FUNCTION get_active_invoice_for_store(store_uuid UUID)
RETURNS UUID AS $$
DECLARE
  v_invoice_id UUID;
BEGIN
  -- Get the active invoice for this store
  SELECT id INTO v_invoice_id
  FROM public.invoices
  WHERE store_id = store_uuid
    AND status = 'ACTIVE'
  ORDER BY opened_at DESC
  LIMIT 1;

  RETURN v_invoice_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- Function to create new active invoice when old one is paid
CREATE OR REPLACE FUNCTION create_new_active_invoice(store_uuid UUID, previous_closed_at TIMESTAMPTZ)
RETURNS UUID AS $$
DECLARE
  v_new_invoice_id UUID;
  v_previous_invoice_id UUID;
BEGIN
  -- Get the previous invoice ID
  SELECT id INTO v_previous_invoice_id
  FROM public.invoices
  WHERE store_id = store_uuid AND status = 'PAID'
  ORDER BY closed_at DESC
  LIMIT 1;

  -- Create new active invoice
  INSERT INTO public.invoices (
    store_id,
    status,
    total_fee,
    total_orders,
    opened_at,
    closed_at,
    previous_invoice_id
  )
  VALUES (
    store_uuid,
    'ACTIVE',
    0,
    0,
    previous_closed_at,
    NULL,
    v_previous_invoice_id
  )
  RETURNING id INTO v_new_invoice_id;

  RETURN v_new_invoice_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- Update add_order_to_active_invoice_with_subtotal to use new schema
CREATE OR REPLACE FUNCTION add_order_to_active_invoice_with_subtotal(
  store_uuid UUID,
  order_uuid UUID,
  order_subtotal DECIMAL(10, 2)
)
RETURNS UUID AS $$
DECLARE
  v_invoice_id UUID;
  v_order_fee DECIMAL(10, 2);
BEGIN
  -- Get active invoice for this store
  SELECT get_active_invoice_for_store(store_uuid) INTO v_invoice_id;

  -- If no active invoice exists, create one
  IF v_invoice_id IS NULL THEN
    -- Create initial active invoice
    INSERT INTO public.invoices (
      store_id,
      status,
      total_fee,
      total_orders,
      opened_at,
      closed_at
    )
    VALUES (
      store_uuid,
      'ACTIVE',
      0,
      0,
      NOW(),
      NULL
    )
    RETURNING id INTO v_invoice_id;
  END IF;

  -- Calculate fee from subtotal only (5% of food subtotal)
  v_order_fee := order_subtotal * 0.05;

  -- Check if order already in this invoice
  IF NOT EXISTS (
    SELECT 1 FROM public.invoice_items
    WHERE invoice_id = v_invoice_id AND order_id = order_uuid
  ) THEN
    -- Add order to invoice_items
    INSERT INTO public.invoice_items (invoice_id, order_id, fee_amount)
    VALUES (v_invoice_id, order_uuid, v_order_fee);

    -- Update invoice totals
    UPDATE public.invoices
    SET
      total_fee = total_fee + v_order_fee,
      total_orders = total_orders + 1,
      updated_at = NOW()
    WHERE id = v_invoice_id;
  END IF;

  RETURN v_invoice_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;