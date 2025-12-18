import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Get invoice by order ID (or create if doesn't exist)
export async function GET(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const supabase = await createClient();
    const orderId = params.orderId;

    // Get invoice by order_id
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('*')
      .eq('order_id', orderId)
      .single();

    if (invoiceError && invoiceError.code !== 'PGRST116') {
      // PGRST116 = not found, which is okay
      console.error('Error fetching invoice:', invoiceError);
    }

    // If invoice exists, return it
    if (invoice) {
      return NextResponse.json({ invoice });
    }

    // If invoice doesn't exist, get order details to create invoice
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('store_id, final_total, created_at')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Check if user has permission (admin or store owner)
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

    // Check if user is admin or store owner
    const { data: store } = await supabase
      .from('stores')
      .select('user_id')
      .eq('id', order.store_id)
      .single();

    const isAdmin = userData?.role === 'admin';
    const isStoreOwner = store?.user_id === user.id;

    if (!isAdmin && !isStoreOwner) {
      return NextResponse.json(
        { error: 'Forbidden: You do not have permission to create invoice for this order' },
        { status: 403 }
      );
    }

    // Get or create active period for store
    const { data: period, error: periodError } = await supabase
      .rpc('create_initial_store_period', { store_uuid: order.store_id });

    if (periodError) {
      console.error('Error creating period:', periodError);
    }

    // Calculate fee
    const feeAmount = (order.final_total || 0) * 0.05;

    // Create invoice
    const { data: newInvoice, error: createError } = await supabase
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

    if (createError) {
      console.error('Error creating invoice:', createError);
      console.error('Create error details:', {
        code: createError.code,
        message: createError.message,
        details: createError.details,
        hint: createError.hint,
      });
      
      // If RLS error, provide more helpful message
      if (createError.code === '42501') {
        return NextResponse.json(
          { 
            error: 'Permission denied. Please ensure you are logged in and have permission to create invoice for this order.',
            details: createError.message 
          },
          { status: 403 }
        );
      }
      
      return NextResponse.json(
        { 
          error: 'Failed to create invoice',
          details: createError.message 
        },
        { status: 500 }
      );
    }

    // Create activity log
    await supabase
      .from('invoice_activity_logs')
      .insert({
        invoice_id: newInvoice.id,
        action: 'invoice_created',
        description: 'Invoice dibuat untuk order',
      });

    return NextResponse.json({ invoice: newInvoice });

  } catch (error: any) {
    console.error('Error in get invoice:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

