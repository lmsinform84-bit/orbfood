'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Store, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { AreaSelect } from '@/components/ui/area-select';

export default function OpenStorePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    phone: '',
    email: '',
    area_id: '',
  });
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [hasStore, setHasStore] = useState(false);
  const [storeStatus, setStoreStatus] = useState<string | null>(null);

  // Check if user already has a store
  useEffect(() => {
    const checkStore = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/login');
          return;
        }

        const { data: store, error } = await supabase
          .from('stores')
          .select('id, name, status')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') {
          console.error('Error checking store:', error);
        }

        if (store) {
          setHasStore(true);
          setStoreStatus(store.status);
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setChecking(false);
      }
    };

    checkStore();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Anda harus login terlebih dahulu');
      }

      // Validasi
      if (!formData.name || !formData.address) {
        throw new Error('Nama toko dan alamat harus diisi');
      }
      if (!formData.area_id) {
        throw new Error('Wilayah operasional toko harus dipilih');
      }

      // Create store via API
      const response = await fetch('/api/stores/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description || null,
          address: formData.address,
          phone: formData.phone || null,
          email: formData.email || null,
          area_id: formData.area_id || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Gagal membuat toko');
      }

      toast({
        title: 'Pendaftaran toko berhasil',
        description: 'Toko Anda sedang menunggu persetujuan admin. Anda akan mendapat notifikasi setelah disetujui.',
      });

      router.push('/user/home');
    } catch (error: any) {
      toast({
        title: 'Gagal membuat toko',
        description: error.message || 'Terjadi kesalahan saat membuat toko',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p>Memuat...</p>
        </div>
      </div>
    );
  }

  if (hasStore) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">Toko Sudah Terdaftar</CardTitle>
            <CardDescription className="text-center">
              Anda sudah memiliki toko terdaftar
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium mb-2">Status Toko:</p>
              <p className="text-lg font-bold">
                {storeStatus === 'approved' ? (
                  <span className="text-green-600">✅ Disetujui</span>
                ) : storeStatus === 'pending' ? (
                  <span className="text-yellow-600">⏳ Menunggu Persetujuan</span>
                ) : (
                  <span className="text-red-600">❌ Ditolak</span>
                )}
              </p>
              {storeStatus === 'pending' && (
                <p className="text-sm text-muted-foreground mt-2">
                  Toko Anda sedang dalam proses review oleh admin. Anda akan mendapat notifikasi setelah disetujui.
                </p>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-2">
            <Button asChild className="w-full">
              <Link href="/user/home">Kembali ke Beranda</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Link href="/user/home" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali
          </Link>
          <h1 className="text-3xl font-bold mb-2">Buka Toko</h1>
          <p className="text-muted-foreground">
            Daftarkan toko Anda untuk mulai menjual makanan di ORBfood
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <Store className="h-5 w-5 text-primary" />
              <CardTitle>Form Pendaftaran Toko</CardTitle>
            </div>
            <CardDescription>
              Lengkapi informasi toko Anda. Toko akan muncul setelah disetujui admin.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nama Toko *</Label>
                <Input
                  id="name"
                  placeholder="Contoh: Warung Makan Sederhana"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Deskripsi Toko</Label>
                <Textarea
                  id="description"
                  placeholder="Ceritakan tentang toko Anda, menu spesial, dll..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Alamat Toko *</Label>
                <Textarea
                  id="address"
                  placeholder="Alamat lengkap toko Anda"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  required
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">No. Telepon</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="081234567890"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Toko</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="toko@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <AreaSelect
                  value={formData.area_id}
                  onValueChange={(value) => setFormData({ ...formData, area_id: value })}
                  required
                />
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong>Catatan:</strong> Setelah mengisi form, toko Anda akan berstatus "Menunggu Persetujuan". 
                  Admin akan meninjau dan menyetujui toko Anda. Setelah disetujui, toko akan muncul di daftar toko 
                  dan Anda bisa mulai mengelola menu.
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Mengirim...' : 'Daftarkan Toko'}
              </Button>
              <Button type="button" variant="outline" className="w-full" asChild>
                <Link href="/user/home">Batal</Link>
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
