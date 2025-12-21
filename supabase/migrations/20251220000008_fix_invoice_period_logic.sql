-- Fix ambiguous column reference and align with invoic.md requirements
-- Key points from invoic.md:
-- 1. One active invoice per store
-- 2. New invoice created AFTER old invoice is paid (lunas)
-- 3. Invoice closed when period ends, but status remains BELUM LUNAS
-- 4. New period starts when old invoice is paid

-- Fix ambiguous column reference in add_order_to_active_invoice
CREATE OR REPLACE FUNCTION add_order_to_active_invoice(
  store_uuid UUID,
  order_uuid UUID,
  order_total DECIMAL(10, 2)
)
RETURNS UUID AS $$
DECLARE
  v_invoice_id UUID;
  v_period_uuid UUID;
  v_order_fee DECIMAL(10, 2);
  v_period_start TIMESTAMPTZ;
  v_period_end TIMESTAMPTZ;
BEGIN
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
  -- IMPORTANT: Orders should NOT be added to invoices with status 'lunas'
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

  -- Calculate fee (5%)
  v_order_fee := order_total * 0.05;

  -- Check if order already in this invoice (fix ambiguous reference using table alias)
  IF NOT EXISTS (
    SELECT 1 FROM public.invoice_orders io
    WHERE io.invoice_id = v_invoice_id AND io.order_id = order_uuid
  ) THEN
    -- Add order to invoice_orders
    INSERT INTO public.invoice_orders (invoice_id, order_id, order_revenue, order_fee)
    VALUES (v_invoice_id, order_uuid, order_total, v_order_fee);

    -- Update invoice totals
    UPDATE public.invoices
    SET 
      total_orders = total_orders + 1,
      total_revenue = total_revenue + order_total,
      fee_amount = fee_amount + v_order_fee,
      period_end = NOW(), -- Update period_end to current time
      updated_at = NOW()
    WHERE id = v_invoice_id;
  END IF;

  RETURN v_invoice_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- Update get_or_create_active_invoice to match invoic.md logic
-- Only get/create invoice for active period, don't create new period automatically
CREATE OR REPLACE FUNCTION get_or_create_active_invoice(store_uuid UUID, period_uuid UUID)
RETURNS UUID AS $$
DECLARE
  v_invoice_id UUID;
  v_period_start_date TIMESTAMPTZ;
  v_period_end_date TIMESTAMPTZ;
BEGIN
  -- Get period dates
  SELECT start_date, end_date INTO v_period_start_date, v_period_end_date
  FROM public.store_periods
  WHERE id = period_uuid AND store_id = store_uuid AND is_active = true
  LIMIT 1;

  IF v_period_start_date IS NULL THEN
    RAISE EXCEPTION 'Active period not found for store';
  END IF;

  -- Check if invoice already exists for this active period
  -- Only one active invoice per store (status: menunggu_pembayaran or menunggu_verifikasi)
  SELECT id INTO v_invoice_id
  FROM public.invoices
  WHERE store_id = store_uuid 
    AND period_id = period_uuid
    AND status IN ('menunggu_pembayaran', 'menunggu_verifikasi')
  LIMIT 1;

  -- If no invoice exists, create one
  IF v_invoice_id IS NULL THEN
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
      period_uuid,
      NULL,
      0,
      0,
      0,
      'menunggu_pembayaran',
      v_period_start_date,
      COALESCE(v_period_end_date, NOW())
    )
    RETURNING id INTO v_invoice_id;
  END IF;

  RETURN v_invoice_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- Function to close period and create new one when invoice is paid (lunas)
-- This matches invoic.md: "Invoice baru dibuat setelah invoice lama lunas"
CREATE OR REPLACE FUNCTION close_period_and_create_new(store_uuid UUID, period_uuid UUID)
RETURNS UUID AS $$
DECLARE
  v_new_period_id UUID;
BEGIN
  -- Close current period
  UPDATE public.store_periods
  SET is_active = false, end_date = NOW()
  WHERE id = period_uuid AND store_id = store_uuid;

  -- Create new period (new invoice will be created when first order completes)
  INSERT INTO public.store_periods (store_id, start_date, is_active)
  VALUES (store_uuid, NOW(), true)
  RETURNING id INTO v_new_period_id;

  RETURN v_new_period_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- Function to check and close period if it exceeds duration (e.g., 7 days)
-- This matches invoic.md: "Periode berakhir → Invoice ditutup"
-- But invoice status remains BELUM LUNAS, new invoice created for new period
CREATE OR REPLACE FUNCTION check_and_close_expired_periods()
RETURNS void AS $$
DECLARE
  v_period RECORD;
  v_new_period_id UUID;
BEGIN
  -- Find active periods older than 7 days (default period duration)
  FOR v_period IN
    SELECT id, store_id, start_date
    FROM public.store_periods
    WHERE is_active = true
      AND start_date < NOW() - INTERVAL '7 days'
  LOOP
    -- Close the expired period
    UPDATE public.store_periods
    SET is_active = false, end_date = NOW()
    WHERE id = v_period.id;

    -- Create new period for this store
    INSERT INTO public.store_periods (store_id, start_date, is_active)
    VALUES (v_period.store_id, NOW(), true)
    RETURNING id INTO v_new_period_id;

    -- Note: Invoice status remains BELUM LUNAS (not changed here)
    -- New invoice will be created when first order completes in new period
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

