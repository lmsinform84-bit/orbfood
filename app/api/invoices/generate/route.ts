import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Generate invoices for completed orders that don't have invoices yet
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { storeId } = body;

    if (!storeId) {
      return NextResponse.json(
        { error: 'storeId is required' },
        { status: 400 }
      );
    }

    // Get completed orders without invoices
    const { data: completedOrders, error: ordersError } = await supabase
      .from('orders')
      .select('id, store_id, final_total, created_at')
      .eq('store_id', storeId)
      .eq('status', 'selesai')
      .order('created_at', { ascending: false });

    if (ordersError) {
      console.error('Error fetching completed orders:', ordersError);
      return NextResponse.json(
        { error: 'Failed to fetch completed orders' },
        { status: 500 }
      );
    }

    if (!completedOrders || completedOrders.length === 0) {
      return NextResponse.json({
        message: 'No completed orders found',
        invoicesCreated: 0,
      });
    }

    // Get or create active period
    const { data: period, error: periodError } = await supabase
      .rpc('create_initial_store_period', { store_uuid: storeId });

    if (periodError) {
      console.error('Error creating period:', periodError);
    }

    // Check which orders already have invoices
    const orderIds = completedOrders.map(o => o.id);
    console.log(`Checking ${orderIds.length} completed orders for existing invoices`);
    
    const { data: existingInvoices, error: existingError } = await supabase
      .from('invoices')
      .select('order_id')
      .in('order_id', orderIds);

    if (existingError) {
      console.error('Error checking existing invoices:', existingError);
    }

    const existingOrderIds = new Set(existingInvoices?.map(inv => inv.order_id) || []);
    const ordersToInvoice = completedOrders.filter(o => !existingOrderIds.has(o.id));
    
    console.log(`Found ${existingOrderIds.size} existing invoices, ${ordersToInvoice.length} orders need invoices`);

    if (ordersToInvoice.length === 0) {
      return NextResponse.json({
        message: 'All completed orders already have invoices',
        invoicesCreated: 0,
      });
    }

    // Create invoices for orders without invoices
    const invoicesToInsert = ordersToInvoice.map(order => ({
      store_id: order.store_id,
      period_id: period || null,
      order_id: order.id,
      total_orders: 1,
      total_revenue: order.final_total || 0,
      fee_amount: (order.final_total || 0) * 0.05,
      status: 'menunggu_pembayaran',
      period_start: order.created_at || new Date().toISOString(),
      period_end: new Date().toISOString(),
    }));

    const { data: newInvoices, error: insertError } = await supabase
      .from('invoices')
      .insert(invoicesToInsert)
      .select();

    if (insertError) {
      console.error('Error creating invoices:', insertError);
      return NextResponse.json(
        { error: 'Failed to create invoices', details: insertError.message },
        { status: 500 }
      );
    }

    // Create activity logs
    if (newInvoices && newInvoices.length > 0) {
      const logsToInsert = newInvoices.map(invoice => ({
        invoice_id: invoice.id,
        action: 'invoice_created',
        description: 'Invoice dibuat untuk order',
      }));

      await supabase
        .from('invoice_activity_logs')
        .insert(logsToInsert);
    }

    return NextResponse.json({
      message: `Created ${newInvoices?.length || 0} invoices`,
      invoicesCreated: newInvoices?.length || 0,
      invoices: newInvoices,
    });

  } catch (error: any) {
    console.error('Error in generate invoices:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

