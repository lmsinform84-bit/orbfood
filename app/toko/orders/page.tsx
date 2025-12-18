import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth';
import { Card, CardContent } from '@/components/ui/card';
import { OrdersList } from '@/components/toko/orders-list';

async function getStore(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('stores')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching store:', error);
    return null;
  }

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
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl md:text-3xl font-bold mb-6">Pesanan Masuk</h1>
      <OrdersList orders={orders} />
    </div>
  );
}

