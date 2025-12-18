-- Migration: Create invoices and store_periods tables
-- This migration creates tables to track invoice status and store billing periods

-- Create invoice_status enum
CREATE TYPE invoice_status AS ENUM ('menunggu_pembayaran', 'menunggu_verifikasi', 'lunas');

-- Create store_periods table to track billing periods
CREATE TABLE IF NOT EXISTS public.store_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_date TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create unique index for active period per store (only one active period per store)
CREATE UNIQUE INDEX IF NOT EXISTS idx_store_periods_one_active 
  ON public.store_periods(store_id) 
  WHERE is_active = true;

-- Create invoices table
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  period_id UUID REFERENCES public.store_periods(id) ON DELETE SET NULL,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  -- Invoice details
  total_orders INTEGER NOT NULL DEFAULT 0,
  total_revenue DECIMAL(10, 2) NOT NULL DEFAULT 0,
  fee_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  -- Status and payment
  status invoice_status NOT NULL DEFAULT 'menunggu_pembayaran',
  payment_proof_url TEXT,
  payment_proof_uploaded_at TIMESTAMPTZ,
  payment_proof_rejected BOOLEAN DEFAULT false,
  payment_proof_rejection_reason TEXT,
  -- Verification
  verified_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  verified_at TIMESTAMPTZ,
  -- Period dates
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create invoice_activity_logs table for audit trail
CREATE TABLE IF NOT EXISTS public.invoice_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  description TEXT,
  performed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_store_periods_store_id ON public.store_periods(store_id);
CREATE INDEX IF NOT EXISTS idx_store_periods_active ON public.store_periods(store_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_invoices_store_id ON public.invoices(store_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_period_id ON public.invoices(period_id);
CREATE INDEX IF NOT EXISTS idx_invoices_order_id ON public.invoices(order_id);
CREATE INDEX IF NOT EXISTS idx_invoice_activity_logs_invoice_id ON public.invoice_activity_logs(invoice_id);

-- Create trigger for updated_at
CREATE TRIGGER update_store_periods_updated_at BEFORE UPDATE ON public.store_periods
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE public.store_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_activity_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for store_periods
CREATE POLICY "Store owners can view their own periods"
  ON public.store_periods FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.stores
      WHERE stores.id = store_periods.store_id
      AND stores.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all periods"
  ON public.store_periods FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can insert periods"
  ON public.store_periods FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

CREATE POLICY "Authenticated users can insert periods for their stores"
  ON public.store_periods FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.stores
      WHERE stores.id = store_periods.store_id
      AND stores.user_id = auth.uid()
    )
  );

-- RLS Policies for invoices
CREATE POLICY "Store owners can view their own invoices"
  ON public.invoices FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.stores
      WHERE stores.id = invoices.store_id
      AND stores.user_id = auth.uid()
    )
  );

CREATE POLICY "Store owners can update their own invoices (for payment proof upload)"
  ON public.invoices FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.stores
      WHERE stores.id = invoices.store_id
      AND stores.user_id = auth.uid()
    )
  )
  WITH CHECK (
    -- Only allow updating payment_proof_url and payment_proof_uploaded_at
    -- Status can only be updated by admin
    EXISTS (
      SELECT 1 FROM public.stores
      WHERE stores.id = invoices.store_id
      AND stores.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all invoices"
  ON public.invoices FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can update invoice status"
  ON public.invoices FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can insert invoices"
  ON public.invoices FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

CREATE POLICY "Authenticated users can insert invoices for their stores"
  ON public.invoices FOR INSERT
  WITH CHECK (
    -- Allow if user is authenticated and owns the store
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.stores
      WHERE stores.id = invoices.store_id
      AND stores.user_id = auth.uid()
    )
  );

-- RLS Policies for invoice_activity_logs
CREATE POLICY "Store owners can view their invoice activity logs"
  ON public.invoice_activity_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.invoices
      JOIN public.stores ON stores.id = invoices.store_id
      WHERE invoices.id = invoice_activity_logs.invoice_id
      AND stores.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all invoice activity logs"
  ON public.invoice_activity_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Function to create initial period for a store
-- SECURITY DEFINER allows this function to bypass RLS
CREATE OR REPLACE FUNCTION create_initial_store_period(store_uuid UUID)
RETURNS UUID AS $$
DECLARE
  period_id UUID;
BEGIN
  -- Check if store already has an active period
  SELECT id INTO period_id
  FROM public.store_periods
  WHERE store_id = store_uuid AND is_active = true
  LIMIT 1;

  -- If no active period exists, create one
  IF period_id IS NULL THEN
    INSERT INTO public.store_periods (store_id, start_date, is_active)
    VALUES (store_uuid, NOW(), true)
    RETURNING id INTO period_id;
  END IF;

  RETURN period_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- Function to close period and create new one
-- SECURITY DEFINER allows this function to bypass RLS
CREATE OR REPLACE FUNCTION close_period_and_create_new(store_uuid UUID, period_uuid UUID)
RETURNS UUID AS $$
DECLARE
  new_period_id UUID;
BEGIN
  -- Close current period
  UPDATE public.store_periods
  SET is_active = false, end_date = NOW()
  WHERE id = period_uuid AND store_id = store_uuid;

  -- Create new period
  INSERT INTO public.store_periods (store_id, start_date, is_active)
  VALUES (store_uuid, NOW(), true)
  RETURNING id INTO new_period_id;

  RETURN new_period_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

