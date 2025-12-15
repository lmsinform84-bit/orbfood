'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Check, X, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface PendingStoreItemProps {
  store: {
    id: string;
    name: string;
    address: string;
    description?: string;
    phone?: string;
    email?: string;
    status: string;
  };
  onUpdate: () => void;
}

export function PendingStoreItem({ store, onUpdate }: PendingStoreItemProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState<'approve' | 'reject' | null>(null);

  const handleAction = async (action: 'approve' | 'reject') => {
    setLoading(action);

    try {
      const response = await fetch('/api/stores/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          storeId: store.id,
          action,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data.error || data.message || `Gagal ${action === 'approve' ? 'menyetujui' : 'menolak'} toko`;
        console.error('❌ API Error:', {
          status: response.status,
          error: data.error,
          message: data.message,
          details: data.details,
        });
        throw new Error(errorMessage);
      }

      // Check for warning
      if (data.warning) {
        toast({
          title: action === 'approve' ? 'Toko Disetujui (dengan peringatan)' : 'Toko Ditolak',
          description: data.message,
          variant: 'default',
        });
        console.warn('⚠️ Warning from API:', data);
      } else {
        toast({
          title: action === 'approve' ? 'Toko Disetujui' : 'Toko Ditolak',
          description: data.message,
        });
      }

      // Refresh data via callback (tidak reload page)
      onUpdate();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Terjadi kesalahan',
        variant: 'destructive',
      });
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
      <div className="flex-1">
        <p className="font-medium">{store.name}</p>
        <p className="text-sm text-muted-foreground line-clamp-1">{store.address}</p>
        {store.description && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{store.description}</p>
        )}
        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
          {store.phone && <span>📞 {store.phone}</span>}
          {store.email && <span>✉️ {store.email}</span>}
        </div>
      </div>
      <div className="ml-4 flex items-center gap-2">
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
          Pending
        </span>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="default"
            onClick={() => handleAction('approve')}
            disabled={loading !== null}
            className="bg-green-600 hover:bg-green-700"
          >
            {loading === 'approve' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4" />
            )}
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => handleAction('reject')}
            disabled={loading !== null}
          >
            {loading === 'reject' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <X className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
