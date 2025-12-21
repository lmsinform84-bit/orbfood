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

    // Check if user is admin
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userError || !userData || userData.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { invoiceId, orderId, action } = body; // action: 'confirm' or 'reject'

    if (!action) {
      return NextResponse.json(
        { error: 'Missing action' },
        { status: 400 }
      );
    }

    // Get invoice details - can use invoiceId or orderId
    let invoice;
    if (invoiceId) {
      const { data, error } = await supabase
        .from('invoices')
        .select('*, store_id, period_id')
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
      // Get invoice from invoice_orders
      const { data: invoiceOrder, error: invoiceOrderError } = await supabase
        .from('invoice_orders')
        .select('invoice_id')
        .eq('order_id', orderId)
        .single();

      if (invoiceOrderError || !invoiceOrder) {
        return NextResponse.json(
          { error: 'Order not found in any invoice. Please complete the order first.' },
          { status: 404 }
        );
      }

      const { data, error } = await supabase
        .from('invoices')
        .select('*, store_id, period_id')
        .eq('id', invoiceOrder.invoice_id)
        .single();
      
      if (error || !data) {
        return NextResponse.json(
          { error: 'Invoice not found' },
          { status: 404 }
        );
      }
      invoice = data;
    } else {
      return NextResponse.json(
        { error: 'Missing invoiceId or orderId' },
        { status: 400 }
      );
    }

    if (action === 'confirm') {
      // Confirm payment: 
      // 1. Tutup periode lama dan buat periode baru (periode baru dibuka saat invoice lunas)
      // 2. Mark invoice as LUNAS
      
      // Step 1: Tutup periode lama dan buat periode baru
      const { data: newPeriodId, error: periodError } = await supabase.rpc('close_period_and_create_new', {
        store_uuid: invoice.store_id,
        period_uuid: invoice.period_id,
      });

      if (periodError) {
        console.error('Error closing period and creating new:', periodError);
        return NextResponse.json(
          { error: 'Gagal menutup periode dan membuat periode baru. ' + periodError.message },
          { status: 500 }
        );
      }

      // Step 2: Update invoice status to LUNAS
      const { error: statusError } = await supabase
        .from('invoices')
        .update({
          status: 'lunas',
          verified_by: user.id,
          verified_at: new Date().toISOString(),
        })
        .eq('id', invoice.id);

      if (statusError) {
        console.error('Error updating invoice status:', statusError);
        return NextResponse.json(
          { error: 'Gagal mengupdate status invoice. Periode sudah ditutup, silakan coba lagi.' },
          { status: 500 }
        );
      }

      // Create activity log
      await supabase
        .from('invoice_activity_logs')
        .insert({
          invoice_id: invoice.id,
          action: 'payment_confirmed',
          description: 'Pembayaran dikonfirmasi oleh admin. Invoice LUNAS. Periode ditutup dan periode baru dimulai.',
          performed_by: user.id,
        });

      return NextResponse.json({
        success: true,
        message: 'Pembayaran dikonfirmasi. Invoice ditandai LUNAS.',
      });

    } else if (action === 'reject') {
      // Reject payment: Set status back to menunggu_pembayaran
      // Also mark payment proof as rejected
      const { error: proofUpdateError } = await supabase
        .from('payment_proofs')
        .update({
          is_rejected: true,
        })
        .eq('invoice_id', invoice.id);

      if (proofUpdateError) {
        console.error('Error updating payment proof:', proofUpdateError);
      }

      const { error: statusError } = await supabase
        .from('invoices')
        .update({
          status: 'menunggu_pembayaran',
        })
        .eq('id', invoice.id);

      if (statusError) {
        console.error('Error rejecting payment:', statusError);
        return NextResponse.json(
          { error: 'Failed to reject payment' },
          { status: 500 }
        );
      }

      // Create activity log
      await supabase
        .from('invoice_activity_logs')
        .insert({
          invoice_id: invoice.id,
          action: 'proof_rejected',
          description: 'Bukti pembayaran ditolak oleh admin. Silakan upload ulang.',
          performed_by: user.id,
        });

      return NextResponse.json({
        success: true,
        message: 'Bukti pembayaran ditolak. Status kembali ke Menunggu Pembayaran.',
      });

    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use "confirm" or "reject"' },
        { status: 400 }
      );
    }

  } catch (error: any) {
    console.error('Error in verify invoice:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

