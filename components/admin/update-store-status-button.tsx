'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { StoreStatus } from '@/types/database';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface UpdateStoreStatusButtonProps {
  storeId: string;
  currentStatus: StoreStatus;
}

export function UpdateStoreStatusButton({
  storeId,
  currentStatus,
}: UpdateStoreStatusButtonProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<StoreStatus>(currentStatus);

  // Sync status dengan currentStatus prop (untuk refresh setelah update)
  useEffect(() => {
    setStatus(currentStatus);
  }, [currentStatus]);

  const handleUpdateStatus = async (newStatus: StoreStatus) => {
    setLoading(true);
    const previousStatus = status;
    setStatus(newStatus);

    try {
      // Untuk approve/reject, gunakan API route yang sama
      if (newStatus === 'approved' || newStatus === 'rejected') {
        const action = newStatus === 'approved' ? 'approve' : 'reject';
        const response = await fetch('/api/stores/approve', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            storeId,
            action,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || data.message || `Gagal ${action === 'approve' ? 'menyetujui' : 'menolak'} toko`);
        }

        toast({
          title: action === 'approve' ? 'Toko Disetujui' : 'Toko Ditolak',
          description: data.message || `Status toko telah diupdate menjadi ${newStatus}`,
        });
      } else {
        // Untuk status lain (suspended), gunakan API route update status
        const response = await fetch('/api/stores/update-status', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            storeId,
            status: newStatus,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || data.message || 'Gagal memperbarui status');
        }

        toast({
          title: 'Status diperbarui',
          description: `Status toko telah diupdate menjadi ${newStatus}`,
        });
      }

      router.refresh();
    } catch (error: any) {
      toast({
        title: 'Gagal memperbarui status',
        description: error.message || 'Terjadi kesalahan',
        variant: 'destructive',
      });
      setStatus(previousStatus);
    } finally {
      setLoading(false);
    }
  };

  // Debug: log current status
  useEffect(() => {
    console.log(`📋 Store ${storeId}: currentStatus=${currentStatus}, state=${status}`);
  }, [storeId, currentStatus, status]);

  return (
    <div className="flex items-center gap-2">
      <Select value={status} onValueChange={handleUpdateStatus} disabled={loading}>
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Pilih status">
            {status === 'pending' && 'Menunggu'}
            {status === 'approved' && 'Disetujui'}
            {status === 'suspended' && 'Ditangguhkan'}
            {status === 'rejected' && 'Ditolak'}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="pending">Menunggu</SelectItem>
          <SelectItem value="approved">Disetujui</SelectItem>
          <SelectItem value="suspended">Ditangguhkan</SelectItem>
          <SelectItem value="rejected">Ditolak</SelectItem>
        </SelectContent>
      </Select>
      {loading && <span className="text-sm text-muted-foreground">Menyimpan...</span>}
    </div>
  );
}

