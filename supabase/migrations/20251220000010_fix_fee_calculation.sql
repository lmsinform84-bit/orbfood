-- Fix fee calculation to use subtotal only (not delivery fee)
-- According to devvoc.md: Fee = 5% of food subtotal only

-- Create new function that calculates fee from subtotal
CREATE OR REPLACE FUNCTION add_order_to_active_invoice_with_subtotal(
  store_uuid UUID,
  order_uuid UUID,
  order_subtotal DECIMAL(10, 2)
)
RETURNS UUID AS $$
DECLARE
  v_invoice_id UUID;
  v_period_uuid UUID;
  v_order_fee DECIMAL(10, 2);
  v_order_total DECIMAL(10, 2);
  v_period_start TIMESTAMPTZ;
  v_period_end TIMESTAMPTZ;
BEGIN
  -- Get order total (for revenue tracking)
  SELECT final_total INTO v_order_total
  FROM public.orders
  WHERE id = order_uuid;

  -- Get or create active period
  SELECT id INTO v_period_uuid
  FROM public.store_periods
  WHERE store_id = store_uuid AND is_active = true
  LIMIT 1;

  IF v_period_uuid IS NULL THEN
    -- Create initial period if doesn't exist
    SELECT create_initial_store_period(store_uuid) INTO v_period_uuid;
  END IF;

  -- Get active invoice for this period
  -- Only one active invoice per store (status: menunggu_pembayaran or menunggu_verifikasi)
  SELECT id INTO v_invoice_id
  FROM public.invoices
  WHERE store_id = store_uuid
    AND period_id = v_period_uuid
    AND status IN ('menunggu_pembayaran', 'menunggu_verifikasi')
  ORDER BY created_at DESC
  LIMIT 1;

  -- If no active invoice exists, create one
  IF v_invoice_id IS NULL THEN
    -- Get period dates
    SELECT start_date, end_date INTO v_period_start, v_period_end
    FROM public.store_periods
    WHERE id = v_period_uuid AND store_id = store_uuid
    LIMIT 1;

    INSERT INTO public.invoices (
      store_id,
      period_id,
      order_id,
      total_orders,
      total_revenue,
      fee_amount,
      status,
      period_start,
      period_end
    )
    VALUES (
      store_uuid,
      v_period_uuid,
      NULL,
      0,
      0,
      0,
      'menunggu_pembayaran',
      v_period_start,
      COALESCE(v_period_end, NOW())
    )
    RETURNING id INTO v_invoice_id;
  END IF;

  -- Calculate fee from subtotal only (5% of food subtotal, not delivery fee)
  v_order_fee := order_subtotal * 0.05;

  -- Check if order already in this invoice
  IF NOT EXISTS (
    SELECT 1 FROM public.invoice_orders io
    WHERE io.invoice_id = v_invoice_id AND io.order_id = order_uuid
  ) THEN
    -- Add order to invoice_orders
    INSERT INTO public.invoice_orders (invoice_id, order_id, order_revenue, order_fee)
    VALUES (v_invoice_id, order_uuid, v_order_total, v_order_fee);

    -- Update invoice totals
    UPDATE public.invoices
    SET
      total_orders = total_orders + 1,
      total_revenue = total_revenue + v_order_total,
      fee_amount = fee_amount + v_order_fee,
      period_end = NOW(), -- Update period_end to current time
      updated_at = NOW()
    WHERE id = v_invoice_id;
  END IF;

  RETURN v_invoice_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- Update existing function to use subtotal internally
CREATE OR REPLACE FUNCTION add_order_to_active_invoice(
  store_uuid UUID,
  order_uuid UUID,
  order_total DECIMAL(10, 2)
)
RETURNS UUID AS $$
DECLARE
  v_subtotal DECIMAL(10, 2);
BEGIN
  -- Get subtotal from order
  SELECT total_price INTO v_subtotal
  FROM public.orders
  WHERE id = order_uuid;

  -- Call the new function with subtotal
  RETURN add_order_to_active_invoice_with_subtotal(store_uuid, order_uuid, v_subtotal);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;