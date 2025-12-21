-- Migration: Fix period logic - Period baru dibuka SETIAP invoice periode sebelumnya dilunasi
-- Periode ditutup saat invoice dilunasi dan dikonfirmasi pembayaran oleh admin
-- BUKAN berdasarkan durasi waktu (7 hari)

-- Hapus function check_and_close_expired_periods karena tidak diperlukan lagi
-- Periode hanya ditutup saat invoice lunas, bukan berdasarkan waktu
DROP FUNCTION IF EXISTS public.check_and_close_expired_periods();

-- Update function close_period_and_create_new untuk memastikan logika benar
-- Periode ditutup saat invoice lunas, periode baru dibuat untuk invoice berikutnya
CREATE OR REPLACE FUNCTION close_period_and_create_new(store_uuid UUID, period_uuid UUID)
RETURNS UUID AS $$
DECLARE
  v_new_period_id UUID;
  v_period_exists BOOLEAN;
BEGIN
  -- Verifikasi periode ada dan milik store yang benar
  SELECT EXISTS(
    SELECT 1 FROM public.store_periods
    WHERE id = period_uuid AND store_id = store_uuid
  ) INTO v_period_exists;

  IF NOT v_period_exists THEN
    RAISE EXCEPTION 'Period not found or does not belong to store';
  END IF;

  -- Tutup periode saat ini (set is_active = false, end_date = NOW())
  UPDATE public.store_periods
  SET is_active = false, end_date = NOW(), updated_at = NOW()
  WHERE id = period_uuid AND store_id = store_uuid;

  -- Buat periode baru untuk invoice berikutnya
  -- Invoice baru akan dibuat otomatis saat order pertama selesai di periode baru
  INSERT INTO public.store_periods (store_id, start_date, is_active)
  VALUES (store_uuid, NOW(), true)
  RETURNING id INTO v_new_period_id;

  RETURN v_new_period_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- Data migration: Perbaiki data yang sudah ada
-- Jika ada invoice dengan status 'lunas' tapi periodenya masih aktif, tutup periodenya
-- Dan buat periode baru untuk toko tersebut
DO $$
DECLARE
  v_invoice RECORD;
  v_new_period_id UUID;
BEGIN
  -- Cari invoice dengan status 'lunas' yang periodenya masih aktif
  FOR v_invoice IN
    SELECT DISTINCT i.store_id, i.period_id
    FROM public.invoices i
    JOIN public.store_periods sp ON sp.id = i.period_id
    WHERE i.status = 'lunas'
      AND sp.is_active = true
  LOOP
    -- Tutup periode lama
    UPDATE public.store_periods
    SET is_active = false, end_date = COALESCE(end_date, NOW()), updated_at = NOW()
    WHERE id = v_invoice.period_id AND store_id = v_invoice.store_id;

    -- Cek apakah sudah ada periode aktif baru untuk toko ini
    -- Jika belum ada, buat periode baru
    SELECT id INTO v_new_period_id
    FROM public.store_periods
    WHERE store_id = v_invoice.store_id AND is_active = true
    LIMIT 1;

    IF v_new_period_id IS NULL THEN
      INSERT INTO public.store_periods (store_id, start_date, is_active)
      VALUES (v_invoice.store_id, NOW(), true)
      RETURNING id INTO v_new_period_id;
    END IF;

    RAISE NOTICE 'Fixed period for store %: closed period %, created new period %', 
      v_invoice.store_id, v_invoice.period_id, v_new_period_id;
  END LOOP;
END;
$$;

-- Update comment untuk clarify logika
COMMENT ON FUNCTION close_period_and_create_new(UUID, UUID) IS 
'Menutup periode saat invoice dilunasi dan membuat periode baru. Dipanggil saat admin mengkonfirmasi pembayaran invoice. Periode baru akan digunakan untuk invoice berikutnya saat order pertama selesai.';

