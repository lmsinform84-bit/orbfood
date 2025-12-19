-- Add is_featured column to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_products_is_featured ON public.products(is_featured);

-- Add comment
COMMENT ON COLUMN public.products.is_featured IS 'Menandai menu unggulan yang akan ditampilkan di bagian atas halaman toko';

