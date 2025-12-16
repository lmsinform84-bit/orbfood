'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { id } from 'date-fns/locale/id';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { FileText, Download } from 'lucide-react';
import { InvoiceDetail } from './invoice-detail';
import { PayInvoiceButton } from './pay-invoice-button';

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

interface InvoiceListProps {
  orders: Order[];
}

const ORB_FEE_PERCENTAGE = 0.05; // 5%

export function InvoiceList({ orders }: InvoiceListProps) {
  if (orders.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Belum ada invoice untuk periode ini.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Daftar Invoice</h2>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-2"
            onClick={() => {
              // TODO: Implement PDF download
              alert('Fitur download PDF akan segera tersedia');
            }}
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Download PDF</span>
          </Button>
        </div>
      </div>

      {orders.map((order) => {
        const fee = order.final_total * ORB_FEE_PERCENTAGE;
        const orderDate = new Date(order.created_at);

        return (
          <Card key={order.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg mb-1">
                    #{order.id.substring(0, 8).toUpperCase()}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {format(orderDate, 'dd MMMM yyyy', { locale: id })}
                  </p>
                </div>
                <Badge variant="destructive">Belum</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Pesanan</span>
                  <span className="text-lg font-semibold">
                    Rp {order.final_total.toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="text-sm text-muted-foreground">Fee ORB (5%)</span>
                  <span className="text-lg font-bold text-primary">
                    Rp {fee.toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="space-y-2 mt-4">
                  <PayInvoiceButton 
                    orderId={order.id} 
                    feeAmount={fee}
                    onPaymentSuccess={() => {
                      // Refresh page or update status
                      window.location.reload();
                    }}
                  />
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button variant="outline" className="w-full">
                        <FileText className="h-4 w-4 mr-2" />
                        Lihat Detail
                      </Button>
                    </SheetTrigger>
                    <SheetContent className="overflow-y-auto">
                      <InvoiceDetail order={order} fee={fee} />
                    </SheetContent>
                  </Sheet>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

