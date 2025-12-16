'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useRouter, useSearchParams } from 'next/navigation';
import { TrendingUp, DollarSign, AlertCircle } from 'lucide-react';

interface Order {
  id: string;
  final_total: number;
  created_at: string;
}

interface InvoiceSummaryProps {
  orders: Order[];
  storeName: string;
}

const ORB_FEE_PERCENTAGE = 0.05; // 5%

export function InvoiceSummary({ orders, storeName }: InvoiceSummaryProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const period = searchParams.get('period') || 'today';

  const summary = useMemo(() => {
    const totalRevenue = orders.reduce((sum, order) => sum + order.final_total, 0);
    const totalFee = totalRevenue * ORB_FEE_PERCENTAGE;
    const unpaidCount = orders.length; // For now, all are unpaid (no payment tracking yet)

    return {
      totalRevenue,
      totalFee,
      unpaidCount,
      orderCount: orders.length,
    };
  }, [orders]);

  const handlePeriodChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === 'today') {
      params.delete('period');
    } else {
      params.set('period', value);
    }
    router.push(`/toko/invoice?${params.toString()}`);
  };

  return (
    <div className="space-y-4 mb-6">
      {/* Period Filter */}
      <Tabs value={period} onValueChange={handlePeriodChange}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="today" className="text-xs sm:text-sm">
            Hari Ini
          </TabsTrigger>
          <TabsTrigger value="week" className="text-xs sm:text-sm">
            7 Hari
          </TabsTrigger>
          <TabsTrigger value="month" className="text-xs sm:text-sm">
            30 Hari
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Omzet</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              Rp {summary.totalRevenue.toLocaleString('id-ID')}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {summary.orderCount} pesanan
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fee ORB (5%)</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              Rp {summary.totalFee.toLocaleString('id-ID')}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Tagihan ke ORBfood
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status Setoran</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Badge variant="destructive" className="text-sm">
              Belum Dibayar
            </Badge>
            <p className="text-xs text-muted-foreground mt-2">
              {summary.unpaidCount} invoice belum dibayar
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

