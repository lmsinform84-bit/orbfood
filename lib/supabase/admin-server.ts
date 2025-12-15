import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from './server';

/**
 * Admin server client untuk server-side operations
 * Menggunakan service role key untuk bypass RLS
 * Hanya digunakan di server-side, tidak pernah di client!
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Jika service role key tidak ada, fallback ke anon key (untuk development)
const key = supabaseServiceRoleKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export function createAdminClient() {
  // Validasi service role key
  if (!supabaseServiceRoleKey) {
    console.error('⚠️ WARNING: SUPABASE_SERVICE_ROLE_KEY tidak di-set!');
    console.error('⚠️ Admin operations mungkin gagal karena RLS restrictions.');
    console.error('⚠️ Pastikan SUPABASE_SERVICE_ROLE_KEY sudah di-set di .env.local');
    console.error('⚠️ Dapatkan dari: Supabase Dashboard → Settings → API → service_role key');
  } else {
    console.log('✅ Service Role Key is set, length:', supabaseServiceRoleKey.length);
  }
  
  // Admin client dengan service role key (bypass RLS)
  const client = createClient(supabaseUrl, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
  
  return client;
}

// Helper untuk check jika user adalah admin
export async function isUserAdmin(userId: string): Promise<boolean> {
  if (!supabaseServiceRoleKey) {
    // Jika tidak ada service role, check via regular query
    // (akan menggunakan RLS policy user bisa read role mereka sendiri)
    const supabase = await createServerClient();
    const { data } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();
    
    return data?.role === 'admin';
  }

  // Jika ada service role, gunakan admin client (bypass RLS)
  const adminClient = createAdminClient();
  const { data } = await adminClient
    .from('users')
    .select('role')
    .eq('id', userId)
    .single();
  
  return data?.role === 'admin';
}

