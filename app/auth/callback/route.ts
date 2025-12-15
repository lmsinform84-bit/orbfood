import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { redirect } from 'next/navigation';

/**
 * Auth Callback Handler
 * Handle redirect setelah email confirmation atau OAuth login
 */
export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');
  const errorDescription = requestUrl.searchParams.get('error_description');

  // Handle error dari OAuth
  if (error) {
    console.error('❌ OAuth error:', error, errorDescription);
    return redirect(`/login?error=${encodeURIComponent(errorDescription || error)}`);
  }

  // Handle code dari email confirmation atau OAuth
  if (code) {
    const supabase = await createClient();
    
    // Exchange code untuk session
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      console.error('❌ Error exchanging code for session:', exchangeError);
      return redirect(`/login?error=${encodeURIComponent('Gagal memverifikasi email. Silakan coba lagi.')}`);
    }

    if (!data.user) {
      return redirect(`/login?error=${encodeURIComponent('User tidak ditemukan.')}`);
    }

    // Untuk OAuth (Google), user mungkin belum ada di public.users
    // Tunggu sebentar untuk trigger membuat user profile
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Get user profile untuk determine role (retry jika belum ada)
    let userProfile = null;
    let retryCount = 0;
    const maxRetries = 5;

    while (!userProfile && retryCount < maxRetries) {
      const { data: profileData, error: profileError } = await supabase
        .from('users')
        .select('role')
        .eq('id', data.user.id)
        .single();

      if (profileData) {
        userProfile = profileData;
        break;
      }

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('❌ Error fetching user profile:', profileError);
        break;
      }

      // Tunggu dan coba lagi
      await new Promise(resolve => setTimeout(resolve, 500));
      retryCount++;
    }

    // Jika user profile belum ada (misalnya trigger belum jalan atau OAuth user baru)
    if (!userProfile) {
      console.warn('⚠️ User profile not found after retries');
      
      // Untuk OAuth, mungkin user baru, redirect ke login dengan pesan
      const type = requestUrl.searchParams.get('type');
      if (type === 'oauth') {
        return redirect('/login?message=Login berhasil. Silakan lengkapi profil Anda.');
      }
      
      // Untuk email confirmation, redirect ke login
      return redirect('/login?message=Email berhasil dikonfirmasi. Silakan login untuk melanjutkan.');
    }

    // Redirect berdasarkan role
    const redirectPath = 
      userProfile.role === 'admin' ? '/admin/dashboard' :
      userProfile.role === 'toko' ? '/toko/dashboard' :
      '/user/home';

    // Redirect dengan session
    return redirect(redirectPath);
  }

  // Jika tidak ada code atau error, redirect ke login
  return redirect('/login');
}
