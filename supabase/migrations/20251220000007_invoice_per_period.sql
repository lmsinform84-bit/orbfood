-- Migration: Change invoice system from per-order to per-period
-- Invoice will aggregate all completed orders in an active period

-- Create invoice_orders table to track which orders belong to which invoice
CREATE TABLE IF NOT EXISTS public.invoice_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  order_revenue DECIMAL(10, 2) NOT NULL,
  order_fee DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(invoice_id, order_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_invoice_orders_invoice_id ON public.invoice_orders(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_orders_order_id ON public.invoice_orders(order_id);

-- Make order_id nullable in invoices (since invoice is now per-period, not per-order)
ALTER TABLE public.invoices 
  ALTER COLUMN order_id DROP NOT NULL;

-- Function to get or create active invoice for a period
CREATE OR REPLACE FUNCTION get_or_create_active_invoice(store_uuid UUID, period_uuid UUID)
RETURNS UUID AS $$
DECLARE
  invoice_id UUID;
  period_start_date TIMESTAMPTZ;
  period_end_date TIMESTAMPTZ;
BEGIN
  -- Get period dates
  SELECT start_date, end_date INTO period_start_date, period_end_date
  FROM public.store_periods
  WHERE id = period_uuid AND store_id = store_uuid AND is_active = true
  LIMIT 1;

  IF period_start_date IS NULL THEN
    RAISE EXCEPTION 'Active period not found for store';
  END IF;

  -- Check if invoice already exists for this active period
  SELECT id INTO invoice_id
  FROM public.invoices
  WHERE store_id = store_uuid 
    AND period_id = period_uuid
    AND status IN ('menunggu_pembayaran', 'menunggu_verifikasi')
  LIMIT 1;

  -- If no invoice exists, create one
  IF invoice_id IS NULL THEN
    INSERT INTO public.invoices (
      store_id,
      period_id,
      order_id, -- NULL for period-based invoices
      total_orders,
      total_revenue,
      fee_amount,
      status,
      period_start,
      period_end
    )
    VALUES (
      store_uuid,
      period_uuid,
      NULL,
      0,
      0,
      0,
      'menunggu_pembayaran',
      period_start_date,
      COALESCE(period_end_date, NOW())
    )
    RETURNING id INTO invoice_id;
  END IF;

  RETURN invoice_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- Function to add order to active invoice
CREATE OR REPLACE FUNCTION add_order_to_active_invoice(
  store_uuid UUID,
  order_uuid UUID,
  order_total DECIMAL(10, 2)
)
RETURNS UUID AS $$
DECLARE
  invoice_id UUID;
  period_uuid UUID;
  fee_amount DECIMAL(10, 2);
  order_fee DECIMAL(10, 2);
BEGIN
  -- Get or create active period
  SELECT id INTO period_uuid
  FROM public.store_periods
  WHERE store_id = store_uuid AND is_active = true
  LIMIT 1;

  IF period_uuid IS NULL THEN
    -- Create initial period if doesn't exist
    SELECT create_initial_store_period(store_uuid) INTO period_uuid;
  END IF;

  -- Get or create active invoice for this period
  SELECT get_or_create_active_invoice(store_uuid, period_uuid) INTO invoice_id;

  -- Calculate fee (5%)
  order_fee := order_total * 0.05;

  -- Check if order already in this invoice
  IF NOT EXISTS (
    SELECT 1 FROM public.invoice_orders 
    WHERE invoice_id = invoice_id AND order_id = order_uuid
  ) THEN
    -- Add order to invoice_orders
    INSERT INTO public.invoice_orders (invoice_id, order_id, order_revenue, order_fee)
    VALUES (invoice_id, order_uuid, order_total, order_fee);

    -- Update invoice totals
    UPDATE public.invoices
    SET 
      total_orders = total_orders + 1,
      total_revenue = total_revenue + order_total,
      fee_amount = fee_amount + order_fee,
      period_end = NOW(), -- Update period_end to current time
      updated_at = NOW()
    WHERE id = invoice_id;
  END IF;

  RETURN invoice_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- Enable RLS for invoice_orders
ALTER TABLE public.invoice_orders ENABLE ROW LEVEL SECURITY;

-- RLS Policies for invoice_orders
CREATE POLICY "Store owners can view their invoice orders"
  ON public.invoice_orders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.invoices
      JOIN public.stores ON stores.id = invoices.store_id
      WHERE invoices.id = invoice_orders.invoice_id
      AND stores.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all invoice orders"
  ON public.invoice_orders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Update invoice_activity_logs to use performed_by instead of created_by_user_id if needed
-- (Check if column exists first)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'invoice_activity_logs' 
    AND column_name = 'performed_by'
  ) THEN
    -- Add performed_by if it doesn't exist
    ALTER TABLE public.invoice_activity_logs 
    ADD COLUMN IF NOT EXISTS performed_by UUID REFERENCES public.users(id) ON DELETE SET NULL;
  END IF;
END $$;

