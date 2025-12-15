'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Check for error or message from URL params (from email confirmation)
  useEffect(() => {
    const error = searchParams.get('error');
    const message = searchParams.get('message');
    
    if (error) {
      toast({
        title: 'Error',
        description: decodeURIComponent(error),
        variant: 'destructive',
      });
    } else if (message) {
      toast({
        title: 'Berhasil',
        description: decodeURIComponent(message),
      });
    }
  }, [searchParams, toast]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('🔐 Attempting login...', { email: email.trim() });
      
      // Validate inputs
      if (!email.trim() || !password) {
        throw new Error('Email dan password harus diisi');
      }
      
      // Step 1: Sign in dengan Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (authError) {
        console.error('❌ Auth error:', {
          message: authError.message,
          status: authError.status,
          name: authError.name,
        });
        throw authError;
      }

      if (!authData.user) {
        throw new Error('User tidak ditemukan setelah login');
      }

      console.log('✅ Auth successful, user ID:', authData.user.id);

      // Step 2: Pastikan user profile ada (retry mechanism)
      let user = null;
      let retryCount = 0;
      const maxRetries = 5;
      const retryDelay = 500;

      while (!user && retryCount < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        
        console.log(`🔄 Fetching user profile (attempt ${retryCount + 1}/${maxRetries})...`);
        
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('role')
          .eq('id', authData.user.id)
          .single();
        
        if (userError) {
          console.warn(`⚠️ Error fetching user (attempt ${retryCount + 1}):`, userError);

          // Jika user belum ada, coba lagi
          if (userError.code === 'PGRST116') {
            retryCount++;
            continue;
          }
          
          // Handle infinite recursion error
          if (userError.code === '42P17' || userError.message?.includes('infinite recursion')) {
            console.error('❌ Infinite recursion detected in RLS policy');
            console.error('❌ This should be fixed by migration 20251215000008');
            throw new Error('Terjadi error sistem. Silakan hubungi admin atau coba lagi nanti.');
          }
        
          // Error lain, throw
          throw new Error(`Gagal mengambil data user: ${userError.message}`);
        }
        
        if (userData) {
          user = userData;
          console.log('✅ User profile found, role:', user.role);
          break;
        }

        retryCount++;
      }

      if (!user) {
        console.error('❌ User profile tidak ditemukan setelah beberapa kali retry');
        throw new Error('User profile belum tersedia. Silakan coba lagi atau hubungi admin.');
      }

      // Step 3: Show success toast
      toast({
        title: 'Login berhasil',
        description: 'Selamat datang kembali!',
      });

      // Step 4: Verify session is available
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.warn('⚠️ Session not immediately available, waiting...');
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Step 5: Redirect berdasarkan role
      const redirectPath = 
        user.role === 'admin' ? '/admin/dashboard' :
        user.role === 'toko' ? '/toko/dashboard' :
        '/user/home';

      console.log(`🚀 Redirecting to: ${redirectPath}`);
      console.log(`📋 Session available:`, session ? 'Yes' : 'No');

      // Use window.location for reliable redirect (forces full page reload)
      // This ensures middleware can read the cookies after they're set
      // The createBrowserClient from @supabase/ssr ensures cookies are properly set
      window.location.href = redirectPath;
      
    } catch (error: any) {
      console.error('❌ Login error:', {
        error,
        message: error?.message,
        status: error?.status,
        name: error?.name,
      });
      
      // Handle specific error messages
      let errorMessage = 'Terjadi kesalahan saat login';
      
      if (error?.message?.includes('Invalid login credentials') || 
          error?.message?.includes('Invalid credentials') ||
          error?.status === 400) {
        errorMessage = 'Email atau password salah. Pastikan:\n' +
          '• Email sudah terdaftar\n' +
          '• Password benar\n' +
          '• Jika baru mendaftar, pastikan email sudah dikonfirmasi';
      } else if (error?.message?.includes('Email not confirmed') ||
                 error?.message?.includes('email_not_confirmed')) {
        errorMessage = 'Email belum dikonfirmasi. Silakan cek email Anda dan klik link konfirmasi.';
      } else if (error?.message?.includes('User not found')) {
        errorMessage = 'Email tidak terdaftar. Silakan daftar terlebih dahulu.';
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: 'Login gagal',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?type=oauth`,
        },
      });

      if (error) {
        console.error('❌ Google OAuth error:', error);
        toast({
          title: 'Login dengan Google gagal',
          description: error.message || 'Terjadi kesalahan saat login dengan Google',
          variant: 'destructive',
        });
        setGoogleLoading(false);
      }
      // Jika berhasil, user akan di-redirect ke Google, lalu kembali ke callback
      // Tidak perlu set loading false karena akan redirect
    } catch (error: any) {
      console.error('❌ Google login error:', error);
      toast({
        title: 'Login dengan Google gagal',
        description: error.message || 'Terjadi kesalahan saat login dengan Google',
        variant: 'destructive',
      });
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Login</CardTitle>
          <CardDescription className="text-center">
            Masuk ke akun Anda untuk melanjutkan
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="nama@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={loading || googleLoading}>
              {loading ? 'Memproses...' : 'Login'}
            </Button>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Atau
                </span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleGoogleLogin}
              disabled={loading || googleLoading}
            >
              {googleLoading ? (
                'Memproses...'
              ) : (
                <>
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  Login dengan Google
                </>
              )}
            </Button>

            <div className="text-sm text-center text-muted-foreground space-y-2">
              <div>
              Belum punya akun?{' '}
              <Link href="/register" className="text-primary hover:underline">
                Daftar di sini
              </Link>
              </div>
              <div className="text-xs text-muted-foreground/70 space-y-1">
                <div>Atau buat user baru di Supabase Dashboard &gt; Authentication &gt; Users</div>
                <div className="mt-2 p-2 bg-muted rounded text-left">
                  <div className="font-semibold mb-1">Troubleshooting:</div>
                  <ul className="list-disc list-inside space-y-0.5 text-xs">
                    <li>Pastikan email sudah terdaftar</li>
                    <li>Jika baru mendaftar, cek email untuk konfirmasi</li>
                    <li>Pastikan password benar (case-sensitive)</li>
                    <li>Untuk development, disable email confirmation di Supabase</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p>Loading...</p>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}

