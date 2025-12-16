'use client';

import { format } from 'date-fns';
import { id } from 'date-fns/locale/id';
import { SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Package, MapPin, CreditCard, DollarSign } from 'lucide-react';

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  subtotal: number;
  product: {
    id: string;
    name: string;
  };
}

interface Order {
  id: string;
  final_total: number;
  total_price: number;
  delivery_fee: number;
  created_at: string;
  items: OrderItem[];
}

interface InvoiceDetailProps {
  order: Order;
  fee: number;
}

export function InvoiceDetail({ order, fee }: InvoiceDetailProps) {
  const orderDate = new Date(order.created_at);

  return (
    <div>
      <SheetHeader>
        <SheetTitle>Detail Invoice</SheetTitle>
        <SheetDescription>
          Invoice #{order.id.substring(0, 8).toUpperCase()}
        </SheetDescription>
      </SheetHeader>

      <div className="mt-6 space-y-6">
        {/* Order Info */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Tanggal Pesanan</span>
            <span className="text-sm">
              {format(orderDate, 'dd MMMM yyyy, HH:mm', { locale: id })}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Status</span>
            <Badge variant="destructive">Belum Dibayar</Badge>
          </div>
        </div>

        <Separator />

        {/* Items */}
        <div>
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Package className="h-4 w-4" />
            Daftar Produk
          </h3>
          <div className="space-y-3">
            {order.items.map((item) => (
              <div
                key={item.id}
                className="flex justify-between items-start py-2 border-b last:border-0"
              >
                <div className="flex-1">
                  <div className="font-medium text-sm">{item.product.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {item.quantity} x Rp {item.price.toLocaleString('id-ID')}
                  </div>
                </div>
                <div className="font-medium text-sm">
                  Rp {item.subtotal.toLocaleString('id-ID')}
                </div>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Summary */}
        <div>
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Ringkasan Pembayaran
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>Rp {order.total_price.toLocaleString('id-ID')}</span>
            </div>
            {order.delivery_fee > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Ongkir</span>
                <span>Rp {order.delivery_fee.toLocaleString('id-ID')}</span>
              </div>
            )}
            <div className="flex justify-between text-sm pt-2 border-t">
              <span className="text-muted-foreground">Total Pesanan</span>
              <span className="font-semibold">
                Rp {order.final_total.toLocaleString('id-ID')}
              </span>
            </div>
            <div className="flex justify-between text-sm pt-2 border-t">
              <span className="text-muted-foreground">Fee ORB (5%)</span>
              <span className="font-bold text-primary">
                Rp {fee.toLocaleString('id-ID')}
              </span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Payment Info */}
        <div className="bg-muted/50 p-4 rounded-lg">
          <h3 className="font-semibold mb-3">Informasi Pembayaran Fee ORB</h3>
          <div className="space-y-3 text-sm">
            <p className="text-muted-foreground">
              Silakan transfer fee ORB sebesar{' '}
              <span className="font-bold text-primary">
                Rp {fee.toLocaleString('id-ID')}
              </span>{' '}
              ke QRIS ORBfood.
            </p>
              <p className="text-muted-foreground">
              QRIS ORBfood akan ditampilkan saat Anda klik tombol "Bayar Invoice".
            </p>
            <p className="text-muted-foreground">
              Setelah transfer, upload bukti transfer untuk verifikasi.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

