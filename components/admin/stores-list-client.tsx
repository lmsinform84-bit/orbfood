'use client';

import { useState, useEffect, useTransition } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UpdateStoreStatusButton } from './update-store-status-button';
import { StoreStatus } from '@/types/database';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';

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
}

interface StoresListClientProps {
  initialStores: Store[];
}

const getStatusBadge = (status: StoreStatus) => {
  switch (status) {
    case 'approved':
      return <Badge className="bg-green-500">Disetujui</Badge>;
    case 'pending':
      return <Badge variant="secondary">Menunggu</Badge>;
    case 'suspended':
      return <Badge variant="destructive">Ditangguhkan</Badge>;
    case 'rejected':
      return <Badge variant="destructive">Ditolak</Badge>;
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
      // Fetch fresh data
      const response = await fetch('/api/stores/all', {
        cache: 'no-store',
        next: { revalidate: 0 }
      });
      if (response.ok) {
        const data = await response.json();
        setStores(data.stores || []);
      }
      // Also refresh router
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

  // Update stores when initialStores changes
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
      <div className="grid gap-4">
        {stores.map((store) => (
          <Card key={store.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="mb-2">{store.name}</CardTitle>
                  <CardDescription>{store.description || 'Toko makanan terpercaya'}</CardDescription>
                </div>
                {getStatusBadge(store.status)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 mb-4">
                <div className="text-sm">
                  <strong>Alamat:</strong> {store.address}
                </div>
                {store.phone && (
                  <div className="text-sm">
                    <strong>Telepon:</strong> {store.phone}
                  </div>
                )}
                {store.email && (
                  <div className="text-sm">
                    <strong>Email:</strong> {store.email}
                  </div>
                )}
                <div className="text-sm">
                  <strong>Pemilik:</strong> {store.user?.full_name || 'N/A'} (
                  {store.user?.email || 'N/A'})
                </div>
              </div>
              <UpdateStoreStatusButton 
                key={`${store.id}-${store.status}`} 
                storeId={store.id} 
                currentStatus={store.status} 
              />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
