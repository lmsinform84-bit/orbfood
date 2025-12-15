import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin-server';

/**
 * API Route untuk mendapatkan semua stores
 * Untuk refresh data tanpa full page reload
 */
export async function GET() {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('stores')
      .select(`
        *,
        user:users(id, full_name, email)
      `)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('❌ Error fetching stores:', error);
      return NextResponse.json(
        { error: error.message || 'Gagal mengambil data toko' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      stores: data || [],
    });
  } catch (error: any) {
    console.error('❌ Unexpected error:', error);
    return NextResponse.json(
      { error: error.message || 'Terjadi kesalahan' },
      { status: 500 }
    );
  }
}
