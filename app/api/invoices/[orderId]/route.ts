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

    // Get invoice from invoice_orders by order_id
    const { data: invoiceOrder, error: invoiceOrderError } = await supabase
      .from('invoice_orders')
      .select('invoice_id')
      .eq('order_id', orderId)
      .single();

    if (invoiceOrderError && invoiceOrderError.code !== 'PGRST116') {
      console.error('Error fetching invoice order:', invoiceOrderError);
    }

    // If invoice exists, return it
    if (invoiceOrder) {
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', invoiceOrder.invoice_id)
        .single();

      if (invoiceError) {
        console.error('Error fetching invoice:', invoiceError);
        return NextResponse.json(
          { error: 'Failed to fetch invoice' },
          { status: 500 }
        );
      }

      if (invoice) {
        return NextResponse.json({ invoice });
      }
    }

    // If invoice doesn't exist, check if order is completed
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('store_id, final_total, created_at, status')
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
        { error: 'Forbidden: You do not have permission to access invoice for this order' },
        { status: 403 }
      );
    }

    // If order is not completed, return error
    if (order.status !== 'selesai') {
      return NextResponse.json(
        { error: 'Order is not completed yet. Invoice will be created when order is completed.' },
        { status: 400 }
      );
    }

    // Add order to active invoice
    const { data: invoiceId, error: addError } = await supabase
      .rpc('add_order_to_active_invoice', {
        store_uuid: order.store_id,
        order_uuid: orderId,
        order_total: order.final_total || 0,
      });

    if (addError) {
      console.error('Error adding order to invoice:', addError);
      return NextResponse.json(
        { 
          error: 'Failed to add order to invoice',
          details: addError.message 
        },
        { status: 500 }
      );
    }

    // Get the invoice
    const { data: newInvoice, error: getInvoiceError } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .single();

    if (getInvoiceError || !newInvoice) {
      return NextResponse.json(
        { error: 'Failed to fetch created invoice' },
        { status: 500 }
      );
    }

    // Create activity log
    await supabase
      .from('invoice_activity_logs')
      .insert({
        invoice_id: newInvoice.id,
        action: 'order_added',
        description: `Order #${orderId.slice(0, 8)} ditambahkan ke invoice`,
        performed_by: user.id,
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

