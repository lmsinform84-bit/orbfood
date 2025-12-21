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

    // Get completed orders
    const { data: completedOrders, error: ordersError } = await supabase
      .from('orders')
      .select('id, store_id, total_price, final_total, created_at')
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
        ordersAdded: 0,
      });
    }

    // Check which orders already in invoices
    const orderIds = completedOrders.map(o => o.id);
    console.log(`Checking ${orderIds.length} completed orders for existing invoice entries`);
    
    const { data: existingInvoiceOrders, error: existingError } = await supabase
      .from('invoice_orders')
      .select('order_id')
      .in('order_id', orderIds);

    if (existingError) {
      console.error('Error checking existing invoice orders:', existingError);
    }

    const existingOrderIds = new Set(existingInvoiceOrders?.map(io => io.order_id) || []);
    const ordersToAdd = completedOrders.filter(o => !existingOrderIds.has(o.id));
    
    console.log(`Found ${existingOrderIds.size} orders already in invoices, ${ordersToAdd.length} orders need to be added`);

    if (ordersToAdd.length === 0) {
      return NextResponse.json({
        message: 'All completed orders already in invoices',
        ordersAdded: 0,
      });
    }

    // Add orders to active invoice using the function
    let ordersAdded = 0;
    let invoiceId: string | null = null;

    for (const order of ordersToAdd) {
      try {
        const { data: result, error: addError } = await supabase
          .rpc('add_order_to_active_invoice_with_subtotal', {
            store_uuid: order.store_id,
            order_uuid: order.id,
            order_subtotal: order.total_price || 0,
          });

        if (addError) {
          console.error(`Error adding order ${order.id} to invoice:`, addError);
        } else {
          ordersAdded++;
          if (!invoiceId && result) {
            invoiceId = result;
          }
        }
      } catch (error) {
        console.error(`Error processing order ${order.id}:`, error);
      }
    }

    // Create activity log if orders were added
    if (ordersAdded > 0 && invoiceId) {
      await supabase
        .from('invoice_activity_logs')
        .insert({
          invoice_id: invoiceId,
          action: 'orders_added',
          description: `${ordersAdded} order ditambahkan ke invoice periode`,
        });
    }

    return NextResponse.json({
      message: `Added ${ordersAdded} orders to active period invoice`,
      ordersAdded: ordersAdded,
      invoiceId: invoiceId,
    });

  } catch (error: any) {
    console.error('Error in generate invoices:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

