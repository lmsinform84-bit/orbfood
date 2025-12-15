import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin-server';
import { createClient } from '@/lib/supabase/server';

/**
 * API Route untuk update status store (suspended, dll)
 * Hanya admin yang bisa akses
 * Untuk approve/reject, gunakan /api/stores/approve
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
        { error: 'Hanya admin yang bisa update status store' },
        { status: 403 }
      );
    }

    // Get request body
    const body = await request.json();
    const { storeId, status } = body;

    if (!storeId || !status) {
      return NextResponse.json(
        { error: 'storeId dan status harus diisi' },
        { status: 400 }
      );
    }

    // Valid status values
    const validStatuses = ['pending', 'approved', 'rejected', 'suspended'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Status tidak valid' },
        { status: 400 }
      );
    }

    // Use admin client untuk bypass RLS
    const adminClient = createAdminClient();

    // Update store status
    const { data: updatedStore, error: updateError } = await adminClient
      .from('stores')
      .update({
        status,
        is_open: status === 'approved', // Set is_open based on status
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

    return NextResponse.json({
      success: true,
      message: `Status toko berhasil diupdate menjadi ${status}`,
      store: {
        id: updatedStore.id,
        name: updatedStore.name,
        status: updatedStore.status,
      },
    });
  } catch (error: any) {
    console.error('❌ Unexpected error:', error);
    return NextResponse.json(
      { error: error.message || 'Terjadi kesalahan saat update status store' },
      { status: 500 }
    );
  }
}
