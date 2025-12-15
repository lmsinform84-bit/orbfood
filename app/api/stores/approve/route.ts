import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin-server';
import { createClient } from '@/lib/supabase/server';

/**
 * API Route untuk approve/reject store
 * Hanya admin yang bisa akses
 * Saat approve: update status store menjadi 'approved' dan role user menjadi 'toko'
 * Saat reject: update status store menjadi 'rejected'
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
        { error: 'Hanya admin yang bisa approve/reject store' },
        { status: 403 }
      );
    }

    // Get request body
    const body = await request.json();
    const { storeId, action } = body; // action: 'approve' or 'reject'

    if (!storeId || !action) {
      return NextResponse.json(
        { error: 'storeId dan action harus diisi' },
        { status: 400 }
      );
    }

    if (action !== 'approve' && action !== 'reject') {
      return NextResponse.json(
        { error: 'Action harus approve atau reject' },
        { status: 400 }
      );
    }

    // Use admin client untuk bypass RLS
    const adminClient = createAdminClient();
    
    // Log untuk debugging
    const hasServiceRoleKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
    console.log('🔑 Using admin client with service role key:', hasServiceRoleKey);
    if (!hasServiceRoleKey) {
      console.error('❌ CRITICAL: SUPABASE_SERVICE_ROLE_KEY tidak di-set!');
      console.error('❌ Update role akan gagal karena RLS restrictions.');
      return NextResponse.json(
        { 
          error: 'Service role key tidak di-set. Tidak bisa update role user.',
          suggestion: 'Pastikan SUPABASE_SERVICE_ROLE_KEY sudah di-set di .env.local'
        },
        { status: 500 }
      );
    }

    // Get store info untuk mendapatkan user_id
    const { data: storeData, error: storeError } = await adminClient
      .from('stores')
      .select('user_id, status')
      .eq('id', storeId)
      .single();

    if (storeError || !storeData) {
      return NextResponse.json(
        { error: 'Store tidak ditemukan' },
        { status: 404 }
      );
    }

    // Update store status
    const newStatus = action === 'approve' ? 'approved' : 'rejected';
    const { data: updatedStore, error: updateError } = await adminClient
      .from('stores')
      .update({
        status: newStatus,
        is_open: action === 'approve', // Set is_open to true jika approved
      })
      .eq('id', storeId)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Error updating store status:', updateError);
      return NextResponse.json(
        { error: updateError.message || 'Gagal update status store' },
        { status: 500 }
      );
    }

    // Jika approve, update role user menjadi 'toko'
    if (action === 'approve') {
      console.log('🔄 Updating user role to toko for user_id:', storeData.user_id);
      
      // First, check current role
      const { data: currentUser, error: checkError } = await adminClient
        .from('users')
        .select('id, role, email')
        .eq('id', storeData.user_id)
        .single();

      if (checkError) {
        console.error('❌ Error checking user:', checkError);
      } else {
        console.log('📋 Current user data:', { id: currentUser.id, role: currentUser.role, email: currentUser.email });
      }

      // Update role menggunakan admin client (bypass RLS dengan service role)
      // Pastikan menggunakan adminClient yang sudah menggunakan service_role_key
      const { data: updatedUser, error: roleError } = await adminClient
        .from('users')
        .update({ role: 'toko' })
        .eq('id', storeData.user_id)
        .select()
        .single();

      if (roleError) {
        console.error('❌ Error updating user role:', roleError);
        console.error('❌ Error code:', roleError.code);
        console.error('❌ Error message:', roleError.message);
        console.error('❌ Error details:', JSON.stringify(roleError, null, 2));
        console.error('❌ User ID:', storeData.user_id);
        console.error('❌ Service Role Key exists:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
        console.error('❌ Service Role Key length:', process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0);
        
        // Try alternative: use RPC or direct SQL if available
        // For now, return error so admin knows something went wrong
        return NextResponse.json({
          success: false,
          error: 'Gagal update role user',
          details: roleError.message,
          userId: storeData.user_id,
          message: 'Store berhasil disetujui, namun update role user gagal. Silakan update role secara manual.',
        }, { status: 500 });
      } else {
        console.log('✅ User role updated successfully:', {
          id: updatedUser.id,
          oldRole: currentUser?.role,
          newRole: updatedUser.role,
          email: updatedUser.email,
        });
        
        // Verify the update
        const { data: verifyUser, error: verifyError } = await adminClient
          .from('users')
          .select('role')
          .eq('id', storeData.user_id)
          .single();
        
        if (verifyError) {
          console.error('❌ Error verifying user role update:', verifyError);
        } else {
          console.log('✅ Verified user role:', verifyUser.role);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: action === 'approve' 
        ? 'Store berhasil disetujui. User sekarang memiliki role toko.' 
        : 'Store berhasil ditolak.',
      store: {
        id: updatedStore.id,
        name: updatedStore.name,
        status: updatedStore.status,
      },
    });
  } catch (error: any) {
    console.error('❌ Unexpected error:', error);
    return NextResponse.json(
      { error: error.message || 'Terjadi kesalahan saat approve/reject store' },
      { status: 500 }
    );
  }
}
