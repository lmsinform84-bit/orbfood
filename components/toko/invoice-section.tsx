'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { id } from 'date-fns/locale/id';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { FileText, Download, TrendingUp, DollarSign, AlertCircle, Receipt } from 'lucide-react';
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

interface InvoiceSectionProps {
  orders: Order[];
  storeName: string;
  storeId: string;
  orbQrisUrl?: string | null;
}

const ORB_FEE_PERCENTAGE = 0.05; // 5%

export function InvoiceSection({
  orders,
  storeName,
  storeId,
  orbQrisUrl,
}: InvoiceSectionProps) {
  const [period, setPeriod] = useState<'today' | 'week' | 'month'>('today');

  const filteredOrders = useMemo(() => {
    const now = new Date();
    let startDate: Date;
    let endDate: Date = new Date(now);

    switch (period) {
      case 'week':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'month':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 30);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'today':
      default:
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(now);
        endDate.setHours(23, 59, 59, 999);
        break;
    }

    return orders.filter((order) => {
      const orderDate = new Date(order.created_at);
      return orderDate >= startDate && orderDate <= endDate;
    });
  }, [orders, period]);

  const summary = useMemo(() => {
    const totalRevenue = filteredOrders.reduce((sum, order) => sum + order.final_total, 0);
    const totalFee = totalRevenue * ORB_FEE_PERCENTAGE;
    const unpaidCount = filteredOrders.length;

    return {
      totalRevenue,
      totalFee,
      unpaidCount,
      orderCount: filteredOrders.length,
    };
  }, [filteredOrders]);

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Receipt className="h-5 w-5" />
          Invoice & Pembayaran
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Period Filter */}
        <Tabs value={period} onValueChange={(value) => setPeriod(value as 'today' | 'week' | 'month')}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="today" className="text-xs sm:text-sm">
              Hari Ini
            </TabsTrigger>
            <TabsTrigger value="week" className="text-xs sm:text-sm">
              7 Hari
            </TabsTrigger>
            <TabsTrigger value="month" className="text-xs sm:text-sm">
              30 Hari
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Omzet</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                Rp {summary.totalRevenue.toLocaleString('id-ID')}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {summary.orderCount} pesanan
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Fee ORB (5%)</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                Rp {summary.totalFee.toLocaleString('id-ID')}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Tagihan ke ORBfood
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Status Setoran</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <Badge variant="destructive" className="text-sm">
                Belum Dibayar
              </Badge>
              <p className="text-xs text-muted-foreground mt-2">
                {summary.unpaidCount} invoice belum dibayar
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Invoice List */}
        {filteredOrders.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Belum ada invoice untuk periode ini.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Daftar Invoice</h3>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => {
                  alert('Fitur download PDF akan segera tersedia');
                }}
              >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Download PDF</span>
              </Button>
            </div>

            {filteredOrders.map((order) => {
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
                          orbQrisUrl={orbQrisUrl}
                          onPaymentSuccess={() => {
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
        )}
      </CardContent>
    </Card>
  );
}

