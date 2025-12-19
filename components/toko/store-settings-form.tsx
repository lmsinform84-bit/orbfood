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
import { Store, StoreSettings } from '@/types/database';
import { getImageUrl } from '@/lib/utils/image';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { QRISUpload } from './qris-upload';
import { AreaSelect } from '@/components/ui/area-select';

interface StoreSettingsFormProps {
  store: Store | null;
  settings: StoreSettings | null;
}

export function StoreSettingsForm({ store: initialStore, settings: initialSettings }: StoreSettingsFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [store, setStore] = useState(initialStore);
  const [settings, setSettings] = useState(initialSettings);

  const [storeForm, setStoreForm] = useState({
    name: store?.name || '',
    description: store?.description || '',
    address: store?.address || '',
    phone: store?.phone || '',
    email: store?.email || '',
    area_id: store?.area_id || '',
  });

  const [settingsForm, setSettingsForm] = useState({
    auto_accept_orders: settings?.auto_accept_orders || false,
    min_order_amount: settings?.min_order_amount?.toString() || '0',
    delivery_fee: settings?.delivery_fee?.toString() || '0',
    estimated_preparation_time: settings?.estimated_preparation_time?.toString() || '30',
  });

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(
    store?.logo_url ? getImageUrl(store.logo_url, 'medium') : null
  );
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(
    store?.banner_url ? getImageUrl(store.banner_url, 'medium') : null
  );

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressed = await compressImage(file, 300);
      setLogoFile(compressed);

      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
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

  const handleBannerChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressed = await compressImage(file, 600);
      setBannerFile(compressed);

      const reader = new FileReader();
      reader.onloadend = () => {
        setBannerPreview(reader.result as string);
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

  const handleStoreSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      let logoUrl = store?.logo_url;
      let bannerUrl = store?.banner_url;

      // Upload logo if provided
      if (logoFile) {
        const fileExt = logoFile.name.split('.').pop();
        const fileName = `logo_${Date.now()}.${fileExt}`;
        const filePath = `stores/${user.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('store-images')
          .upload(filePath, logoFile, { upsert: true });

        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from('store-images').getPublicUrl(filePath);
        logoUrl = data.publicUrl;
      }

      // Upload banner if provided
      if (bannerFile) {
        const fileExt = bannerFile.name.split('.').pop();
        const fileName = `banner_${Date.now()}.${fileExt}`;
        const filePath = `stores/${user.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('store-images')
          .upload(filePath, bannerFile, { upsert: true });

        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from('store-images').getPublicUrl(filePath);
        bannerUrl = data.publicUrl;
      }

      if (store) {
        // Update existing store
        const { error } = await supabase
          .from('stores')
          .update({
            name: storeForm.name,
            description: storeForm.description || null,
            address: storeForm.address,
            phone: storeForm.phone || null,
            email: storeForm.email || null,
            area_id: storeForm.area_id || null,
            logo_url: logoUrl,
            banner_url: bannerUrl,
          })
          .eq('id', store.id);

        if (error) throw error;
      } else {
        // Create new store
        const { data: newStore, error } = await supabase
          .from('stores')
          .insert({
            user_id: user.id,
            name: storeForm.name,
            description: storeForm.description || null,
            address: storeForm.address,
            phone: storeForm.phone || null,
            email: storeForm.email || null,
            area_id: storeForm.area_id || null,
            logo_url: logoUrl,
            banner_url: bannerUrl,
            status: 'pending',
          })
          .select()
          .single();

        if (error) throw error;
        setStore(newStore);

        // Create default settings
        const { data: newSettings } = await supabase
          .from('store_settings')
          .insert({
            store_id: newStore.id,
          })
          .select()
          .single();

        setSettings(newSettings);
      }

      toast({
        title: 'Profil toko berhasil disimpan',
        description: store ? 'Perubahan telah disimpan' : 'Profil toko telah dibuat',
      });

      router.refresh();
    } catch (error: any) {
      toast({
        title: 'Gagal menyimpan',
        description: error.message || 'Terjadi kesalahan',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!store) return;

    setLoading(true);

    try {
      if (settings) {
        // Update existing settings
        const { error } = await supabase
          .from('store_settings')
          .update({
            auto_accept_orders: settingsForm.auto_accept_orders,
            min_order_amount: parseFloat(settingsForm.min_order_amount),
            delivery_fee: parseFloat(settingsForm.delivery_fee),
            estimated_preparation_time: parseInt(settingsForm.estimated_preparation_time),
          })
          .eq('id', settings.id);

        if (error) throw error;
      } else {
        // Create new settings
        const { data: newSettings, error } = await supabase
          .from('store_settings')
          .insert({
            store_id: store.id,
            auto_accept_orders: settingsForm.auto_accept_orders,
            min_order_amount: parseFloat(settingsForm.min_order_amount),
            delivery_fee: parseFloat(settingsForm.delivery_fee),
            estimated_preparation_time: parseInt(settingsForm.estimated_preparation_time),
          })
          .select()
          .single();

        if (error) throw error;
        setSettings(newSettings);
      }

      toast({
        title: 'Pengaturan berhasil disimpan',
        description: 'Perubahan telah disimpan',
      });

      router.refresh();
    } catch (error: any) {
      toast({
        title: 'Gagal menyimpan',
        description: error.message || 'Terjadi kesalahan',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Tabs defaultValue="settings" className="space-y-4">
      <TabsList>
        <TabsTrigger value="settings">Pengaturan</TabsTrigger>
        <TabsTrigger value="profile">Profil Toko</TabsTrigger>
      </TabsList>

      <TabsContent value="settings">
        {store ? (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Pengaturan Toko</CardTitle>
                <CardDescription>Atur preferensi dan pengaturan toko</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSettingsSubmit} className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="auto_accept"
                      checked={settingsForm.auto_accept_orders}
                      onCheckedChange={(checked) =>
                        setSettingsForm({ ...settingsForm, auto_accept_orders: checked })
                      }
                    />
                    <Label htmlFor="auto_accept">Otomatis terima pesanan</Label>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="min_order">Minimum Pemesanan (Rp)</Label>
                    <Input
                      id="min_order"
                      type="number"
                      min="0"
                      step="1000"
                      value={settingsForm.min_order_amount}
                      onChange={(e) =>
                        setSettingsForm({ ...settingsForm, min_order_amount: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="delivery_fee">Ongkos Kirim (Rp)</Label>
                    <Input
                      id="delivery_fee"
                      type="number"
                      min="0"
                      step="1000"
                      value={settingsForm.delivery_fee}
                      onChange={(e) =>
                        setSettingsForm({ ...settingsForm, delivery_fee: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="prep_time">Estimasi Waktu Persiapan (menit)</Label>
                    <Input
                      id="prep_time"
                      type="number"
                      min="1"
                      value={settingsForm.estimated_preparation_time}
                      onChange={(e) =>
                        setSettingsForm({
                          ...settingsForm,
                          estimated_preparation_time: e.target.value,
                        })
                      }
                    />
                  </div>

                  <Button type="submit" disabled={loading}>
                    {loading ? 'Menyimpan...' : 'Simpan Pengaturan'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* QRIS Toko Section */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>QRIS Toko</CardTitle>
                <CardDescription>
                  Upload QRIS toko yang akan ditampilkan kepada pelanggan saat checkout
                </CardDescription>
              </CardHeader>
              <CardContent>
                <QRISUpload
                  storeId={store.id}
                  type="store"
                  currentQRIS={store.qris_url}
                  onUploadSuccess={() => {
                    router.refresh();
                  }}
                />
                <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    <strong>Catatan:</strong> QRIS ini akan ditampilkan kepada pelanggan saat checkout. 
                    Pastikan QRIS yang diupload adalah QRIS statis yang valid dan dapat menerima pembayaran.
                  </p>
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                Buat profil toko terlebih dahulu untuk mengakses pengaturan.
              </p>
            </CardContent>
          </Card>
        )}
      </TabsContent>

      <TabsContent value="profile">
        <Card>
          <CardHeader>
            <CardTitle>Informasi Toko</CardTitle>
            <CardDescription>
              {store ? 'Edit informasi toko Anda' : 'Buat profil toko Anda'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleStoreSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nama Toko *</Label>
                <Input
                  id="name"
                  value={storeForm.name}
                  onChange={(e) => setStoreForm({ ...storeForm, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Deskripsi</Label>
                <Textarea
                  id="description"
                  value={storeForm.description}
                  onChange={(e) => setStoreForm({ ...storeForm, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Alamat *</Label>
                <Textarea
                  id="address"
                  value={storeForm.address}
                  onChange={(e) => setStoreForm({ ...storeForm, address: e.target.value })}
                  required
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">No. Telepon</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={storeForm.phone}
                    onChange={(e) => setStoreForm({ ...storeForm, phone: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={storeForm.email}
                    onChange={(e) => setStoreForm({ ...storeForm, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <AreaSelect
                  value={storeForm.area_id}
                  onValueChange={(value) => setStoreForm({ ...storeForm, area_id: value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="logo">Logo Toko</Label>
                  <Input
                    id="logo"
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                  />
                  {logoPreview && (
                    <div className="relative h-32 w-32 rounded-lg overflow-hidden">
                      <img src={logoPreview} alt="Logo preview" className="object-cover w-full h-full" />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="banner">Banner Toko</Label>
                  <Input
                    id="banner"
                    type="file"
                    accept="image/*"
                    onChange={handleBannerChange}
                  />
                  {bannerPreview && (
                    <div className="relative h-32 w-full rounded-lg overflow-hidden">
                      <img src={bannerPreview} alt="Banner preview" className="object-cover w-full h-full" />
                    </div>
                  )}
                </div>
              </div>

              <Button type="submit" disabled={loading}>
                {loading ? 'Menyimpan...' : 'Simpan Profil'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}

