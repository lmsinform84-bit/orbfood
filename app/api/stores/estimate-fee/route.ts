import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin-server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * API Route untuk mendapatkan estimasi fee dari periode aktif terbaru
 * Menghitung fee dari completed orders yang belum memiliki invoice (belum dibayar)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('store_id');

    if (!storeId) {
      return NextResponse.json(
        { error: 'store_id is required' },
        { status: 400 }
      );
    }

    // Get active period for this store
    const { data: activePeriod, error: periodError } = await supabase
      .from('store_periods')
      .select('id, start_date, end_date')
      .eq('store_id', storeId)
      .eq('is_active', true)
      .single();

    if (periodError && periodError.code !== 'PGRST116') {
      console.error('Error fetching active period:', periodError);
    }

    // If no active period, create one
    let periodId = activePeriod?.id;
    if (!activePeriod) {
      const { data: newPeriod, error: createError } = await supabase
        .rpc('create_initial_store_period', { store_uuid: storeId });

      if (createError) {
        console.error('Error creating period:', createError);
      } else {
        periodId = newPeriod;
      }
    }

    // Get completed orders that don't have invoices yet (unpaid orders in active period)
    const { data: completedOrders, error: ordersError } = await supabase
      .from('orders')
      .select('id, final_total, created_at')
      .eq('store_id', storeId)
      .eq('status', 'selesai')
      .order('created_at', { ascending: false });

    if (ordersError) {
      console.error('Error fetching completed orders:', ordersError);
      return NextResponse.json(
        { error: 'Failed to fetch orders' },
        { status: 500 }
      );
    }

    if (!completedOrders || completedOrders.length === 0) {
      return NextResponse.json({
        estimatedFee: 0,
        estimatedRevenue: 0,
        orderCount: 0,
        periodStart: activePeriod?.start_date || null,
        periodEnd: activePeriod?.end_date || null,
      });
    }

    // Get order IDs that already have invoices
    const orderIds = completedOrders.map(o => o.id);
    const { data: existingInvoices, error: invoicesError } = await supabase
      .from('invoices')
      .select('order_id')
      .in('order_id', orderIds);

    if (invoicesError) {
      console.error('Error checking existing invoices:', invoicesError);
    }

    const existingOrderIds = new Set(existingInvoices?.map(inv => inv.order_id) || []);
    
    // Filter orders that don't have invoices yet (unpaid orders in active period)
    const unpaidOrders = completedOrders.filter(o => !existingOrderIds.has(o.id));

    // Calculate estimated revenue and fee
    const estimatedRevenue = unpaidOrders.reduce((sum, o) => sum + (o.final_total || 0), 0);
    const estimatedFee = estimatedRevenue * 0.05; // 5% fee

    return NextResponse.json({
      estimatedFee,
      estimatedRevenue,
      orderCount: unpaidOrders.length,
      periodStart: activePeriod?.start_date || (unpaidOrders.length > 0 ? unpaidOrders[unpaidOrders.length - 1].created_at : null),
      periodEnd: activePeriod?.end_date || null,
    });

  } catch (error: any) {
    console.error('Error in estimate fee:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

