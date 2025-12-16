-- Add area_id column to stores table for filtering by area/wilayah
-- This allows stores to be associated with specific areas for customer filtering

-- First, check if areas table exists, if not create it
CREATE TABLE IF NOT EXISTS public.areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add area_id column to stores table
ALTER TABLE public.stores 
ADD COLUMN IF NOT EXISTS area_id UUID REFERENCES public.areas(id) ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_stores_area_id ON public.stores(area_id);

-- Add comment
COMMENT ON COLUMN public.stores.area_id IS 'Area/wilayah where the store is located for customer filtering';


