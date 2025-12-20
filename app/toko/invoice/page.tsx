import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth';
import { InvoicePageClient } from '@/components/toko/invoice-page-client';
import { Card, CardContent } from '@/components/ui/card';

async function getStore(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('stores')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching store:', error);
    return null;
  }

  return data;
}

async function getCompletedOrders(storeId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      items:order_items(
        *,
        product:products(id, name, image_url)
      )
    `)
    .eq('store_id', storeId)
    .eq('status', 'selesai')
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    console.error('Error fetching completed orders:', error);
    return [];
  }

  return data || [];
}

export default async function InvoicePage() {
  const user = await requireAuth();
  const store = await getStore(user.id);

  if (!store) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">
              Profil toko tidak ditemukan. Silakan buat profil toko terlebih dahulu di halaman Pengaturan.
            </p>
            <a href="/toko/settings" className="text-primary hover:underline">
              Buka Pengaturan Toko
            </a>
          </CardContent>
        </Card>
      </div>
    );
  }

  const orders = await getCompletedOrders(store.id);

  return (
    <InvoicePageClient
      storeName={store.name}
      storeId={store.id}
      orders={orders}
      orbQrisUrl={(store as any).orb_qris_url || null}
    />
  );
}

