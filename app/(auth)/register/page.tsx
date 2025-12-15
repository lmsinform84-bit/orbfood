'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    phone: '',
  });
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Registrasi hanya untuk user biasa (pelanggan)
      // Untuk buka toko, user harus login dulu lalu buka form di dashboard
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email.trim(),
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?type=email`,
          data: {
            full_name: formData.fullName,
            phone: formData.phone || null,
            role: 'user', // Selalu 'user' untuk registrasi
          },
        },
      });

      if (authError) {
        console.error('❌ Registration error:', authError);
        throw authError;
      }
      
      if (!authData.user) throw new Error('Gagal membuat akun');

      // Update user metadata (jika perlu)
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          full_name: formData.fullName,
          phone: formData.phone || null,
          role: 'user', // Selalu 'user' untuk registrasi
        }
      });

      // Tunggu sebentar untuk trigger selesai membuat user profile
      // Trigger akan membaca role dari user_metadata
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Verify dan update user profile jika perlu
      // Trigger sudah membuat dengan role dari metadata, tapi kita update untuk memastikan
      const { error: roleError } = await supabase
        .from('users')
        .update({
          full_name: formData.fullName,
          phone: formData.phone || null,
          role: 'user', // Selalu 'user' untuk registrasi
        })
        .eq('id', authData.user.id);

      if (roleError) {
        // Jika user belum ada, trigger mungkin belum jalan, coba insert manual
        if (roleError.code === 'PGRST116') {
          const { error: insertError } = await supabase
            .from('users')
            .insert({
              id: authData.user.id,
              email: formData.email.trim(),
              full_name: formData.fullName,
              phone: formData.phone || null,
              role: 'user',
            });
          
          if (insertError) {
            console.warn('⚠️ Error inserting user profile:', insertError);
          }
        } else {
          console.warn('⚠️ Error updating role:', roleError);
        }
      }

      // Check if email confirmation is required
      if (authData.user && !authData.session) {
        toast({
          title: 'Registrasi berhasil',
          description: 'Silakan cek email Anda untuk konfirmasi akun sebelum login.',
        });
      } else {
      toast({
        title: 'Registrasi berhasil',
        description: 'Silakan login untuk melanjutkan',
      });
      }

      router.push('/login');
    } catch (error: any) {
      toast({
        title: 'Registrasi gagal',
        description: error.message || 'Terjadi kesalahan saat registrasi',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Daftar</CardTitle>
          <CardDescription className="text-center">
            Daftar sebagai pelanggan. Setelah login, Anda bisa buka toko sendiri!
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleRegister}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Nama Lengkap</Label>
              <Input
                id="fullName"
                placeholder="Nama Lengkap"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="nama@email.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">No. Telepon (Opsional)</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="081234567890"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                minLength={6}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Memproses...' : 'Daftar'}
            </Button>
            <div className="text-sm text-center text-muted-foreground">
              Sudah punya akun?{' '}
              <Link href="/login" className="text-primary hover:underline">
                Login di sini
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

