import { createAdminClient } from '@/lib/supabase/admin-server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { id } from 'date-fns/locale/id';
import { OrderStatus } from '@/types/database';

async function getOrders() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      store:stores(id, name),
      user:users(id, full_name),
      items:order_items(
        *,
        product:products(id, name)
      )
    `)
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

export default async function AdminOrdersPage() {
  const orders = await getOrders();

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Semua Pesanan</h1>

      {orders.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Belum ada pesanan.</p>
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
                      {order.store?.name || 'Toko'} •{' '}
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
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

