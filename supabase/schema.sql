-- Enable necessary extensions
-- Using gen_random_uuid() which is built-in PostgreSQL 13+ (no extension needed)

-- Create custom types
CREATE TYPE user_role AS ENUM ('user', 'toko', 'admin');
CREATE TYPE order_status AS ENUM ('pending', 'diproses', 'selesai', 'dibatalkan');
CREATE TYPE store_status AS ENUM ('pending', 'approved', 'suspended', 'rejected');

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role user_role NOT NULL DEFAULT 'user',
  phone TEXT,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stores table
CREATE TABLE IF NOT EXISTS public.stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  address TEXT NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  phone TEXT,
  email TEXT,
  logo_url TEXT,
  banner_url TEXT,
  status store_status NOT NULL DEFAULT 'pending',
  is_open BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Store work hours table
CREATE TABLE IF NOT EXISTS public.store_work_hours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  open_time TIME,
  close_time TIME,
  is_closed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(store_id, day_of_week)
);

-- Store settings table
CREATE TABLE IF NOT EXISTS public.store_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE UNIQUE,
  auto_accept_orders BOOLEAN DEFAULT false,
  min_order_amount DECIMAL(10, 2) DEFAULT 0,
  delivery_fee DECIMAL(10, 2) DEFAULT 0,
  estimated_preparation_time INTEGER DEFAULT 30, -- in minutes
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products table
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
  image_url TEXT,
  stock INTEGER DEFAULT 0 CHECK (stock >= 0),
  is_available BOOLEAN DEFAULT true,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Orders table
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  total_price DECIMAL(10, 2) NOT NULL CHECK (total_price >= 0),
  delivery_fee DECIMAL(10, 2) DEFAULT 0 CHECK (delivery_fee >= 0),
  final_total DECIMAL(10, 2) NOT NULL CHECK (final_total >= 0),
  status order_status NOT NULL DEFAULT 'pending',
  delivery_address TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Order items table
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
  subtotal DECIMAL(10, 2) NOT NULL CHECK (subtotal >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_stores_user_id ON public.stores(user_id);
CREATE INDEX IF NOT EXISTS idx_stores_status ON public.stores(status);
CREATE INDEX IF NOT EXISTS idx_products_store_id ON public.products(store_id);
CREATE INDEX IF NOT EXISTS idx_products_available ON public.products(is_available);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_store_id ON public.orders(store_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);

-- Functions for updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stores_updated_at BEFORE UPDATE ON public.stores
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_work_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view their own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all users"
  ON public.users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Stores policies
CREATE POLICY "Anyone can view approved stores"
  ON public.stores FOR SELECT
  USING (status = 'approved');

CREATE POLICY "Store owners can view their own store"
  ON public.stores FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Store owners can update their own store"
  ON public.stores FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Store owners can insert their own store"
  ON public.stores FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all stores"
  ON public.stores FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update store status"
  ON public.stores FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Store work hours policies
CREATE POLICY "Anyone can view work hours of approved stores"
  ON public.store_work_hours FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.stores
      WHERE id = store_work_hours.store_id AND status = 'approved'
    )
  );

CREATE POLICY "Store owners can manage their work hours"
  ON public.store_work_hours FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.stores
      WHERE id = store_work_hours.store_id AND user_id = auth.uid()
    )
  );

-- Store settings policies
CREATE POLICY "Store owners can manage their settings"
  ON public.store_settings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.stores
      WHERE id = store_settings.store_id AND user_id = auth.uid()
    )
  );

-- Products policies
CREATE POLICY "Anyone can view available products from approved stores"
  ON public.products FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.stores
      WHERE id = products.store_id AND status = 'approved'
    )
    AND is_available = true
  );

CREATE POLICY "Store owners can view all their products"
  ON public.products FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.stores
      WHERE id = products.store_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Store owners can manage their products"
  ON public.products FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.stores
      WHERE id = products.store_id AND user_id = auth.uid()
    )
  );

-- Orders policies
CREATE POLICY "Users can view their own orders"
  ON public.orders FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create their own orders"
  ON public.orders FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Store owners can view orders for their store"
  ON public.orders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.stores
      WHERE id = orders.store_id AND user_id = auth.uid()
    )
  );

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

CREATE POLICY "Admins can view all orders"
  ON public.orders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Order items policies
CREATE POLICY "Users can view items of their own orders"
  ON public.order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE id = order_items.order_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Store owners can view items of orders for their store"
  ON public.order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      JOIN public.stores ON stores.id = orders.store_id
      WHERE orders.id = order_items.order_id AND stores.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create order items for their orders"
  ON public.order_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE id = order_items.order_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all order items"
  ON public.order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

