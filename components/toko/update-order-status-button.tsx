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
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;

      toast({
        title: 'Status diperbarui',
        description: `Pesanan telah diupdate menjadi ${getStatusLabel(newStatus)}`,
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

  if (nextStatuses.length === 0) {
    return null;
  }

  return (
    <div className="flex gap-2">
      {nextStatuses.map((status) => (
        <Button
          key={status}
          onClick={() => handleUpdateStatus(status)}
          disabled={loading === status}
          variant={status === 'dibatalkan' ? 'destructive' : 'default'}
        >
          {loading === status ? 'Memproses...' : getStatusLabel(status)}
        </Button>
      ))}
    </div>
  );
}

