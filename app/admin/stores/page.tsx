export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { createAdminClient } from '@/lib/supabase/admin-server';
import { StoresListClient } from '@/components/admin/stores-list-client';

async function getStores() {
  const supabase = createAdminClient();
  
  // Fetch all stores with user and area info
  const { data, error } = await supabase
    .from('stores')
    .select(`
      *,
      user:users(id, full_name, email),
      area:areas(id, name)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Error fetching stores:', error);
    return [];
  }

  // Get order counts and fees for each store
  const storesWithStats = await Promise.all(
    (data || []).map(async (store: any) => {
      // Get completed orders count
      const { count: orderCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('store_id', store.id)
        .eq('status', 'selesai');

      // Get active period
      const { data: activePeriod } = await supabase
        .from('store_periods')
        .select('id, start_date, end_date')
        .eq('store_id', store.id)
        .eq('is_active', true)
        .single();

      // Get completed orders that don't have invoices yet (unpaid orders in active period)
      const { data: completedOrders } = await supabase
        .from('orders')
        .select('id, final_total')
        .eq('store_id', store.id)
        .eq('status', 'selesai');

      // Get order IDs that already have invoices
      const orderIds = completedOrders?.map(o => o.id) || [];
      const { data: existingInvoices } = await supabase
        .from('invoices')
        .select('order_id')
        .in('order_id', orderIds);

      const existingOrderIds = new Set(existingInvoices?.map(inv => inv.order_id) || []);
      const unpaidOrders = (completedOrders || []).filter(o => !existingOrderIds.has(o.id));

      // Calculate estimated fee from unpaid orders in active period
      const estimatedRevenue = unpaidOrders.reduce((sum, o) => sum + (o.final_total || 0), 0);
      const totalFee = estimatedRevenue * 0.05;

      return {
        ...store,
        order_count: orderCount || 0,
        total_fee: totalFee,
      };
    })
  );

  return storesWithStats;
}

export default async function AdminStoresPage() {
  const stores = await getStores();

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Kelola Toko</h1>
      <StoresListClient initialStores={stores} />
    </div>
  );
}

