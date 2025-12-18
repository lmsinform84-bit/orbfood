-- Migration: Fix invoice insert policies
-- This migration adds missing INSERT policies for invoices and store_periods

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Admins can insert invoices" ON public.invoices;
DROP POLICY IF EXISTS "Authenticated users can insert invoices for their stores" ON public.invoices;
DROP POLICY IF EXISTS "Admins can insert periods" ON public.store_periods;
DROP POLICY IF EXISTS "Authenticated users can insert periods for their stores" ON public.store_periods;

-- RLS Policies for invoices INSERT
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

-- RLS Policies for store_periods INSERT
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

-- Also add INSERT policy for invoice_activity_logs
DROP POLICY IF EXISTS "Admins can insert invoice activity logs" ON public.invoice_activity_logs;
DROP POLICY IF EXISTS "Authenticated users can insert invoice activity logs" ON public.invoice_activity_logs;

CREATE POLICY "Admins can insert invoice activity logs"
  ON public.invoice_activity_logs FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

CREATE POLICY "Authenticated users can insert invoice activity logs for their invoices"
  ON public.invoice_activity_logs FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.invoices
      JOIN public.stores ON stores.id = invoices.store_id
      WHERE invoices.id = invoice_activity_logs.invoice_id
      AND stores.user_id = auth.uid()
    )
  );

