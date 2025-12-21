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
    const { orderId, additionalFee, note } = body;

    if (!orderId || !additionalFee || additionalFee <= 0) {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      );
    }

    // Get order and verify it belongs to user's store
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*, store:stores(user_id)')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Verify user owns the store
    if ((order.store as any).user_id !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Verify order status is pending
    if (order.status !== 'pending') {
      return NextResponse.json(
        { error: 'Order status must be pending to propose additional fee' },
        { status: 400 }
      );
    }

    // Calculate new total
    const newTotal = order.final_total + additionalFee;

    // Update order with additional fee and change status
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        additional_delivery_fee: additionalFee,
        additional_delivery_note: note || null,
        final_total: newTotal,
        status: 'menunggu_persetujuan',
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

    return NextResponse.json({
      success: true,
      message: 'Additional fee proposed successfully',
    });

  } catch (error: any) {
    console.error('Error in propose additional fee:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

