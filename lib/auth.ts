import { createClient } from './supabase/server';
import { UserRole } from '@/types/database';

export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user: authUser },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !authUser) return null;

  // Query menggunakan regular client
  // RLS policy "Users can view their own profile" akan allow user read data mereka sendiri
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('id', authUser.id)
    .single();

  // Handle infinite recursion error
  if (userError && (userError.code === '42P17' || userError.message?.includes('infinite recursion'))) {
    console.error('❌ Infinite recursion detected in RLS policy');
    console.error('❌ Please ensure migration 20251215000008 has been applied');
    return null;
  }

  // Jika user tidak ditemukan, return null (bukan throw error)
  if (userError || !user) return null;

  return user;
}

export async function getCurrentUserRole(): Promise<UserRole | null> {
  const user = await getCurrentUser();
  return user?.role || null;
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Unauthorized');
  }
  return user;
}

export async function requireRole(role: UserRole | UserRole[]) {
  const user = await requireAuth();
  const roles = Array.isArray(role) ? role : [role];
  if (!roles.includes(user.role)) {
    throw new Error('Forbidden');
  }
  return user;
}

