-- ============================================
-- Migration: RLS Policies (Simple & Non-Recursive)
-- ============================================
-- Policies sederhana yang tidak recursive
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_work_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.users;
DROP POLICY IF EXISTS "Anyone can view approved stores" ON public.stores;
DROP POLICY IF EXISTS "Store owners can view their own store" ON public.stores;
DROP POLICY IF EXISTS "Store owners can update their own store" ON public.stores;
DROP POLICY IF EXISTS "Store owners can insert their own store" ON public.stores;
DROP POLICY IF EXISTS "Anyone can view work hours of approved stores" ON public.store_work_hours;
DROP POLICY IF EXISTS "Store owners can manage their work hours" ON public.store_work_hours;
DROP POLICY IF EXISTS "Store owners can manage their settings" ON public.store_settings;
DROP POLICY IF EXISTS "Anyone can view available products from approved stores" ON public.products;
DROP POLICY IF EXISTS "Store owners can view all their products" ON public.products;
DROP POLICY IF EXISTS "Store owners can manage their products" ON public.products;
DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can create their own orders" ON public.orders;
DROP POLICY IF EXISTS "Store owners can view orders for their store" ON public.orders;
DROP POLICY IF EXISTS "Store owners can update order status" ON public.orders;
DROP POLICY IF EXISTS "Users can view items of their own orders" ON public.order_items;
DROP POLICY IF EXISTS "Store owners can view items of orders for their store" ON public.order_items;
DROP POLICY IF EXISTS "Users can create order items for their orders" ON public.order_items;

-- ============================================
-- USERS POLICIES (Simple, Non-Recursive)
-- ============================================

-- User bisa view profile mereka sendiri
CREATE POLICY "Users can view their own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

-- User bisa update profile mereka sendiri
CREATE POLICY "Users can update their own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Enable insert untuk trigger function (auto-create user profile)
-- Trigger function handle_new_user() menggunakan SECURITY DEFINER yang bypass RLS
-- Policy ini mengizinkan insert dari trigger function
CREATE POLICY "Enable insert for authenticated users"
  ON public.users FOR INSERT
  WITH CHECK (true);  -- Allow insert dari trigger function (SECURITY DEFINER)

-- ============================================
-- STORES POLICIES
-- ============================================

-- Siapa saja bisa lihat store yang approved
CREATE POLICY "Anyone can view approved stores"
  ON public.stores FOR SELECT
  USING (status = 'approved');

-- Store owner bisa lihat store mereka sendiri
CREATE POLICY "Store owners can view their own store"
  ON public.stores FOR SELECT
  USING (user_id = auth.uid());

-- Store owner bisa update store mereka sendiri
CREATE POLICY "Store owners can update their own store"
  ON public.stores FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Store owner bisa insert store mereka sendiri
CREATE POLICY "Store owners can insert their own store"
  ON public.stores FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- ============================================
-- STORE WORK HOURS POLICIES
-- ============================================

-- Siapa saja bisa lihat jam buka store yang approved
CREATE POLICY "Anyone can view work hours of approved stores"
  ON public.store_work_hours FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.stores
      WHERE id = store_work_hours.store_id AND status = 'approved'
    )
  );

-- Store owner bisa manage jam buka mereka
CREATE POLICY "Store owners can manage their work hours"
  ON public.store_work_hours FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.stores
      WHERE id = store_work_hours.store_id AND user_id = auth.uid()
    )
  );

-- ============================================
-- STORE SETTINGS POLICIES
-- ============================================

-- Store owner bisa manage settings mereka
CREATE POLICY "Store owners can manage their settings"
  ON public.store_settings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.stores
      WHERE id = store_settings.store_id AND user_id = auth.uid()
    )
  );

-- ============================================
-- PRODUCTS POLICIES
-- ============================================

-- Siapa saja bisa lihat produk yang available dari store approved
CREATE POLICY "Anyone can view available products from approved stores"
  ON public.products FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.stores
      WHERE id = products.store_id AND status = 'approved'
    )
    AND is_available = true
  );

-- Store owner bisa lihat semua produk mereka
CREATE POLICY "Store owners can view all their products"
  ON public.products FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.stores
      WHERE id = products.store_id AND user_id = auth.uid()
    )
  );

-- Store owner bisa manage produk mereka
CREATE POLICY "Store owners can manage their products"
  ON public.products FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.stores
      WHERE id = products.store_id AND user_id = auth.uid()
    )
  );

-- ============================================
-- ORDERS POLICIES
-- ============================================

-- User bisa lihat order mereka sendiri
CREATE POLICY "Users can view their own orders"
  ON public.orders FOR SELECT
  USING (user_id = auth.uid());

-- User bisa create order mereka sendiri
CREATE POLICY "Users can create their own orders"
  ON public.orders FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Store owner bisa lihat order untuk store mereka
CREATE POLICY "Store owners can view orders for their store"
  ON public.orders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.stores
      WHERE id = orders.store_id AND user_id = auth.uid()
    )
  );

-- Store owner bisa update status order untuk store mereka
CREATE POLICY "Store owners can update order status"
  ON public.orders FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.stores
      WHERE id = orders.store_id AND user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.stores
      WHERE id = orders.store_id AND user_id = auth.uid()
    )
  );

-- ============================================
-- ORDER ITEMS POLICIES
-- ============================================

-- User bisa lihat items dari order mereka sendiri
CREATE POLICY "Users can view items of their own orders"
  ON public.order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE id = order_items.order_id AND user_id = auth.uid()
    )
  );

-- Store owner bisa lihat items dari order untuk store mereka
CREATE POLICY "Store owners can view items of orders for their store"
  ON public.order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      JOIN public.stores ON stores.id = orders.store_id
      WHERE orders.id = order_items.order_id AND stores.user_id = auth.uid()
    )
  );

-- User bisa create items untuk order mereka sendiri
CREATE POLICY "Users can create order items for their orders"
  ON public.order_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE id = order_items.order_id AND user_id = auth.uid()
    )
  );
