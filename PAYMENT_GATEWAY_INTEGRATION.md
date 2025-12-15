# Integrasi Payment Gateway untuk ORBfood

## 📋 Gambaran Umum

Dokumentasi ini menjelaskan cara mengintegrasikan payment gateway ke dalam platform ORBfood. Tujuan utama adalah memungkinkan pelanggan untuk melakukan pembayaran online secara aman dan terverifikasi, serta mencatat status pembayaran dalam sistem.

## 🎯 Fitur yang Akan Dikembangkan

### 1. Status Pembayaran dalam Sistem
- **Tabel Pembayaran**: Menyimpan detail pembayaran (payment_id, order_id, status, amount, gateway, created_at)
- **Status Pembayaran**: `pending` → `success` → `failed` → `expired` → `cancelled`
- **Pembaruan Otomatis**: Callback dari payment gateway memperbarui status di database

### 2. Integrasi Payment Gateway
- **Midtrans** (rekomendasi untuk Indonesia)
- **DOKU**
- **Xendit**
- **Alternative Gateway** (seperti Stripe, PayPal untuk ekspansi internasional)

## 🏗️ Arsitektur Sistem Pembayaran

### Database Schema Tambahan

#### Tabel `payments`
```sql
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  payment_gateway_id TEXT NOT NULL, -- ID dari gateway (misalnya: midtrans transaction_id)
  payment_method TEXT, -- metode pembayaran (credit_card, bank_transfer, etc.)
  gross_amount DECIMAL(10, 2) NOT NULL,
  transaction_status TEXT NOT NULL, -- pending, success, failed, expired, cancelled
  fraud_status TEXT DEFAULT 'accept', -- accept, deny, challenge
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index untuk performa
CREATE INDEX idx_payments_order_id ON public.payments(order_id);
CREATE INDEX idx_payments_gateway_id ON public.payments(payment_gateway_id);
CREATE INDEX idx_payments_status ON public.payments(transaction_status);

-- Trigger untuk updated_at
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS policy
CREATE POLICY "Users can view payments for their orders"
  ON public.payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE id = payments.order_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Store owners can view payments for their store"
  ON public.payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      JOIN public.stores ON stores.id = orders.store_id
      WHERE orders.id = payments.order_id AND stores.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all payments"
  ON public.payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

#### Perubahan pada Tabel `orders`
```sql
-- Tambah kolom payment_status
ALTER TABLE public.orders ADD COLUMN payment_status TEXT DEFAULT 'pending';
-- Nilai: pending, paid, failed, cancelled, refunded

-- Tambah index
CREATE INDEX idx_orders_payment_status ON public.orders(payment_status);
```

## 🔧 Implementasi Payment Gateway

### 1. Midtrans Integration

#### Setup Environment
```env
MIDTRANS_SERVER_KEY=your_midtrans_server_key
MIDTRANS_CLIENT_KEY=your_midtrans_client_key
MIDTRANS_IS_PRODUCTION=false  # Set to true for production
MIDTRANS_BASE_URL=https://api.sandbox.midtrans.com  # Change to production URL for production
```

#### Server-side Implementation
```typescript
// lib/payment/midtrans.ts
import { createClient } from '@supabase/supabase-js';

const midtransClient = require('midtrans-client');

export class MidtransPayment {
  private snap: any;

  constructor() {
    this.snap = new midtransClient.Snap({
      isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
      serverKey: process.env.MIDTRANS_SERVER_KEY,
      clientKey: process.env.MIDTRANS_CLIENT_KEY,
    });
  }

  async createTransaction(orderId: string, amount: number, customerDetails: any, itemDetails: any[]) {
    const parameter = {
      transaction_details: {
        order_id: orderId,
        gross_amount: amount,
      },
      customer_details: customerDetails,
      item_details: itemDetails,
    };

    try {
      const transaction = await this.snap.createTransaction(parameter);
      return transaction;
    } catch (error) {
      console.error('Midtrans transaction error:', error);
      throw error;
    }
  }

  async handleNotification(notification: any) {
    try {
      const statusResponse = await this.snap.transaction.notification(notification);
      const orderId = statusResponse.order_id;
      const transactionStatus = statusResponse.transaction_status;
      const fraudStatus = statusResponse.fraud_status;

      // Update payment status in database
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      // Update payment record
      await supabase
        .from('payments')
        .update({
          transaction_status: transactionStatus,
          fraud_status: fraudStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('payment_gateway_id', orderId);

      // Update order payment status
      let orderPaymentStatus = 'pending';
      if (transactionStatus === 'capture' || transactionStatus === 'settlement') {
        orderPaymentStatus = 'paid';
      } else if (transactionStatus === 'cancel' || transactionStatus === 'expire') {
        orderPaymentStatus = 'cancelled';
      } else if (transactionStatus === 'deny') {
        orderPaymentStatus = 'failed';
      }

      // Get order_id from payment record
      const { data: payment } = await supabase
        .from('payments')
        .select('order_id')
        .eq('payment_gateway_id', orderId)
        .single();

      if (payment) {
        await supabase
          .from('orders')
          .update({ 
            payment_status: orderPaymentStatus,
            updated_at: new Date().toISOString(),
          })
          .eq('id', payment.order_id);
      }

      return { status: 'OK', message: 'Payment status updated successfully' };
    } catch (error) {
      console.error('Notification handler error:', error);
      throw error;
    }
  }
}
```

#### API Routes
```typescript
// app/api/payments/midtrans/create/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { MidtransPayment } from '@/lib/payment/midtrans';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orderId, amount } = await request.json();

    // Verify order belongs to user
    const { data: order } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .eq('user_id', user.id)
      .single();

    if (!order) {
      return NextResponse.json({ error: 'Order not found or unauthorized' }, { status: 404 });
    }

    const payment = new MidtransPayment();
    
    const customerDetails = {
      first_name: user.email?.split('@')[0] || 'Customer',
      email: user.email || '',
      phone: order.delivery_address || '',
    };

    const itemDetails = [
      {
        id: orderId,
        price: order.total_price,
        quantity: 1,
        name: `Order ${orderId}`,
      }
    ];

    // Tambahkan ongkir jika ada
    if (order.delivery_fee && order.delivery_fee > 0) {
      itemDetails.push({
        id: 'delivery_fee',
        price: order.delivery_fee,
        quantity: 1,
        name: 'Delivery Fee',
      });
    }

    const transaction = await payment.createTransaction(
      orderId,
      order.final_total,
      customerDetails,
      itemDetails
    );

    // Simpan ke tabel payments
    const { error: paymentError } = await supabase
      .from('payments')
      .insert({
        order_id: orderId,
        payment_gateway_id: transaction.transaction_id,
        payment_method: 'midtrans',
        gross_amount: order.final_total,
        transaction_status: 'pending',
      });

    if (paymentError) {
      console.error('Payment insertion error:', paymentError);
      return NextResponse.json({ error: 'Failed to create payment record' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      redirect_url: transaction.redirect_url,
      token: transaction.token_id,
      transaction_id: transaction.transaction_id,
    });
  } catch (error: any) {
    console.error('Payment creation error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

```typescript
// app/api/payments/midtrans/notification/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { MidtransPayment } from '@/lib/payment/midtrans';

export async function POST(request: NextRequest) {
  try {
    const notification = await request.json();
    
    const payment = new MidtransPayment();
    const result = await payment.handleNotification(notification);
    
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Notification error:', error);
    return NextResponse.json({ 
      status: 'ERROR', 
      message: error.message 
    }, { status: 500 });
  }
}
```

### 2. UI Implementation

#### Payment Button Component
```typescript
// components/user/payment-button.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface PaymentButtonProps {
  orderId: string;
  amount: number;
  disabled?: boolean;
}

export function PaymentButton({ orderId, amount, disabled }: PaymentButtonProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    setLoading(true);
    
    try {
      const response = await fetch('/api/payments/midtrans/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId,
          amount,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create payment');
      }

      // Redirect to payment page
      window.location.href = data.redirect_url;
    } catch (error: any) {
      toast({
        title: 'Pembayaran Gagal',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button 
      onClick={handlePayment}
      disabled={loading || disabled}
      className="w-full"
    >
      {loading ? 'Memproses...' : `Bayar Rp ${amount.toLocaleString('id-ID')}`}
    </Button>
  );
}
```

#### Payment Status Component
```typescript
// components/user/payment-status.tsx
'use client';

import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Clock, AlertCircle, XCircle } from 'lucide-react';

interface PaymentStatusProps {
  orderId: string;
}

export function PaymentStatus({ orderId }: PaymentStatusProps) {
  const [status, setStatus] = useState<'pending' | 'success' | 'failed' | 'cancelled'>('pending');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPaymentStatus = async () => {
      try {
        const response = await fetch(`/api/payments/status?orderId=${orderId}`);
        const data = await response.json();
        
        if (data.success) {
          setStatus(data.paymentStatus as any);
        }
      } catch (error) {
        console.error('Error fetching payment status:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentStatus();

    // Polling untuk update status
    const interval = setInterval(fetchPaymentStatus, 5000);
    return () => clearInterval(interval);
  }, [orderId]);

  const getStatusConfig = () => {
    switch (status) {
      case 'success':
        return {
          icon: CheckCircle,
          label: 'Lunas',
          variant: 'default' as const,
          color: 'text-green-600',
        };
      case 'failed':
        return {
          icon: XCircle,
          label: 'Gagal',
          variant: 'destructive' as const,
          color: 'text-red-600',
        };
      case 'cancelled':
        return {
          icon: AlertCircle,
          label: 'Dibatalkan',
          variant: 'destructive' as const,
          color: 'text-red-600',
        };
      default:
        return {
          icon: Clock,
          label: 'Menunggu Pembayaran',
          variant: 'secondary' as const,
          color: 'text-yellow-600',
        };
    }
  };

  const { icon: Icon, label, variant, color } = getStatusConfig();

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <span>Memeriksa status pembayaran...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Status Pembayaran</CardTitle>
        <Icon className={`h-5 w-5 ${color}`} />
      </CardHeader>
      <CardContent>
        <Badge variant={variant} className="text-lg py-2 px-4">
          {label}
        </Badge>
      </CardContent>
    </Card>
  );
}
```

## 🚀 Alur Pembayaran

### 1. Proses Checkout
1. User menyelesaikan checkout dan membuat order
2. Order dibuat dengan `payment_status: 'pending'`
3. User klik tombol "Bayar Sekarang"
4. Server membuat payment record di database
5. Server membuat transaksi di payment gateway
6. User diarahkan ke halaman pembayaran gateway
7. User menyelesaikan pembayaran

### 2. Proses Callback/Notification
1. Payment gateway mengirim notifikasi ke endpoint `/api/payments/midtrans/notification`
2. Server menerima notifikasi dan memverifikasi
3. Server update status pembayaran di database
4. Server update status order berdasarkan status pembayaran
5. (Opsional) Kirim notifikasi ke user bahwa pembayaran telah diproses

### 3. Polling untuk Update Status (Opsional)
1. Halaman order melakukan polling status pembayaran
2. Setiap 5 detik cek status terbaru
3. Update UI saat status berubah

## 🔐 Keamanan

### 1. Verifikasi Server Key
- Jangan pernah menyimpan server key di client-side
- Gunakan environment variables dan middleware server-side

### 2. Validasi Order
- Pastikan hanya order milik user yang bisa diproses pembayarannya
- Gunakan Supabase RLS untuk kontrol akses

### 3. Token Keamanan
- Gunakan validasi token dari payment gateway
- Lakukan signature verification untuk notifikasi

## 📱 Frontend Integration

### Update Order Page
```tsx
// Update app/user/orders/[id]/page.tsx
import { PaymentButton } from '@/components/user/payment-button';
import { PaymentStatus } from '@/components/user/payment-status';

// Tambahkan di dalam return component
{order.status === 'pending' && order.payment_status === 'pending' && (
  <div className="mt-4">
    <PaymentButton 
      orderId={order.id} 
      amount={order.final_total}
      disabled={order.final_total <= 0}
    />
  </div>
)}

{order.payment_status && (
  <PaymentStatus orderId={order.id} />
)}
```

### Update Cart Page
```tsx
// Update app/user/cart/page.tsx
// Di dalam handleCheckout function, tambahkan setelah membuat order:
// - Jika pembayaran langsung diperlukan, redirect ke proses pembayaran
// - Jika pembayaran bisa nanti, tampilkan status pembayaran
```

## 🧪 Testing

### 1. Unit Testing
```typescript
// tests/payment.test.ts
describe('Payment Integration', () => {
  it('should create payment transaction successfully', async () => {
    // Test payment creation
  });

  it('should handle notification successfully', async () => {
    // Test notification handling
  });

  it('should update order status based on payment status', async () => {
    // Test order status update
  });
});
```

### 2. Integration Testing
- Test dengan sandbox environment dari payment gateway
- Verifikasi flow pembayaran end-to-end
- Test various payment status scenarios

## 🚢 Deployment Checklist

### 1. Environment Variables
- [ ] `MIDTRANS_SERVER_KEY`
- [ ] `MIDTRANS_CLIENT_KEY`
- [ ] `MIDTRANS_IS_PRODUCTION`
- [ ] `MIDTRANS_BASE_URL`

### 2. Webhook Configuration
- [ ] Setup webhook URL di dashboard payment gateway
- [ ] Pastikan URL bisa diakses publik
- [ ] Test webhook delivery

### 3. Database Migration
- [ ] Jalankan migrasi untuk tabel payments
- [ ] Verifikasi RLS policies
- [ ] Test akses berdasarkan role

## 🔧 Troubleshooting

### 1. Notification tidak diterima
- Cek apakah webhook URL bisa diakses dari luar
- Cek error logs di payment gateway dashboard
- Pastikan tidak ada firewall yang memblokir

### 2. Status tidak update
- Cek apakah service role key sudah di-set
- Cek apakah RLS policies mengizinkan update
- Verifikasi format notifikasi dari payment gateway

### 3. Error saat create transaction
- Cek apakah server key valid
- Verifikasi format parameter yang dikirim
- Pastikan amount tidak negatif

## 📞 Support & Monitoring

### 1. Error Logging
- Log semua error pembuatan dan notifikasi pembayaran
- Gunakan structured logging untuk debugging

### 2. Monitoring
- Monitor webhook delivery success rate
- Cek perbedaan antara status internal dan status gateway
- Alert jika ada perbedaan status pembayaran

---

Dokumentasi ini menyediakan panduan lengkap untuk mengintegrasikan payment gateway ke dalam platform ORBfood. Pastikan untuk mengikuti best practices keamanan dan testing sebelum deployment ke production.