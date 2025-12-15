'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { compressImage } from '@/lib/utils/image';
import { Product } from '@/types/database';
import { getImageUrl } from '@/lib/utils/image';

interface EditProductFormProps {
  product: Product;
}

export function EditProductForm({ product }: EditProductFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: product.name,
    description: product.description || '',
    price: product.price.toString(),
    stock: product.stock.toString(),
    is_available: product.is_available,
    category: product.category || '',
  });
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(
    product.image_url ? getImageUrl(product.image_url, 'medium') : null
  );

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressed = await compressImage(file, 600);
      setImage(compressed);

      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(compressed);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Gagal memproses gambar',
        variant: 'destructive',
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let imageUrl = product.image_url;

      // Upload new image if provided
      if (image) {
        // Delete old image if exists
        if (product.image_url) {
          try {
            const url = new URL(product.image_url);
            const pathParts = url.pathname.split('/');
            const bucketIndex = pathParts.findIndex(part => part === 'product-images');
            if (bucketIndex !== -1 && bucketIndex < pathParts.length - 1) {
              const oldFilePath = pathParts.slice(bucketIndex + 1).join('/');
              await supabase.storage
                .from('product-images')
                .remove([oldFilePath]);
            }
          } catch (oldImageError) {
            console.warn('Failed to delete old image:', oldImageError);
            // Continue with new image upload
          }
        }

        // Upload new image
        const fileExt = image.name.split('.').pop()?.toLowerCase() || 'jpg';
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        // Path format: products/{store_id}/{filename}
        const filePath = `products/${product.store_id}/${fileName}`;

        console.log('📤 Uploading new image to:', filePath);

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(filePath, image, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) {
          console.error('❌ Upload error:', uploadError);
          if (uploadError.message?.includes('already exists')) {
            // Try with different filename
            const retryFileName = `${Date.now()}-${Math.random().toString(36).substring(7)}-retry.${fileExt}`;
            const retryPath = `products/${product.store_id}/${retryFileName}`;
            const { error: retryError } = await supabase.storage
              .from('product-images')
              .upload(retryPath, image, { cacheControl: '3600', upsert: false });
            
            if (retryError) {
              throw new Error(`Gagal upload gambar: ${retryError.message}`);
            }
            
            const { data: retryUrlData } = supabase.storage
              .from('product-images')
              .getPublicUrl(retryPath);
            imageUrl = retryUrlData?.publicUrl || null;
          } else {
            throw new Error(`Gagal upload gambar: ${uploadError.message}`);
          }
        } else {
          const { data: urlData } = supabase.storage
            .from('product-images')
            .getPublicUrl(filePath);
          
          if (!urlData?.publicUrl) {
            throw new Error('Gagal mendapatkan URL gambar');
          }
          
          imageUrl = urlData.publicUrl;
          console.log('✅ New image uploaded successfully:', imageUrl);
        }
      }

      const updateData: any = {
        name: formData.name,
        description: formData.description || null,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock),
        is_available: formData.is_available,
        category: formData.category || null,
        updated_at: new Date().toISOString(),
      };

      // Only update image_url if a new image was uploaded
      if (imageUrl !== product.image_url) {
        updateData.image_url = imageUrl;
      }

      const { error, data } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', product.id)
        .select();

      if (error) {
        console.error('Update error:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        throw new Error('Produk tidak ditemukan atau tidak dapat diupdate');
      }

      toast({
        title: 'Menu berhasil diperbarui',
        description: 'Perubahan telah disimpan',
      });

      router.push('/toko/menu');
    } catch (error: any) {
      toast({
        title: 'Gagal memperbarui menu',
        description: error.message || 'Terjadi kesalahan',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Informasi Menu</CardTitle>
          <CardDescription>Edit informasi menu</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nama Menu *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Deskripsi</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Harga (Rp) *</Label>
              <Input
                id="price"
                type="number"
                min="0"
                step="100"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="stock">Stok *</Label>
              <Input
                id="stock"
                type="number"
                min="0"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Kategori</Label>
            <Input
              id="category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="image">Foto Menu</Label>
            <Input
              id="image"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
            />
            {imagePreview && (
              <div className="relative h-48 w-full rounded-lg overflow-hidden">
                <img src={imagePreview} alt="Preview" className="object-cover w-full h-full" />
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_available"
              checked={formData.is_available}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, is_available: checked })
              }
            />
            <Label htmlFor="is_available">Tersedia untuk dijual</Label>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-4 mt-6">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Batal
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
        </Button>
      </div>
    </form>
  );
}

