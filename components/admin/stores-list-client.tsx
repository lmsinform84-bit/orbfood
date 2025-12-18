'use client';

import { useState, useEffect, useTransition } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UpdateStoreStatusButton } from './update-store-status-button';
import { StoreStatus } from '@/types/database';
import { Button } from '@/components/ui/button';
import { RefreshCw, Eye } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface Store {
  id: string;
  name: string;
  description: string | null;
  address: string;
  phone: string | null;
  email: string | null;
  status: StoreStatus;
  user: {
    id: string;
    full_name: string | null;
    email: string;
  } | null;
  area?: {
    id: string;
    name: string;
  } | null;
  order_count?: number;
  total_fee?: number;
}

interface StoresListClientProps {
  initialStores: Store[];
}

const getStatusBadge = (status: StoreStatus) => {
  switch (status) {
    case 'approved':
      return <Badge className="bg-green-500">Aktif</Badge>;
    case 'pending':
      return <Badge variant="secondary">Pending</Badge>;
    case 'suspended':
      return <Badge variant="destructive">Suspended</Badge>;
    case 'rejected':
      return <Badge variant="destructive">Rejected</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
};

export function StoresListClient({ initialStores }: StoresListClientProps) {
  const router = useRouter();
  const [stores, setStores] = useState<Store[]>(initialStores);
  const [refreshing, setRefreshing] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const response = await fetch('/api/stores/all', {
        cache: 'no-store',
        next: { revalidate: 0 }
      });
      if (response.ok) {
        const data = await response.json();
        setStores(data.stores || []);
      }
      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      console.error('Error refreshing stores:', error);
      startTransition(() => {
        router.refresh();
      });
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    setStores(initialStores);
  }, [initialStores]);

  if (stores.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Belum ada toko yang terdaftar.</p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing || isPending}
            className="mt-4"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${(refreshing || isPending) ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing || isPending}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${(refreshing || isPending) ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Wilayah</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-center">Order</TableHead>
                <TableHead className="text-right">Fee</TableHead>
                <TableHead className="text-center w-[150px]">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
        {stores.map((store) => (
                <TableRow key={store.id}>
                  <TableCell className="font-semibold">{store.name}</TableCell>
                  <TableCell>{store.area?.name || '-'}</TableCell>
                  <TableCell>{getStatusBadge(store.status)}</TableCell>
                  <TableCell className="text-center">{store.order_count || 0}</TableCell>
                  <TableCell className="text-right">
                    {store.total_fee ? `Rp ${store.total_fee.toLocaleString('id-ID')}` : '-'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-2">
                      <Link href={`/admin/stores/${store.id}`}>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
              <UpdateStoreStatusButton 
                key={`${store.id}-${store.status}`} 
                storeId={store.id} 
                currentStatus={store.status} 
              />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
            </CardContent>
          </Card>
    </div>
  );
}
