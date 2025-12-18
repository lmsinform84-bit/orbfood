import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Package, ShoppingBag, TrendingUp, Store, AlertCircle, Clock } from 'lucide-react';
import { StoreStatusToggle } from '@/components/toko/store-status-toggle';
import { InvoiceNotification } from '@/components/toko/invoice-notification';

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

async function getStats(storeId: string) {
  const supabase = await createClient();
  const today = new Date().toISOString().split('T')[0];
  
  const [ordersResult, pendingOrdersResult, todayRevenueResult] = await Promise.all([
    supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('store_id', storeId)
      .gte('created_at', today),
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
      .gte('created_at', today),
  ]);

  const todayRevenue = todayRevenueResult.data?.reduce((sum, order) => sum + order.final_total, 0) || 0;

  return {
    todayOrders: ordersResult.count || 0,
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
    <div className="max-w-4xl mx-auto">
      {/* Header dengan toggle status */}
      <div className="mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2">
              Halo, {store.name}
            </h1>
          {getStatusBadge(store.status)}
          </div>
          {store.status === 'approved' && (
            <StoreStatusToggle storeId={store.id} isOpen={store.is_open} />
          )}
        </div>
      </div>

      {store.status !== 'approved' && (
        <Card className="mb-6 border-yellow-500">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
            <p className="text-yellow-600 dark:text-yellow-400">
              {store.status === 'pending'
                ? 'Toko Anda sedang menunggu persetujuan admin. Anda dapat mengatur menu dan pengaturan sambil menunggu.'
                : 'Toko Anda saat ini tidak aktif. Silakan hubungi admin untuk informasi lebih lanjut.'}
            </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Invoice Notification */}
      {store.status === 'approved' && <InvoiceNotification storeId={store.id} />}

      {stats && (
        <>
          {/* Statistik Ringkas - Mobile Friendly */}
          <div className="grid grid-cols-2 gap-4 mb-6">
          <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Pesanan Hari Ini
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-3xl font-bold">{stats.todayOrders}</div>
            </CardContent>
          </Card>

          <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Omzet Hari Ini
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold text-primary">
                Rp {stats.todayRevenue.toLocaleString('id-ID')}
              </div>
            </CardContent>
          </Card>
        </div>

          {/* Alert Pesanan Menunggu */}
          {stats.pendingOrders > 0 && (
            <Card className="mb-6 border-orange-500 bg-orange-50 dark:bg-orange-950/20">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400 mt-0.5" />
                    <div>
                      <p className="font-semibold text-orange-900 dark:text-orange-100">
                        {stats.pendingOrders} pesanan menunggu
                      </p>
                      <p className="text-sm text-orange-700 dark:text-orange-300">
                        Silakan proses pesanan yang masuk
                      </p>
                    </div>
                  </div>
                  <Link href="/toko/orders">
                    <Button variant="default" size="sm">
                      Lihat Pesanan
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
      )}

          {/* Shortcut Cards */}
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Menu
                </CardTitle>
            <CardDescription>Kelola menu dan produk Anda</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/toko/menu">
              <Button className="w-full">Kelola Menu</Button>
            </Link>
          </CardContent>
        </Card>

            <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5" />
                  Pesanan
                </CardTitle>
            <CardDescription>Lihat dan kelola pesanan masuk</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/toko/orders">
              <Button className="w-full">Kelola Pesanan</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
        </>
      )}

      {!stats && store.status === 'approved' && (
        <Card>
          <CardContent className="py-12 text-center">
            <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">
              Memuat data dashboard...
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

