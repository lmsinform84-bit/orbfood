import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { format } from 'date-fns';
import { id } from 'date-fns/locale/id';
import { OrderStatus } from '@/types/database';
import { ArrowLeft, Home, History } from 'lucide-react';
import { UserHeader } from '@/components/user/user-header';

async function getActiveOrders(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      store:stores(id, name),
      items:order_items(
        *,
        product:products(id, name, image_url)
      )
    `)
    .eq('user_id', userId)
    .in('status', ['pending', 'diproses', 'diantar'])
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching active orders:', error);
    return [];
  }

  return data || [];
}

const getStatusBadgeVariant = (status: OrderStatus) => {
  switch (status) {
    case 'pending':
      return 'default';
    case 'diproses':
      return 'secondary';
    case 'diantar':
      return 'secondary';
    default:
      return 'default';
  }
};

const getStatusLabel = (status: OrderStatus) => {
  switch (status) {
    case 'pending':
      return 'Menunggu Konfirmasi Toko';
    case 'diproses':
      return 'Pesanan Sedang Disiapkan';
    case 'diantar':
      return '🚚 Pesanan Sedang Diantar';
    default:
      return status;
  }
};

export default async function MyOrdersPage() {
  const user = await requireAuth();
  const orders = await getActiveOrders(user.id);

  return (
    <div className="min-h-screen bg-background">
      <UserHeader />
      <div className="container mx-auto px-4 py-6">
        {/* Navigation */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link href="/user/home">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Kembali
              </Button>
            </Link>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              Pesanan Anda
            </h1>
          </div>
          <Link href="/user/orders">
            <Button variant="outline" size="sm" className="gap-2">
              <History className="h-4 w-4" />
              <span className="hidden sm:inline">Riwayat Pesanan</span>
              <span className="sm:hidden">Riwayat</span>
            </Button>
          </Link>
        </div>

        {orders.length === 0 ? (
          <Card className="rounded-2xl border">
            <CardContent className="py-12 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="bg-muted rounded-full p-4">
                  <History className="h-12 w-12 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-1">
                    Tidak ada pesanan aktif
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Semua pesanan Anda sudah selesai
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2 justify-center">
                    <Link href="/user/home">
                      <Button className="gap-2">
                        <Home className="h-4 w-4" />
                        Kembali ke Beranda
                      </Button>
                    </Link>
                    <Link href="/user/orders">
                      <Button variant="outline" className="gap-2">
                        <History className="h-4 w-4" />
                        Lihat Riwayat
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order: any) => (
              <Link key={order.id} href={`/user/orders/${order.id}`}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer rounded-2xl border">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="mb-2">{order.store?.name || 'Toko'}</CardTitle>
                        <CardDescription>
                          {format(new Date(order.created_at), 'dd MMMM yyyy, HH:mm', { locale: id })}
                        </CardDescription>
                      </div>
                      <Badge 
                        variant={getStatusBadgeVariant(order.status)}
                        className="bg-green-500 text-white border-0"
                      >
                        {getStatusLabel(order.status)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 mb-4">
                      {order.items?.map((item: any) => (
                        <div key={item.id} className="flex justify-between text-sm">
                          <span>
                            {item.product?.name || 'Produk'} x {item.quantity}
                          </span>
                          <span>Rp {item.subtotal.toLocaleString('id-ID')}</span>
                        </div>
                      ))}
                    </div>
                    <div className="pt-4 border-t">
                      <div className="flex justify-between items-center">
                        <div className="text-sm text-muted-foreground">
                          <div>Subtotal: Rp {order.total_price.toLocaleString('id-ID')}</div>
                          {order.delivery_fee > 0 && (
                            <div>Ongkir: Rp {order.delivery_fee.toLocaleString('id-ID')}</div>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-muted-foreground">Total</div>
                          <div className="text-xl font-bold text-primary">
                            Rp {order.final_total.toLocaleString('id-ID')}
                          </div>
                        </div>
                      </div>
                      {order.delivery_address && (
                        <div className="mt-2 text-sm text-muted-foreground">
                          <strong>Alamat:</strong> {order.delivery_address}
                        </div>
                      )}
                      {order.notes && (
                        <div className="mt-2 text-sm text-muted-foreground">
                          <strong>Catatan:</strong> {order.notes}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

