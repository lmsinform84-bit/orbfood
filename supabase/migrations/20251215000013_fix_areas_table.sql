-- Fix areas table - ensure it exists and has proper structure
-- This migration ensures the areas table is created even if previous migration failed

-- Create areas table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add area_id column to stores table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'stores' 
    AND column_name = 'area_id'
  ) THEN
    ALTER TABLE public.stores 
    ADD COLUMN area_id UUID REFERENCES public.areas(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create index if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_stores_area_id ON public.stores(area_id);

-- Add RLS policy for areas (allow all authenticated users to read)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'areas' 
    AND policyname = 'Allow authenticated users to read areas'
  ) THEN
    CREATE POLICY "Allow authenticated users to read areas"
      ON public.areas
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;

-- Add RLS policy for admin to manage areas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'areas' 
    AND policyname = 'Allow admin to manage areas'
  ) THEN
    CREATE POLICY "Allow admin to manage areas"
      ON public.areas
      FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.users
          WHERE users.id = auth.uid()
          AND users.role = 'admin'
        )
      );
  END IF;
END $$;

-- Enable RLS on areas table
ALTER TABLE public.areas ENABLE ROW LEVEL SECURITY;

-- Add comment
COMMENT ON COLUMN public.stores.area_id IS 'Area/wilayah where the store is located for customer filtering';
COMMENT ON TABLE public.areas IS 'Areas/wilayah for filtering stores and customers';

