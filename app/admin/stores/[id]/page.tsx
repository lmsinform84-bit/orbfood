export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { createAdminClient } from '@/lib/supabase/admin-server';
import { redirect } from 'next/navigation';
import { StoreDetailClient } from '@/components/admin/store-detail-client';
import { Card, CardContent } from '@/components/ui/card';

async function getStore(storeId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('stores')
    .select(`
      *,
      user:users(id, full_name, email),
      area:areas(id, name)
    `)
    .eq('id', storeId)
    .single();

  if (error || !data) {
    console.error('Error fetching store:', error);
    return null;
  }

  return data;
}

async function getStoreStats(storeId: string) {
  const supabase = createAdminClient();
  
  // Get orders stats
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const [todayOrders, monthOrders, allOrders] = await Promise.all([
    supabase
      .from('orders')
      .select('final_total', { count: 'exact' })
      .eq('store_id', storeId)
      .eq('status', 'selesai')
      .gte('created_at', todayStart),
    supabase
      .from('orders')
      .select('final_total', { count: 'exact' })
      .eq('store_id', storeId)
      .eq('status', 'selesai')
      .gte('created_at', monthStart),
    supabase
      .from('orders')
      .select('final_total')
      .eq('store_id', storeId)
      .eq('status', 'selesai'),
  ]);

  const todayCount = todayOrders.count || 0;
  const monthCount = monthOrders.count || 0;
  const todayRevenue = todayOrders.data?.reduce((sum, o) => sum + o.final_total, 0) || 0;
  const monthRevenue = monthOrders.data?.reduce((sum, o) => sum + o.final_total, 0) || 0;

  // Get active period and calculate estimated fee from unpaid orders
  const { data: activePeriod } = await supabase
    .from('store_periods')
    .select('id, start_date, end_date')
    .eq('store_id', storeId)
    .eq('is_active', true)
    .single();

  // Get completed orders that don't have invoices yet
  const orderIds = allOrders.data?.map(o => o.id) || [];
  const { data: existingInvoices } = await supabase
    .from('invoices')
    .select('order_id')
    .in('order_id', orderIds);

  const existingOrderIds = new Set(existingInvoices?.map(inv => inv.order_id) || []);
  const unpaidOrders = (allOrders.data || []).filter((o, idx) => {
    const orderId = orderIds[idx];
    return orderId && !existingOrderIds.has(orderId);
  });

  // Calculate estimated fee from unpaid orders in active period
  const estimatedRevenue = unpaidOrders.reduce((sum, o) => sum + (o.final_total || 0), 0);
  const totalFee = estimatedRevenue * 0.05;

  const allTimeCount = allOrders.data?.length || 0;

  return {
    todayOrders: todayCount,
    monthOrders: monthCount,
    todayRevenue,
    monthRevenue,
    totalFee,
    allTimeOrders: allTimeCount,
  };
}

async function getStoreOrders(storeId: string) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from('orders')
    .select(`
      *,
      user:users(id, full_name),
      items:order_items(
        *,
        product:products(id, name)
      )
    `)
    .eq('store_id', storeId)
    .order('created_at', { ascending: false })
    .limit(50);

  return data || [];
}

async function getStoreCompletedOrders(storeId: string) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from('orders')
    .select(`
      *,
      items:order_items(
        *,
        product:products(id, name)
      )
    `)
    .eq('store_id', storeId)
    .eq('status', 'selesai')
    .order('created_at', { ascending: false })
    .limit(100);

  return data || [];
}

export default async function StoreDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const store = await getStore(params.id);

  if (!store) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Toko tidak ditemukan.</p>
        </CardContent>
      </Card>
    );
  }

  const [stats, orders, completedOrders] = await Promise.all([
    getStoreStats(params.id),
    getStoreOrders(params.id),
    getStoreCompletedOrders(params.id),
  ]);

  return (
    <StoreDetailClient
      store={store}
      stats={stats}
      orders={orders}
      completedOrders={completedOrders}
    />
  );
}

