import { createAdminClient } from '@/lib/supabase/admin-server';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Store, ShoppingBag, TrendingUp } from 'lucide-react';
import { PendingStoresList } from '@/components/admin/pending-stores-list';

async function getStats() {
  const supabase = createAdminClient();

  const [usersResult, storesResult, ordersResult, revenueResult] = await Promise.all([
    supabase.from('users').select('id', { count: 'exact', head: true }),
    supabase.from('stores').select('id', { count: 'exact', head: true }),
    supabase.from('orders').select('id', { count: 'exact', head: true }),
    supabase
      .from('orders')
      .select('final_total')
      .eq('status', 'selesai'),
  ]);

  const totalRevenue =
    revenueResult.data?.reduce((sum, order) => sum + order.final_total, 0) || 0;

  return {
    totalUsers: usersResult.count || 0,
    totalStores: storesResult.count || 0,
    totalOrders: ordersResult.count || 0,
    totalRevenue,
  };
}

async function getRecentOrders() {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from('orders')
    .select(`
      *,
      store:stores(id, name),
      user:users(id, full_name)
    `)
    .order('created_at', { ascending: false })
    .limit(10);

  return data || [];
}

async function getPendingStores() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('stores')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(10); // Increase limit untuk melihat lebih banyak

  if (error) {
    console.error('❌ Error fetching pending stores:', error);
    return [];
  }

  // Debug logging (hanya di development)
  if (process.env.NODE_ENV === 'development') {
    console.log('📊 Pending stores found:', data?.length || 0);
    if (data && data.length > 0) {
      console.log('📋 Stores:', data.map(s => ({ id: s.id, name: s.name, status: s.status })));
    }
  }

  return data || [];
}

export default async function AdminDashboardPage() {
  const stats = await getStats();
  const recentOrders = await getRecentOrders();
  const pendingStores = await getPendingStores();

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Dashboard Admin</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pengguna</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Toko</CardTitle>
            <Store className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStores}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pesanan</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOrders}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pendapatan</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              Rp {stats.totalRevenue.toLocaleString('id-ID')}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Toko Menunggu Persetujuan</CardTitle>
            <CardDescription>
              {pendingStores.length} toko menunggu persetujuan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PendingStoresList initialStores={pendingStores} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pesanan Terbaru</CardTitle>
            <CardDescription>10 pesanan terakhir</CardDescription>
          </CardHeader>
          <CardContent>
            {recentOrders.length === 0 ? (
              <p className="text-muted-foreground text-sm">Belum ada pesanan</p>
            ) : (
              <div className="space-y-2">
                {recentOrders.map((order: any) => (
                  <div key={order.id} className="flex items-center justify-between p-2 border rounded">
                    <div>
                      <p className="font-medium">{order.store?.name || 'Toko'}</p>
                      <p className="text-sm text-muted-foreground">
                        {order.user?.full_name || 'Pelanggan'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">Rp {order.final_total.toLocaleString('id-ID')}</p>
                      <p className="text-sm text-muted-foreground">{order.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

