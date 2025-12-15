'use client';

import { useState, useEffect, useTransition } from 'react';
import { PendingStoreItem } from './pending-store-item';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Store {
  id: string;
  name: string;
  address: string;
  description?: string;
  phone?: string;
  email?: string;
  status: string;
}

interface PendingStoresListProps {
  initialStores: Store[];
}

export function PendingStoresList({ initialStores }: PendingStoresListProps) {
  const router = useRouter();
  const [stores, setStores] = useState<Store[]>(initialStores);
  const [refreshing, setRefreshing] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      // Fetch fresh data from API
      const response = await fetch('/api/stores/pending', { 
        cache: 'no-store',
        next: { revalidate: 0 }
      });
      if (response.ok) {
        const data = await response.json();
        setStores(data.stores || []);
      }
      // Use startTransition for router refresh (non-blocking)
      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      console.error('Error refreshing stores:', error);
      // Fallback: just refresh router
      startTransition(() => {
        router.refresh();
      });
    } finally {
      setRefreshing(false);
    }
  };

  const handleStoreUpdate = () => {
    // Refresh the list without full page reload
    handleRefresh();
  };

  // Update stores when initialStores changes (from server refresh)
  useEffect(() => {
    setStores(initialStores);
  }, [initialStores]);

  if (stores.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground text-sm">Tidak ada toko yang menunggu persetujuan</p>
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
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm text-muted-foreground">
          {stores.length} toko menunggu persetujuan
        </span>
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
      {stores.map((store) => (
        <PendingStoreItem
          key={store.id}
          store={store}
          onUpdate={handleStoreUpdate}
        />
      ))}
    </div>
  );
}
