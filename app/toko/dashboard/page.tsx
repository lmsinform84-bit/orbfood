import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Package, ShoppingBag, TrendingUp, Store } from 'lucide-react';

async function getStore(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('stores')
    .select('*')
    .eq('user_id', userId)
    .single();

  return data;
}

async function getStats(storeId: string) {
  const supabase = await createClient();
  
  const [ordersResult, productsResult, pendingOrdersResult, todayRevenueResult] = await Promise.all([
    supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('store_id', storeId),
    supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('store_id', storeId),
    supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('store_id', storeId)
      .eq('status', 'pending'),
    supabase
      .from('orders')
      .select('final_total')
      .eq('store_id', storeId)
      .eq('status', 'selesai')
      .gte('created_at', new Date().toISOString().split('T')[0]),
  ]);

  const todayRevenue = todayRevenueResult.data?.reduce((sum, order) => sum + order.final_total, 0) || 0;

  return {
    totalOrders: ordersResult.count || 0,
    totalProducts: productsResult.count || 0,
    pendingOrders: pendingOrdersResult.count || 0,
    todayRevenue,
  };
}

export default async function TokoDashboardPage() {
  const user = await requireAuth();
  const store = await getStore(user.id);
  const stats = store ? await getStats(store.id) : null;

  if (!store) {
    return (
      <div>
        <Card>
          <CardHeader>
            <CardTitle>Belum Ada Profil Toko</CardTitle>
            <CardDescription>
              Buat profil toko Anda terlebih dahulu untuk mulai menggunakan platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/toko/settings">
              <Button>Buat Profil Toko</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500">Disetujui</Badge>;
      case 'pending':
        return <Badge variant="secondary">Menunggu Persetujuan</Badge>;
      case 'suspended':
        return <Badge variant="destructive">Ditangguhkan</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Ditolak</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold">{store.name}</h1>
          {getStatusBadge(store.status)}
        </div>
        <p className="text-muted-foreground">{store.description || 'Toko makanan terpercaya'}</p>
      </div>

      {store.status !== 'approved' && (
        <Card className="mb-6 border-yellow-500">
          <CardContent className="pt-6">
            <p className="text-yellow-600 dark:text-yellow-400">
              {store.status === 'pending'
                ? 'Toko Anda sedang menunggu persetujuan admin. Anda dapat mengatur menu dan pengaturan sambil menunggu.'
                : 'Toko Anda saat ini tidak aktif. Silakan hubungi admin untuk informasi lebih lanjut.'}
            </p>
          </CardContent>
        </Card>
      )}

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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
              <CardTitle className="text-sm font-medium">Menu</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalProducts}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pesanan Pending</CardTitle>
              <Store className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingOrders}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendapatan Hari Ini</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                Rp {stats.todayRevenue.toLocaleString('id-ID')}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Menu</CardTitle>
            <CardDescription>Kelola menu dan produk Anda</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/toko/menu">
              <Button className="w-full">Kelola Menu</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pesanan</CardTitle>
            <CardDescription>Lihat dan kelola pesanan masuk</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/toko/orders">
              <Button className="w-full">Kelola Pesanan</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

