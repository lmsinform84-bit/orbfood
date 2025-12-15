# Setup Storage Bucket untuk Product Images

## Masalah
Error "Bucket not found" saat upload gambar produk.

## Solusi

### 1. Buat Bucket via Supabase Dashboard

1. Login ke [Supabase Dashboard](https://app.supabase.com)
2. Pilih project Anda
3. Buka menu **Storage** di sidebar kiri
4. Klik tombol **"New bucket"** atau **"Create bucket"**
5. Isi form:
   - **Name**: `product-images`
   - **Public bucket**: ✅ **YES** (penting untuk public read access)
   - **File size limit**: `5242880` (5MB) atau sesuai kebutuhan
   - **Allowed MIME types**: `image/*` atau kosongkan untuk semua jenis gambar
6. Klik **"Create bucket"**

### 2. Jalankan Migration SQL

Setelah bucket dibuat, jalankan migration untuk setup RLS policies:

```bash
npx supabase db push
```

Atau jalankan SQL secara manual di Supabase SQL Editor:

File: `supabase/migrations/20251215000010_setup_storage_bucket.sql`

### 3. Verifikasi Setup

Setelah migration dijalankan, verifikasi:

1. **Bucket exists**: 
   - Cek di Storage dashboard bahwa bucket `product-images` ada
   - Status harus "Public"

2. **RLS Policies**:
   - Buka SQL Editor
   - Jalankan query:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';
   ```
   - Harus ada 5 policies:
     - Public can view product images
     - Toko can upload product images
     - Toko can update own product images
     - Toko can delete own product images
     - Admin can manage all product images

3. **Test Upload**:
   - Coba upload gambar dari aplikasi
   - Cek console untuk error
   - Cek Storage dashboard untuk file yang terupload

## Troubleshooting

### Error: "Bucket not found"
- Pastikan bucket `product-images` sudah dibuat di dashboard
- Pastikan nama bucket **exact match** (case-sensitive)
- Refresh browser setelah membuat bucket

### Error: "new row violates row-level security policy"
- Pastikan migration SQL sudah dijalankan
- Pastikan user yang login memiliki role 'toko'
- Pastikan user memiliki store yang terkait
- Cek RLS policies di SQL Editor

### Error: "permission denied for schema storage"
- Pastikan migration SQL sudah dijalankan (ada GRANT statements)
- Cek permissions dengan query:
  ```sql
  SELECT * FROM information_schema.role_table_grants 
  WHERE table_schema = 'storage';
  ```

### File tidak muncul setelah upload
- Cek Storage dashboard untuk file
- Pastikan bucket adalah public
- Cek URL yang dihasilkan dari `getPublicUrl()`

## Struktur Path

Path file di storage mengikuti format:
```
products/{store_id}/{filename}
```

Contoh:
```
products/b711d2a5-6ea9-46c0-8c43-f1008b03af51/1765835462138-txbiz.jpeg
```

## Security Notes

1. **Public Read**: Bucket dibuat public agar gambar bisa diakses tanpa authentication
2. **Upload Restriction**: Hanya user dengan role 'toko' yang bisa upload
3. **Path Validation**: Upload hanya diizinkan ke folder store_id milik user
4. **Admin Access**: Admin bisa manage semua gambar

## Manual SQL (Jika Migration Gagal)

Jika migration tidak berjalan, jalankan SQL ini secara manual:

```sql
-- Enable RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Public read
CREATE POLICY "Public can view product images"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'product-images');

-- Toko upload
CREATE POLICY "Toko can upload product images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'product-images' AND
  EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'toko')
);

-- Grants
GRANT USAGE ON SCHEMA storage TO authenticated, anon;
GRANT SELECT ON storage.objects TO public;
GRANT INSERT, UPDATE, DELETE ON storage.objects TO authenticated;
GRANT SELECT ON storage.buckets TO public;
```
