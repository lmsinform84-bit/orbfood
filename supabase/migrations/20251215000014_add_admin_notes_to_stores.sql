-- Add admin_notes column to stores table for storing admin internal notes
-- This will be a JSONB column to store an array of notes

ALTER TABLE public.stores 
ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- Add comment
COMMENT ON COLUMN public.stores.admin_notes IS 'JSON array of admin internal notes. Format: [{"id": "string", "note": "string", "created_at": "ISO string", "created_by": "string"}]';

