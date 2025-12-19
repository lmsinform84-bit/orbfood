-- Create regions table for Kecamatan and Desa/Kelurahan
CREATE TABLE IF NOT EXISTS public.regions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('kecamatan', 'desa', 'kelurahan')),
  parent_id UUID REFERENCES public.regions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_regions_type ON public.regions(type);
CREATE INDEX IF NOT EXISTS idx_regions_parent_id ON public.regions(parent_id);

-- Add region_id to stores table
ALTER TABLE public.stores 
ADD COLUMN IF NOT EXISTS region_id UUID REFERENCES public.regions(id) ON DELETE SET NULL;

-- Add index for region_id
CREATE INDEX IF NOT EXISTS idx_stores_region_id ON public.stores(region_id);

-- Enable RLS
ALTER TABLE public.regions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for regions
-- Everyone can read regions (for dropdowns)
CREATE POLICY "Anyone can read regions" ON public.regions
  FOR SELECT
  USING (true);

-- Only admins can insert/update/delete regions
CREATE POLICY "Admin can manage regions" ON public.regions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Add comment
COMMENT ON TABLE public.regions IS 'Tabel untuk menyimpan data wilayah operasional (Kecamatan dan Desa/Kelurahan)';
COMMENT ON COLUMN public.regions.type IS 'Jenis wilayah: kecamatan, desa, atau kelurahan';
COMMENT ON COLUMN public.regions.parent_id IS 'ID parent region (desa/kelurahan memiliki parent kecamatan)';
COMMENT ON COLUMN public.stores.region_id IS 'ID wilayah operasional toko (desa/kelurahan)';

