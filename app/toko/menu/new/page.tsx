'use client';

import { useState } from 'react';
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

export default function NewProductPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock: '0',
    is_available: true,
    category: '',
  });
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // Compress image before preview
      const compressed = await compressImage(file, 600);
      setImage(compressed);

      // Create preview
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
      // Get user's store
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: store } = await supabase
        .from('stores')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!store) throw new Error('Store not found');

      let imageUrl: string | null = null;

      // Upload image if provided
      if (image) {
        const fileExt = image.name.split('.').pop()?.toLowerCase() || 'jpg';
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        // Path format: products/{store_id}/{filename}
        const filePath = `products/${store.id}/${fileName}`;

        console.log('📤 Uploading image to:', filePath);

        // Upload with proper options
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(filePath, image, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) {
          console.error('❌ Upload error:', uploadError);
          // Check if it's a duplicate file error
          if (uploadError.message?.includes('already exists')) {
            // Try with different filename
            const retryFileName = `${Date.now()}-${Math.random().toString(36).substring(7)}-retry.${fileExt}`;
            const retryPath = `products/${store.id}/${retryFileName}`;
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
          console.log('✅ Image uploaded successfully:', imageUrl);
        }
      }

      // Create product
      const { error } = await supabase.from('products').insert({
        store_id: store.id,
        name: formData.name,
        description: formData.description || null,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock),
        is_available: formData.is_available,
        category: formData.category || null,
        image_url: imageUrl,
      });

      if (error) throw error;

      toast({
        title: 'Menu berhasil ditambahkan',
        description: 'Menu baru telah ditambahkan ke toko Anda',
      });

      router.push('/toko/menu');
    } catch (error: any) {
      toast({
        title: 'Gagal menambahkan menu',
        description: error.message || 'Terjadi kesalahan',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Tambah Menu Baru</h1>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Informasi Menu</CardTitle>
            <CardDescription>Isi informasi menu yang akan ditambahkan</CardDescription>
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
                placeholder="Contoh: Makanan, Minuman, Snack"
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
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="object-cover w-full h-full"
                  />
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
            {loading ? 'Menyimpan...' : 'Simpan Menu'}
          </Button>
        </div>
      </form>
    </div>
  );
}

