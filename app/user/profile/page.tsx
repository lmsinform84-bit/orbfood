'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { User, Phone, MapPin, Mail, LogOut, Save, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UserProfile {
  id: string;
  full_name: string | null;
  phone: string | null;
  address: string | null;
  email: string | null;
}

export default function ProfilePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    address: '',
  });

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          router.push('/login');
          return;
        }

        // Get user profile from users table
        const { data, error } = await supabase
          .from('users')
          .select('id, full_name, phone, address, email')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error loading profile:', error);
          toast({
            title: 'Gagal memuat profil',
            description: error.message,
            variant: 'destructive',
          });
          return;
        }

        setProfile(data);
        setFormData({
          full_name: data.full_name || '',
          phone: data.phone || '',
          address: data.address || '',
        });
      } catch (error: any) {
        console.error('Error:', error);
        toast({
          title: 'Error',
          description: error.message || 'Terjadi kesalahan saat memuat profil',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [router, toast]);

  const handleSave = async () => {
    if (!profile) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({
          full_name: formData.full_name || null,
          phone: formData.phone || null,
          address: formData.address || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id);

      if (error) {
        throw error;
      }

      toast({
        title: 'Profil berhasil diperbarui',
        description: 'Data profil Anda telah disimpan',
      });

      // Update local profile
      setProfile({
        ...profile,
        ...formData,
      });
    } catch (error: any) {
      toast({
        title: 'Gagal menyimpan profil',
        description: error.message || 'Terjadi kesalahan saat menyimpan profil',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: 'Logout gagal',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      router.push('/');
      router.refresh();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <User className="h-8 w-8 animate-pulse mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Memuat profil...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <AlertCircle className="h-16 w-16 text-destructive mb-4" />
        <h2 className="text-2xl font-bold mb-2">Profil Tidak Ditemukan</h2>
        <p className="text-muted-foreground mb-4">Gagal memuat profil pengguna.</p>
        <Button onClick={() => router.push('/user/home')}>
          Kembali ke Beranda
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Profil Saya</h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Informasi Pribadi
          </CardTitle>
          <CardDescription>
            Kelola informasi profil Anda
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Email (readonly) */}
          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={profile.email || ''}
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              Email tidak dapat diubah
            </p>
          </div>

          {/* Nama */}
          <div className="space-y-2">
            <Label htmlFor="full_name">Nama Lengkap</Label>
            <Input
              id="full_name"
              type="text"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              placeholder="Masukkan nama lengkap Anda"
            />
          </div>

          {/* Nomor HP */}
          <div className="space-y-2">
            <Label htmlFor="phone" className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Nomor HP
            </Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="081234567890"
            />
          </div>

          {/* Alamat Default */}
          <div className="space-y-2">
            <Label htmlFor="address" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Alamat Default
            </Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Masukkan alamat lengkap Anda"
              rows={4}
            />
            <p className="text-xs text-muted-foreground">
              Alamat ini akan digunakan sebagai alamat pengiriman default saat checkout
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="flex-1"
            >
              <Save className="mr-2 h-4 w-4" />
              {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Logout Section */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Akun</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Keluar dari akun Anda. Anda harus login kembali untuk mengakses aplikasi.
            </AlertDescription>
          </Alert>
          <Button
            variant="destructive"
            onClick={handleLogout}
            className="mt-4 w-full"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

