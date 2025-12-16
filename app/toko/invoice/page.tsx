import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth';
import { InvoiceSection } from '@/components/toko/invoice-section';
import { Card, CardContent } from '@/components/ui/card';
import { FileText } from 'lucide-react';

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

async function getCompletedOrders(storeId: string, startDate: string, endDate: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      items:order_items(
        *,
        product:products(
          id,
          name
        )
      )
    `)
    .eq('store_id', storeId)
    .eq('status', 'selesai')
    .gte('created_at', startDate)
    .lte('created_at', endDate)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching orders:', error);
    console.error('Error details:', {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });
    return [];
  }

  return data || [];
}

export default async function InvoicePage({
  searchParams,
}: {
  searchParams: { period?: string };
}) {
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

  // Get all completed orders (filtering by period will be done client-side)
  // Get orders from last 90 days to ensure we have enough data for all period filters
  const now = new Date();
  const startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString(); // Last 90 days
  const endDate = now.toISOString();
  const orders = await getCompletedOrders(store.id, startDate, endDate);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <FileText className="h-6 w-6 text-primary" />
          <h1 className="text-2xl md:text-3xl font-bold">Invoice & Pembayaran</h1>
        </div>
        <p className="text-muted-foreground">
          Lihat invoice dan bayar tagihan fee ke ORBfood
        </p>
      </div>

      <InvoiceSection
        orders={orders}
        storeName={store.name}
        storeId={store.id}
        orbQrisUrl={(store as any).orb_qris_url || null}
      />
    </div>
  );
}

