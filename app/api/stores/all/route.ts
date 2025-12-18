import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin-server';

/**
 * API Route untuk mendapatkan semua stores dengan estimasi fee dari periode aktif
 */
export async function GET() {
  try {
    const supabase = createAdminClient();
    const { data: stores, error } = await supabase
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

    // Calculate estimated fee for each store
    const storesWithFee = await Promise.all(
      (stores || []).map(async (store) => {
        // Get active period
        const { data: activePeriod } = await supabase
          .from('store_periods')
          .select('id, start_date, end_date')
          .eq('store_id', store.id)
          .eq('is_active', true)
          .single();

        // Get completed orders without invoices
        const { data: completedOrders } = await supabase
          .from('orders')
          .select('id, final_total')
          .eq('store_id', store.id)
          .eq('status', 'selesai');

        if (!completedOrders || completedOrders.length === 0) {
          return {
            ...store,
            order_count: 0,
            total_fee: 0,
          };
        }

        // Get order IDs that already have invoices
        const orderIds = completedOrders.map(o => o.id);
        const { data: existingInvoices } = await supabase
          .from('invoices')
          .select('order_id')
          .in('order_id', orderIds);

        const existingOrderIds = new Set(existingInvoices?.map(inv => inv.order_id) || []);
        const unpaidOrders = completedOrders.filter(o => !existingOrderIds.has(o.id));

        const estimatedRevenue = unpaidOrders.reduce((sum, o) => sum + (o.final_total || 0), 0);
        const estimatedFee = estimatedRevenue * 0.05;

        return {
          ...store,
          order_count: unpaidOrders.length,
          total_fee: estimatedFee,
        };
      })
    );

    return NextResponse.json({
      success: true,
      stores: storesWithFee,
    });
  } catch (error: any) {
    console.error('❌ Unexpected error:', error);
    return NextResponse.json(
      { error: error.message || 'Terjadi kesalahan' },
      { status: 500 }
    );
  }
}
