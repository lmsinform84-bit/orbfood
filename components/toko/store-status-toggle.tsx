'use client';

import { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { toast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface StoreStatusToggleProps {
  storeId: string;
  isOpen: boolean;
}

export function StoreStatusToggle({ storeId, isOpen: initialIsOpen }: StoreStatusToggleProps) {
  const [isOpen, setIsOpen] = useState(initialIsOpen);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleToggle = async (checked: boolean) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('stores')
        .update({ is_open: checked })
        .eq('id', storeId);

      if (error) throw error;

      setIsOpen(checked);
      router.refresh();
      toast({
        title: checked ? 'Toko dibuka' : 'Toko ditutup',
        description: checked
          ? 'Toko Anda sekarang dapat menerima pesanan'
          : 'Toko Anda sekarang tidak menerima pesanan',
      });
    } catch (error: any) {
      console.error('Error updating store status:', error);
      toast({
        title: 'Gagal mengubah status',
        description: error.message || 'Terjadi kesalahan saat mengubah status toko',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
      <div className="flex items-center gap-2">
        <Switch
          id="store-status"
          checked={isOpen}
          onCheckedChange={handleToggle}
          disabled={loading}
        />
        <Label
          htmlFor="store-status"
          className={`font-semibold cursor-pointer ${isOpen ? 'text-green-600 dark:text-green-400' : 'text-gray-500'}`}
        >
          {isOpen ? '● BUKA' : '○ TUTUP'}
        </Label>
      </div>
    </div>
  );
}

