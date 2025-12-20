'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { OrderStatus } from '@/types/database';

interface UpdateOrderStatusButtonProps {
  orderId: string;
  currentStatus: OrderStatus;
}

const statusFlow: Record<OrderStatus, OrderStatus[]> = {
  pending: ['diproses', 'dibatalkan'],
  diproses: ['selesai', 'dibatalkan'],
  selesai: [],
  dibatalkan: [],
};

const getStatusLabel = (status: OrderStatus) => {
  switch (status) {
    case 'pending':
      return 'Terima Pesanan';
    case 'diproses':
      return 'Tandai Selesai';
    case 'selesai':
      return 'Selesai';
    case 'dibatalkan':
      return 'Dibatalkan';
    default:
      return status;
  }
};

export function UpdateOrderStatusButton({
  orderId,
  currentStatus,
}: UpdateOrderStatusButtonProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);

  const nextStatuses = statusFlow[currentStatus] || [];

  const handleUpdateStatus = async (newStatus: OrderStatus) => {
    setLoading(newStatus);
    try {
      // Use API endpoint to update status and create invoice if needed
      const response = await fetch('/api/orders/update-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId,
          newStatus,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update order status');
      }

      toast({
        title: 'Status diperbarui',
        description: `Pesanan telah diupdate menjadi ${getStatusLabel(newStatus)}${newStatus === 'selesai' ? '. Invoice telah dibuat otomatis.' : ''}`,
      });

      router.refresh();
    } catch (error: any) {
      toast({
        title: 'Gagal memperbarui status',
        description: error.message || 'Terjadi kesalahan',
        variant: 'destructive',
      });
    } finally {
      setLoading(null);
    }
  };

  // Hapus tombol update status - hanya tampilkan status saja
  return null;
}

