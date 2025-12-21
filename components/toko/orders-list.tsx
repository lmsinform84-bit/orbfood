'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { id } from 'date-fns/locale/id';
import { UpdateOrderStatusButton } from '@/components/toko/update-order-status-button';
import { OrderStatus } from '@/types/database';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Phone, MapPin, FileText, CreditCard, AlertCircle } from 'lucide-react';
import { ProposeAdditionalFeeButton } from '@/components/toko/propose-additional-fee-button';

interface OrderItem {
  id: string;
  quantity: number;
  subtotal: number;
  product: {
    id: string;
    name: string;
  };
}

interface Order {
  id: string;
  status: OrderStatus;
  total_price: number;
  delivery_fee: number;
  additional_delivery_fee: number | null;
  additional_delivery_note: string | null;
  final_total: number;
  delivery_address: string;
  notes: string | null;
  payment_method: string | null;
  payment_proof_url: string | null;
  payment_proof_uploaded_at: string | null;
  created_at: string;
  user: {
    id: string;
    full_name: string | null;
    phone: string | null;
  } | null;
  items: OrderItem[];
}

interface OrdersListProps {
  orders: Order[];
}

const getStatusBadgeVariant = (status: OrderStatus) => {
  switch (status) {
    case 'pending':
      return 'default';
    case 'menunggu_persetujuan':
      return 'secondary';
    case 'diproses':
      return 'secondary';
    case 'diantar':
      return 'secondary';
    case 'selesai':
      return 'default';
    case 'dibatalkan':
      return 'destructive';
    default:
      return 'default';
  }
};

const getStatusLabel = (status: OrderStatus) => {
  switch (status) {
    case 'pending':
      return 'Menunggu';
    case 'menunggu_persetujuan':
      return 'Menunggu Persetujuan';
    case 'diproses':
      return 'Diproses';
    case 'diantar':
      return 'Diantar';
    case 'selesai':
      return 'Selesai';
    case 'dibatalkan':
      return 'Dibatalkan';
    default:
      return status;
  }
};

const getPaymentMethodLabel = (method: string | null) => {
  if (!method) return 'Belum dipilih';
  switch (method) {
    case 'COD':
      return 'COD (Bayar di Tempat)';
    case 'TRANSFER':
      return 'Transfer Bank';
    case 'QRIS':
      return 'QRIS';
    default:
      return method;
  }
};

export function OrdersList({ orders }: OrdersListProps) {
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | 'all'>('all');

  const filteredOrders = useMemo(() => {
    if (selectedStatus === 'all') return orders;
    return orders.filter((order) => order.status === selectedStatus);
  }, [orders, selectedStatus]);

  const pendingCount = orders.filter((o) => o.status === 'pending').length;
  const processingCount = orders.filter((o) => o.status === 'diproses').length;
  const completedCount = orders.filter((o) => o.status === 'selesai').length;

  if (orders.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Belum ada pesanan masuk.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div>
      {/* Filter Tabs */}
      <Tabs
        value={selectedStatus}
        onValueChange={(value) => setSelectedStatus(value as OrderStatus | 'all')}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="all" className="text-xs sm:text-sm">
            Semua ({orders.length})
          </TabsTrigger>
          <TabsTrigger value="pending" className="text-xs sm:text-sm">
            Baru ({pendingCount})
          </TabsTrigger>
          <TabsTrigger value="diproses" className="text-xs sm:text-sm">
            Diproses ({processingCount})
          </TabsTrigger>
          <TabsTrigger value="selesai" className="text-xs sm:text-sm">
            Selesai ({completedCount})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={selectedStatus === 'all' ? 'all' : selectedStatus} className="mt-0">
          {filteredOrders.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">
                  Tidak ada pesanan dengan status ini.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function OrderCard({ order }: { order: Order }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg mb-1">
              #{order.id.substring(0, 8).toUpperCase()}
            </CardTitle>
            <CardDescription className="flex items-center gap-2 flex-wrap">
              <span>{order.user?.full_name || 'Pelanggan'}</span>
              <span>•</span>
              <span>{getPaymentMethodLabel(order.payment_method)}</span>
            </CardDescription>
            <CardDescription className="mt-1">
              {format(new Date(order.created_at), 'dd MMMM yyyy, HH:mm', {
                locale: id,
              })}
            </CardDescription>
          </div>
          <Badge variant={getStatusBadgeVariant(order.status)}>
            {getStatusLabel(order.status)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Items Summary */}
          <div>
            <div className="space-y-1">
              {order.items.slice(0, 2).map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span>
                    {item.product?.name || 'Produk'} x {item.quantity}
                  </span>
                  <span>Rp {item.subtotal.toLocaleString('id-ID')}</span>
                </div>
              ))}
              {order.items.length > 2 && (
                <div className="text-xs text-muted-foreground">
                  +{order.items.length - 2} item lainnya
                </div>
              )}
            </div>
          </div>

          {/* Total */}
          <div className="flex justify-between items-center pt-2 border-t">
            <span className="text-sm text-muted-foreground">Total</span>
            <span className="text-xl font-bold text-primary">
              Rp {order.final_total.toLocaleString('id-ID')}
            </span>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2 pt-2">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="flex-1">
                  Detail
                </Button>
              </SheetTrigger>
              <SheetContent className="overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>Detail Pesanan</SheetTitle>
                  <SheetDescription>
                    Pesanan #{order.id.substring(0, 8).toUpperCase()}
                  </SheetDescription>
                </SheetHeader>
                <div className="mt-6 space-y-6">
                  {/* Status */}
                  <div>
                    <h3 className="font-semibold mb-2">Status</h3>
                    <Badge variant={getStatusBadgeVariant(order.status)}>
                      {getStatusLabel(order.status)}
                    </Badge>
                  </div>

                  {/* Items */}
                  <div>
                    <h3 className="font-semibold mb-3">Daftar Produk</h3>
                    <div className="space-y-2">
                      {order.items.map((item) => (
                        <div
                          key={item.id}
                          className="flex justify-between text-sm py-2 border-b"
                        >
                          <div>
                            <div className="font-medium">
                              {item.product?.name || 'Produk'}
                            </div>
                            <div className="text-muted-foreground">
                              {item.quantity} x Rp{' '}
                              {(item.subtotal / item.quantity).toLocaleString('id-ID')}
                            </div>
                          </div>
                          <div className="font-medium">
                            Rp {item.subtotal.toLocaleString('id-ID')}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Payment Info */}
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal</span>
                      <span>Rp {order.total_price.toLocaleString('id-ID')}</span>
                    </div>
                    {order.delivery_fee > 0 && (
                      <div className="flex justify-between text-sm">
                        <span>Ongkir</span>
                        <span>Rp {order.delivery_fee.toLocaleString('id-ID')}</span>
                      </div>
                    )}
                    {order.additional_delivery_fee && order.additional_delivery_fee > 0 && (
                      <>
                        <div className="flex justify-between text-sm text-orange-600">
                          <span>Tambahan Ongkir</span>
                          <span>+ Rp {order.additional_delivery_fee.toLocaleString('id-ID')}</span>
                        </div>
                        {order.additional_delivery_note && (
                          <Alert className="bg-orange-50 border-orange-200">
                            <AlertCircle className="h-4 w-4 text-orange-600" />
                            <AlertDescription className="text-xs text-orange-700">
                              {order.additional_delivery_note}
                            </AlertDescription>
                          </Alert>
                        )}
                      </>
                    )}
                    <div className="flex justify-between font-bold text-lg pt-2 border-t">
                      <span>Total</span>
                      <span className="text-primary">
                        Rp {order.final_total.toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>

                  {/* Customer Info */}
                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <Phone className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      <div>
                        <div className="text-sm font-medium">Telepon</div>
                        <div className="text-sm text-muted-foreground">
                          {order.user?.phone || '-'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      <div>
                        <div className="text-sm font-medium">Alamat Pengiriman</div>
                        <div className="text-sm text-muted-foreground">
                          {order.delivery_address || '-'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <CreditCard className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      <div>
                        <div className="text-sm font-medium">Metode Pembayaran</div>
                        <div className="text-sm text-muted-foreground">
                          {getPaymentMethodLabel(order.payment_method)}
                        </div>
                      </div>
                    </div>
                    {order.notes && (
                      <div className="flex items-start gap-2">
                        <FileText className="h-4 w-4 mt-0.5 text-muted-foreground" />
                        <div>
                          <div className="text-sm font-medium">Catatan</div>
                          <div className="text-sm text-muted-foreground">
                            {order.notes}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Payment Info */}
                  {order.payment_method === 'QRIS' && (
                    <div className="mt-4 space-y-3">
                      {order.payment_proof_url ? (
                        <div className="space-y-2">
                          <p className="text-sm font-medium">Bukti Pembayaran</p>
                          <div className="relative w-full h-64 border rounded-lg overflow-hidden bg-muted">
                            <Image
                              src={order.payment_proof_url}
                              alt="Bukti pembayaran"
                              fill
                              className="object-contain"
                            />
                          </div>
                          {order.payment_proof_uploaded_at && (
                            <p className="text-xs text-muted-foreground">
                              Diupload: {format(new Date(order.payment_proof_uploaded_at), 'dd MMM yyyy HH:mm', { locale: id })}
                            </p>
                          )}
                        </div>
                      ) : (
                        <Alert>
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription className="text-xs">
                            Menunggu pelanggan mengupload bukti pembayaran QRIS.
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  {order.status !== 'selesai' && order.status !== 'dibatalkan' && (
                    <div className="pt-4 border-t space-y-3">
                      {order.status === 'pending' && (
                        <div className="flex gap-2 flex-wrap">
                          <ProposeAdditionalFeeButton
                            orderId={order.id}
                            currentTotal={order.final_total}
                          />
                        </div>
                      )}
                      <UpdateOrderStatusButton
                        orderId={order.id}
                        currentStatus={order.status}
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
}

