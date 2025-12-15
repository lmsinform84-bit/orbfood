import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin-server';
import { createClient } from '@/lib/supabase/server';

/**
 * API Route untuk update role user
 * Hanya admin yang bisa akses
 */
export async function POST(request: NextRequest) {
  try {
    // Check if current user is admin
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Anda harus login terlebih dahulu' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || userProfile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Hanya admin yang bisa update role user' },
        { status: 403 }
      );
    }

    // Get request body
    const body = await request.json();
    const { userId, role } = body;

    if (!userId || !role) {
      return NextResponse.json(
        { error: 'userId dan role harus diisi' },
        { status: 400 }
      );
    }

    // Valid role values
    const validRoles = ['user', 'toko', 'admin'];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Role tidak valid' },
        { status: 400 }
      );
    }

    // Use admin client untuk bypass RLS
    const adminClient = createAdminClient();

    // Check if service role key is set
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('❌ SUPABASE_SERVICE_ROLE_KEY tidak di-set!');
      return NextResponse.json(
        { error: 'Service role key tidak di-set. Tidak bisa update role.' },
        { status: 500 }
      );
    }

    // Update user role
    const { data: updatedUser, error: updateError } = await adminClient
      .from('users')
      .update({ role })
      .eq('id', userId)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Error updating user role:', updateError);
      return NextResponse.json(
        { error: updateError.message || 'Gagal update role user' },
        { status: 500 }
      );
    }

    console.log('✅ User role updated successfully:', {
      id: updatedUser.id,
      email: updatedUser.email,
      newRole: updatedUser.role,
    });

    return NextResponse.json({
      success: true,
      message: `Role user berhasil diupdate menjadi ${role}`,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        role: updatedUser.role,
      },
    });
  } catch (error: any) {
    console.error('❌ Unexpected error:', error);
    return NextResponse.json(
      { error: error.message || 'Terjadi kesalahan saat update role user' },
      { status: 500 }
    );
  }
}
