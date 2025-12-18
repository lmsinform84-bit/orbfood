import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Get invoices with filters (status, store_id, pagination)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    
    const storeId = searchParams.get('store_id');
    const status = searchParams.get('status'); // menunggu_pembayaran, menunggu_verifikasi, lunas
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check user role
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    const isAdmin = userData?.role === 'admin';

    // Build query
    let query = supabase
      .from('invoices')
      .select(`
        *,
        store_periods(
          id,
          start_date,
          end_date
        ),
        invoice_activity_logs(
          id,
          action,
          description,
          created_at
        )
      `, { count: 'exact' });

    // Apply filters
    if (storeId) {
      query = query.eq('store_id', storeId);
    }

    if (status) {
      query = query.eq('status', status);
    }

    // If not admin, ensure user can only see their own store's invoices
    if (!isAdmin && storeId) {
      const { data: store } = await supabase
        .from('stores')
        .select('user_id')
        .eq('id', storeId)
        .single();

      if (store?.user_id !== user.id) {
        return NextResponse.json(
          { error: 'Forbidden' },
          { status: 403 }
        );
      }
    }

    // Apply pagination
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: invoices, error, count } = await query;

    if (error) {
      console.error('Error fetching invoices:', error);
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      });
      return NextResponse.json(
        { 
          error: 'Failed to fetch invoices',
          details: error.message 
        },
        { status: 500 }
      );
    }

    console.log(`Fetched ${invoices?.length || 0} invoices for store ${storeId}, status: ${status}`);

    return NextResponse.json({
      invoices: invoices || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });

  } catch (error: any) {
    console.error('Error in list invoices:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

