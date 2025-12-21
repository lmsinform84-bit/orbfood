import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Update order status and create invoice if status becomes 'selesai'
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { orderId, newStatus } = body;

    if (!orderId || !newStatus) {
      return NextResponse.json(
        { error: 'orderId and newStatus are required' },
        { status: 400 }
      );
    }

    // Get order to check ownership and get details
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('store_id, status, total_price, final_total, created_at, stores!inner(user_id)')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Check if user owns the store
    if ((order.stores as any).user_id !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden: Order does not belong to your store' },
        { status: 403 }
      );
    }

    // Update order status
    const { error: updateError } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId);

    if (updateError) {
      console.error('Error updating order status:', updateError);
      return NextResponse.json(
        { error: 'Failed to update order status' },
        { status: 500 }
      );
    }

    // If status is 'selesai', add order to active period invoice
    if (newStatus === 'selesai') {
      try {
        // Check if order already in an invoice
        const { data: existingInvoiceOrder } = await supabase
          .from('invoice_orders')
          .select('invoice_id')
          .eq('order_id', orderId)
          .single();

        if (!existingInvoiceOrder) {
          // Add order to active invoice for this period
          const { data: invoiceId, error: invoiceError } = await supabase
            .rpc('add_order_to_active_invoice_with_subtotal', {
              store_uuid: order.store_id,
              order_uuid: orderId,
              order_subtotal: order.total_price || 0,
            });

          if (invoiceError) {
            console.error('Error adding order to invoice:', invoiceError);
            // Don't fail the request, just log the error
          } else if (invoiceId) {
            // Create activity log
            await supabase
              .from('invoice_activity_logs')
              .insert({
                invoice_id: invoiceId,
                action: 'order_added',
                description: `Order #${orderId.slice(0, 8)} ditambahkan ke invoice periode`,
                performed_by: user.id,
              });
          }
        }
      } catch (invoiceError: any) {
        console.error('Error in invoice update:', invoiceError);
        // Don't fail the request if invoice update fails
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Order status updated successfully',
    });

  } catch (error: any) {
    console.error('Error updating order status:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

