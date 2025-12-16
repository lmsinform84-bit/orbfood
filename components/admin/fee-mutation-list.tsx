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

  return (
    <div className="space-y-4">
      <Tabs value={period} onValueChange={(v) => setPeriod(v as any)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="today">Hari Ini</TabsTrigger>
          <TabsTrigger value="week">7 Hari</TabsTrigger>
          <TabsTrigger value="month">30 Hari</TabsTrigger>
        </TabsList>
      </Tabs>

      {fees.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Belum ada mutasi fee untuk periode ini.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {fees.map((fee) => (
            <Card key={fee.store_id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{fee.store_name}</CardTitle>
                    <CardDescription>
                      {fee.order_count} pesanan • {format(new Date(), 'dd MMMM yyyy', { locale: id })}
                    </CardDescription>
                  </div>
                  <Badge variant={fee.status === 'paid' ? 'default' : 'destructive'}>
                    {fee.status === 'paid' ? 'Diterima' : 'Belum'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total Fee ORB (5%)</span>
                    <span className="text-xl font-bold text-primary">
                      Rp {fee.total_fee.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="flex gap-2 pt-2 border-t">
                    <Button
                      variant={fee.status === 'paid' ? 'outline' : 'default'}
                      size="sm"
                      className="flex-1"
                      onClick={() => handleUpdateStatus(fee.store_id, 'paid')}
                      disabled={fee.status === 'paid'}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Tandai Diterima
                    </Button>
                    {fee.status === 'paid' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUpdateStatus(fee.store_id, 'pending')}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
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

