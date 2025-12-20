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
      .select('store_id, status, final_total, created_at, stores!inner(user_id)')
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

    // If status is 'selesai', create invoice automatically
    if (newStatus === 'selesai') {
      try {
        // Check if invoice already exists
        const { data: existingInvoice } = await supabase
          .from('invoices')
          .select('id')
          .eq('order_id', orderId)
          .single();

        if (!existingInvoice) {
          // Get or create active period
          const { data: period } = await supabase
            .rpc('create_initial_store_period', { store_uuid: order.store_id });

          // Calculate fee (5% of final_total)
          const feeAmount = (order.final_total || 0) * 0.05;

          // Create invoice
          const { data: newInvoice, error: invoiceError } = await supabase
            .from('invoices')
            .insert({
              store_id: order.store_id,
              period_id: period || null,
              order_id: orderId,
              total_orders: 1,
              total_revenue: order.final_total || 0,
              fee_amount: feeAmount,
              status: 'menunggu_pembayaran',
              period_start: order.created_at || new Date().toISOString(),
              period_end: new Date().toISOString(),
            })
            .select()
            .single();

          if (invoiceError) {
            console.error('Error creating invoice:', invoiceError);
            // Don't fail the request, just log the error
          } else if (newInvoice) {
            // Create activity log
            await supabase
              .from('invoice_activity_logs')
              .insert({
                invoice_id: newInvoice.id,
                action: 'invoice_created',
                description: 'Invoice dibuat otomatis saat order selesai',
              });
          }
        }
      } catch (invoiceError: any) {
        console.error('Error in invoice creation:', invoiceError);
        // Don't fail the request if invoice creation fails
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

