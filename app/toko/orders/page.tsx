import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { id } from 'date-fns/locale/id';
import { UpdateOrderStatusButton } from '@/components/toko/update-order-status-button';
import { OrderStatus } from '@/types/database';

async function getStore(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('stores')
    .select('id')
    .eq('user_id', userId)
    .single();

  return data;
}

async function getOrders(storeId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      user:users(id, full_name, phone),
      items:order_items(
        *,
        product:products(id, name)
      )
    `)
    .eq('store_id', storeId)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    console.error('Error fetching orders:', error);
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
    case 'diproses':
      return 'Diproses';
    case 'selesai':
      return 'Selesai';
    case 'dibatalkan':
      return 'Dibatalkan';
    default:
      return status;
  }
};

export default async function OrdersPage() {
  const user = await requireAuth();
  const store = await getStore(user.id);

  if (!store) {
    return (
      <div>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              Anda perlu membuat profil toko terlebih dahulu.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const orders = await getOrders(store.id);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Pesanan Masuk</h1>

      {orders.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Belum ada pesanan masuk.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((order: any) => (
            <Card key={order.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="mb-2">
                      Pesanan dari {order.user?.full_name || 'Pelanggan'}
                    </CardTitle>
                    <CardDescription>
                      {format(new Date(order.created_at), 'dd MMMM yyyy, HH:mm', { locale: id })}
                    </CardDescription>
                  </div>
                  <Badge variant={getStatusBadgeVariant(order.status)}>
                    {getStatusLabel(order.status)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Items:</h4>
                    <div className="space-y-1">
                      {order.items?.map((item: any) => (
                        <div key={item.id} className="flex justify-between text-sm">
                          <span>
                            {item.product?.name || 'Produk'} x {item.quantity}
                          </span>
                          <span>Rp {item.subtotal.toLocaleString('id-ID')}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <div className="flex justify-between items-center mb-2">
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

                    <div className="space-y-2 text-sm">
                      {order.delivery_address && (
                        <div>
                          <strong>Alamat:</strong> {order.delivery_address}
                        </div>
                      )}
                      {order.user?.phone && (
                        <div>
                          <strong>Telepon:</strong> {order.user.phone}
                        </div>
                      )}
                      {order.notes && (
                        <div>
                          <strong>Catatan:</strong> {order.notes}
                        </div>
                      )}
                    </div>
                  </div>

                  {order.status !== 'selesai' && order.status !== 'dibatalkan' && (
                    <div className="pt-4 border-t">
                      <UpdateOrderStatusButton orderId={order.id} currentStatus={order.status} />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

