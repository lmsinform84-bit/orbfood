'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { id } from 'date-fns/locale/id';
import { supabase } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle2, XCircle, RefreshCw } from 'lucide-react';

interface StoreFee {
  store_id: string;
  store_name: string;
  total_fee: number;
  order_count: number;
  period: string;
  status: 'pending' | 'paid';
}

export function FeeMutationList() {
  const [fees, setFees] = useState<StoreFee[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'today' | 'week' | 'month'>('today');
  const { toast } = useToast();

  useEffect(() => {
    fetchFees();
  }, [period]);

  const fetchFees = async () => {
    setLoading(true);
    try {
      // Calculate date range
      const now = new Date();
      let startDate: string;
      
      switch (period) {
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
          break;
        case 'month':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
          break;
        default:
          startDate = new Date(now.setHours(0, 0, 0, 0)).toISOString();
      }

      // Get completed orders grouped by store
      const { data: orders, error } = await supabase
        .from('orders')
        .select(`
          store_id,
          final_total,
          created_at,
          store:stores(name)
        `)
        .eq('status', 'selesai')
        .gte('created_at', startDate)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Group by store and calculate fees
      const storeFeesMap = new Map<string, StoreFee>();
      
      orders?.forEach((order: any) => {
        const fee = order.final_total * 0.05; // 5% fee
        const existing = storeFeesMap.get(order.store_id);
        
        if (existing) {
          existing.total_fee += fee;
          existing.order_count += 1;
        } else {
          storeFeesMap.set(order.store_id, {
            store_id: order.store_id,
            store_name: order.store?.name || 'Toko',
            total_fee: fee,
            order_count: 1,
            period: period,
            status: 'pending', // Default status
          });
        }
      });

      setFees(Array.from(storeFeesMap.values()));
    } catch (error: any) {
      console.error('Error fetching fees:', error);
      toast({
        title: 'Gagal memuat data',
        description: error.message || 'Terjadi kesalahan saat memuat mutasi fee',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (storeId: string, newStatus: 'pending' | 'paid') => {
    try {
      // TODO: Update status in database
      // For now, just update local state
      setFees((prev) =>
        prev.map((fee) =>
          fee.store_id === storeId ? { ...fee, status: newStatus } : fee
        )
      );

      toast({
        title: 'Status diperbarui',
        description: `Status setoran toko telah diubah menjadi ${newStatus === 'paid' ? 'Diterima' : 'Pending'}`,
      });
    } catch (error: any) {
      toast({
        title: 'Gagal memperbarui status',
        description: error.message || 'Terjadi kesalahan',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Memuat mutasi fee...</p>
        </CardContent>
      </Card>
    );
  }

  // Calculate totals
  const totalFee = fees.reduce((sum, fee) => sum + fee.total_fee, 0);
  const totalOrders = fees.reduce((sum, fee) => sum + fee.order_count, 0);
  const paidCount = fees.filter((f) => f.status === 'paid').length;
  const pendingCount = fees.filter((f) => f.status === 'pending').length;

  return (
    <div className="space-y-4">
      <Tabs value={period} onValueChange={(v) => setPeriod(v as any)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="today">Hari Ini</TabsTrigger>
          <TabsTrigger value="week">7 Hari</TabsTrigger>
          <TabsTrigger value="month">30 Hari</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Summary Cards */}
      {fees.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">Total Toko</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{fees.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">Total Pesanan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalOrders}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">Total Fee</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                Rp {totalFee.toLocaleString('id-ID')}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <div className="text-sm">
                  <span className="text-green-600 font-semibold">{paidCount}</span> Diterima
                </div>
                <div className="text-sm">
                  <span className="text-orange-600 font-semibold">{pendingCount}</span> Pending
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {fees.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Belum ada mutasi fee untuk periode ini.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {fees.map((fee) => (
            <Card key={fee.store_id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-base truncate">{fee.store_name}</h3>
                      <Badge 
                        variant={fee.status === 'paid' ? 'default' : 'destructive'}
                        className="text-xs shrink-0"
                      >
                        {fee.status === 'paid' ? 'Diterima' : 'Pending'}
                  </Badge>
                </div>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                      <span>{fee.order_count} pesanan</span>
                      <span>•</span>
                      <span className="font-semibold text-primary">
                      Rp {fee.total_fee.toLocaleString('id-ID')}
                    </span>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {fee.status === 'pending' ? (
                    <Button
                        variant="default"
                      size="sm"
                      onClick={() => handleUpdateStatus(fee.store_id, 'paid')}
                        className="h-9"
                    >
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        Terima
                    </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUpdateStatus(fee.store_id, 'pending')}
                        className="h-9"
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Batalkan
                      </Button>
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

