import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { orderId, approved } = body;

    if (!orderId || typeof approved !== 'boolean') {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      );
    }

    // Get order and verify it belongs to user
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .eq('user_id', user.id)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Verify order status is menunggu_persetujuan
    if (order.status !== 'menunggu_persetujuan') {
      return NextResponse.json(
        { error: 'Order is not waiting for approval' },
        { status: 400 }
      );
    }

    if (approved) {
      // User approved: change status to diproses
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          status: 'diproses',
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId);

      if (updateError) {
        console.error('Error updating order:', updateError);
        return NextResponse.json(
          { error: 'Failed to update order' },
          { status: 500 }
        );
      }
    } else {
      // User rejected: cancel order and clear additional fee
      const originalTotal = order.final_total - (order.additional_delivery_fee || 0);
      
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          status: 'dibatalkan',
          additional_delivery_fee: null,
          additional_delivery_note: null,
          final_total: originalTotal,
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId);

      if (updateError) {
        console.error('Error updating order:', updateError);
        return NextResponse.json(
          { error: 'Failed to cancel order' },
          { status: 500 }
        );
      }

      // Restore product stock
      const { data: orderItems } = await supabase
        .from('order_items')
        .select('product_id, quantity')
        .eq('order_id', orderId);

      if (orderItems) {
        for (const item of orderItems) {
          // Get current stock
          const { data: product } = await supabase
            .from('products')
            .select('stock')
            .eq('id', item.product_id)
            .single();

          if (product) {
            // Increment stock
            await supabase
              .from('products')
              .update({ stock: product.stock + item.quantity })
              .eq('id', item.product_id);
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: approved ? 'Additional fee approved' : 'Order cancelled',
    });

  } catch (error: any) {
    console.error('Error in approve additional fee:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

