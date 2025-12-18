import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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

    // Check if user is toko
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userError || !userData || userData.role !== 'toko') {
      return NextResponse.json(
        { error: 'Forbidden: Toko access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { invoiceId, orderId, paymentProofUrl } = body;

    if (!paymentProofUrl) {
      return NextResponse.json(
        { error: 'Missing paymentProofUrl' },
        { status: 400 }
      );
    }

    // Get invoice - can use invoiceId or orderId
    let invoice;
    if (invoiceId) {
      const { data, error } = await supabase
        .from('invoices')
        .select('store_id, id')
        .eq('id', invoiceId)
        .single();
      
      if (error || !data) {
        return NextResponse.json(
          { error: 'Invoice not found' },
          { status: 404 }
        );
      }
      invoice = data;
    } else if (orderId) {
      // Get or create invoice for this order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('store_id, id')
        .eq('id', orderId)
        .single();

      if (orderError || !order) {
        return NextResponse.json(
          { error: 'Order not found' },
          { status: 404 }
        );
      }

      // Get or create invoice
      let { data: existingInvoice, error: invoiceError } = await supabase
        .from('invoices')
        .select('store_id, id')
        .eq('order_id', orderId)
        .single();

      if (invoiceError && invoiceError.code === 'PGRST116') {
        // Invoice doesn't exist, create it
        const { data: period } = await supabase
          .rpc('create_initial_store_period', { store_uuid: order.store_id });

        const { data: orderDetails } = await supabase
          .from('orders')
          .select('final_total, created_at')
          .eq('id', orderId)
          .single();

        const feeAmount = (orderDetails?.final_total || 0) * 0.05;

        const { data: newInvoice, error: createError } = await supabase
          .from('invoices')
          .insert({
            store_id: order.store_id,
            period_id: period || null,
            order_id: orderId,
            total_orders: 1,
            total_revenue: orderDetails?.final_total || 0,
            fee_amount: feeAmount,
            status: 'menunggu_pembayaran',
            period_start: orderDetails?.created_at || new Date().toISOString(),
            period_end: new Date().toISOString(),
          })
          .select('store_id, id')
          .single();

        if (createError || !newInvoice) {
          return NextResponse.json(
            { error: 'Failed to create invoice' },
            { status: 500 }
          );
        }
        existingInvoice = newInvoice;
      } else if (invoiceError) {
        return NextResponse.json(
          { error: 'Failed to get invoice' },
          { status: 500 }
        );
      }

      invoice = existingInvoice;
    } else {
      return NextResponse.json(
        { error: 'Missing invoiceId or orderId' },
        { status: 400 }
      );
    }

    // Get store to check ownership
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('user_id')
      .eq('id', invoice.store_id)
      .single();

    if (storeError || !store || store.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden: Invoice does not belong to your store' },
        { status: 403 }
      );
    }

    // Update invoice with payment proof
    const { error: updateError } = await supabase
      .from('invoices')
      .update({
        payment_proof_url: paymentProofUrl,
        payment_proof_uploaded_at: new Date().toISOString(),
        status: 'menunggu_verifikasi',
        payment_proof_rejected: false,
      })
      .eq('id', invoice.id);

    if (updateError) {
      console.error('Error updating invoice:', updateError);
      return NextResponse.json(
        { error: 'Failed to update invoice' },
        { status: 500 }
      );
    }

    // Create activity log
    await supabase
      .from('invoice_activity_logs')
      .insert({
        invoice_id: invoice.id,
        action: 'proof_uploaded',
        description: 'Bukti pembayaran diupload oleh toko',
        performed_by: user.id,
      });

    return NextResponse.json({
      success: true,
      message: 'Bukti pembayaran berhasil diupload. Menunggu verifikasi admin.',
    });

  } catch (error: any) {
    console.error('Error uploading payment proof:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

