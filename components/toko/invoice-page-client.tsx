'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Download, RefreshCw, FileText, CheckCircle2, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale/id';
import { PayInvoiceButton } from './pay-invoice-button';
import { InvoiceDetail } from './invoice-detail';
import { supabase } from '@/lib/supabase/client';

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  subtotal: number;
  product: {
    id: string;
    name: string;
    image_url: string | null;
  };
}

interface Order {
  id: string;
  final_total: number;
  created_at: string;
  status: string;
  items?: OrderItem[];
}

interface Invoice {
  id: string;
  order_id: string;
  fee_amount: number;
  status: 'menunggu_pembayaran' | 'menunggu_verifikasi' | 'lunas';
  payment_proof_url?: string | null;
}

interface InvoicePageClientProps {
  storeName: string;
  storeId: string;
  orders: Order[];
  orbQrisUrl?: string | null;
}

const ORB_FEE_PERCENTAGE = 0.05;

export function InvoicePageClient({
  storeName,
  storeId,
  orders: initialOrders,
  orbQrisUrl,
}: InvoicePageClientProps) {
  const [period, setPeriod] = useState<'today' | 'week' | 'month'>('today');
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [invoices, setInvoices] = useState<Record<string, Invoice>>({});
  const [loading, setLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Fetch invoices for orders
  useEffect(() => {
    const fetchInvoices = async () => {
      const invoiceMap: Record<string, Invoice> = {};
      
      for (const order of orders) {
        try {
          const response = await fetch(`/api/invoices/${order.id}`);
          if (response.ok) {
            const data = await response.json();
            if (data.invoice) {
              invoiceMap[order.id] = data.invoice;
            }
          }
        } catch (error) {
          console.error(`Error fetching invoice for order ${order.id}:`, error);
        }
      }
      
      setInvoices(invoiceMap);
    };

    if (orders.length > 0) {
      fetchInvoices();
    }
  }, [orders]);

  // Fetch order items if not present
  useEffect(() => {
    const fetchOrderItems = async () => {
      const ordersNeedingItems = orders.filter(o => !o.items || o.items.length === 0);
      if (ordersNeedingItems.length === 0) return;

      for (const order of ordersNeedingItems) {
        try {
          const { data } = await supabase
            .from('order_items')
            .select(`
              *,
              product:products(id, name, image_url)
            `)
            .eq('order_id', order.id);

          if (data) {
            setOrders(prev => prev.map(o => 
              o.id === order.id ? { ...o, items: data } : o
            ));
          }
        } catch (error) {
          console.error(`Error fetching items for order ${order.id}:`, error);
        }
      }
    };

    fetchOrderItems();
  }, [orders]);

  // Filter orders by period
  const filteredOrders = useMemo(() => {
    const now = new Date();
    let startDate: Date;
    let endDate: Date = new Date(now);
    endDate.setHours(23, 59, 59, 999);

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
        break;
    }

    return orders.filter((order) => {
      const orderDate = new Date(order.created_at);
      return orderDate >= startDate && orderDate <= endDate;
    });
  }, [orders, period]);

  // Calculate summary
  const summary = useMemo(() => {
    const totalRevenue = filteredOrders.reduce((sum, order) => sum + order.final_total, 0);
    const totalFee = totalRevenue * ORB_FEE_PERCENTAGE;
    
    // Count paid vs unpaid
    let paidCount = 0;
    let unpaidCount = 0;
    
    filteredOrders.forEach((order) => {
      const invoice = invoices[order.id];
      if (invoice) {
        if (invoice.status === 'lunas') {
          paidCount++;
        } else {
          unpaidCount++;
        }
      } else {
        unpaidCount++;
      }
    });

    return {
      totalRevenue,
      totalFee,
      paidCount,
      unpaidCount,
      orderCount: filteredOrders.length,
    };
  }, [filteredOrders, invoices]);

  const getInvoiceStatus = (order: Order): 'belum' | 'diterima' => {
    const invoice = invoices[order.id];
    if (!invoice) return 'belum';
    return invoice.status === 'lunas' ? 'diterima' : 'belum';
  };

  const getFeeAmount = (order: Order): number => {
    const invoice = invoices[order.id];
    if (invoice) return invoice.fee_amount;
    return order.final_total * ORB_FEE_PERCENTAGE;
  };

  const handleRefresh = async () => {
    setLoading(true);
    try {
      // Generate invoices for completed orders
      await fetch('/api/invoices/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeId }),
      });
      
      // Refresh orders
      const { data: newOrders } = await supabase
        .from('orders')
        .select('*')
        .eq('store_id', storeId)
        .eq('status', 'selesai')
        .order('created_at', { ascending: false });
      
      if (newOrders) {
        setOrders(newOrders as Order[]);
      }
    } catch (error) {
      console.error('Error refreshing:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-6">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-900">
                ORBfood Invoice {storeName}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleRefresh}
                disabled={loading}
                className="h-9 w-9"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                onClick={() => window.print()}
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Filter Tabs */}
          <Tabs value={period} onValueChange={(value) => setPeriod(value as 'today' | 'week' | 'month')}>
            <TabsList className="w-full grid grid-cols-3">
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
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-gray-600 mb-1">Total Omzet</p>
              <p className="text-2xl font-bold text-gray-900">
                Rp {summary.totalRevenue.toLocaleString('id-ID')}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-gray-600 mb-1">Fee ORB (5%)</p>
              <p className="text-2xl font-bold text-primary">
                Rp {summary.totalFee.toLocaleString('id-ID')}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-gray-600 mb-1">Status Setoran</p>
              {summary.unpaidCount > 0 ? (
                <Badge variant="destructive" className="text-sm px-3 py-1">
                  Belum Dibayar
                </Badge>
              ) : (
                <Badge className="bg-green-500 text-white text-sm px-3 py-1">
                  Sudah Dibayar
                </Badge>
              )}
              <p className="text-xs text-gray-500 mt-2">
                {summary.unpaidCount} belum / {summary.paidCount} sudah
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Invoice List */}
        {filteredOrders.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600">Belum ada invoice untuk periode ini</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredOrders.map((order) => {
              const status = getInvoiceStatus(order);
              const fee = getFeeAmount(order);
              const invoice = invoices[order.id];
              
              return (
                <Card key={order.id} className="border border-gray-200 hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="font-mono text-sm font-semibold text-gray-900">
                            #ORD-{order.id.substring(0, 8).toUpperCase()}
                          </span>
                          <span className="text-xs text-gray-500">
                            {format(new Date(order.created_at), 'dd MMM yyyy', { locale: id })}
                          </span>
                        </div>
                        <p className="text-base font-bold text-gray-900 mb-1">
                          Rp {order.final_total.toLocaleString('id-ID')}
                        </p>
                        <p className="text-sm text-gray-600 mb-2">
                          Fee ORB: <span className="font-semibold text-primary">Rp {fee.toLocaleString('id-ID')}</span>
                        </p>
                        <div className="flex items-center gap-2">
                          {status === 'belum' ? (
                            <Badge variant="destructive" className="text-xs px-2 py-0.5">
                              Belum
                            </Badge>
                          ) : (
                            <Badge className="bg-green-500 text-white text-xs px-2 py-0.5">
                              Diterima
                            </Badge>
                          )}
                          {invoice?.status === 'menunggu_verifikasi' && (
                            <Badge variant="secondary" className="text-xs px-2 py-0.5">
                              Menunggu Verifikasi
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 flex-shrink-0">
                        {status === 'belum' && (
                          <PayInvoiceButton
                            orderId={order.id}
                            invoiceId={invoice?.id}
                            amount={fee}
                            orbQrisUrl={orbQrisUrl}
                            buttonText="Upload Bukti"
                            buttonSize="sm"
                            buttonVariant="default"
                            onPaymentSuccess={() => {
                              const fetchInvoice = async () => {
                                const response = await fetch(`/api/invoices/${order.id}`);
                                if (response.ok) {
                                  const data = await response.json();
                                  if (data.invoice) {
                                    setInvoices(prev => ({
                                      ...prev,
                                      [order.id]: data.invoice,
                                    }));
                                  }
                                }
                              };
                              fetchInvoice();
                            }}
                          />
                        )}
                        <Sheet>
                          <SheetTrigger asChild>
                            <Button variant="outline" size="sm" className="w-full">
                              <FileText className="h-4 w-4 mr-2" />
                              Detail
                            </Button>
                          </SheetTrigger>
                          <SheetContent className="overflow-y-auto sm:max-w-lg">
                            <SheetHeader>
                              <SheetTitle>Detail Invoice</SheetTitle>
                            </SheetHeader>
                            <div className="mt-6">
                              <InvoiceDetail order={order} fee={fee} />
                              {status === 'belum' && (
                                <div className="mt-6 pt-6 border-t">
                                  <PayInvoiceButton
                                    orderId={order.id}
                                    invoiceId={invoice?.id}
                                    amount={fee}
                                    orbQrisUrl={orbQrisUrl}
                                    onPaymentSuccess={() => {
                                      const fetchInvoice = async () => {
                                        const response = await fetch(`/api/invoices/${order.id}`);
                                        if (response.ok) {
                                          const data = await response.json();
                                          if (data.invoice) {
                                            setInvoices(prev => ({
                                              ...prev,
                                              [order.id]: data.invoice,
                                            }));
                                          }
                                        }
                                      };
                                      fetchInvoice();
                                    }}
                                  />
                                </div>
                              )}
                            </div>
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
      </div>
    </div>
  );
}

