'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Package } from 'lucide-react';

interface ProposeAdditionalFeeButtonProps {
  orderId: string;
  currentTotal: number;
}

export function ProposeAdditionalFeeButton({ orderId, currentTotal }: ProposeAdditionalFeeButtonProps) {
  const [open, setOpen] = useState(false);
  const [additionalFee, setAdditionalFee] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handlePropose = async () => {
    if (!additionalFee || parseFloat(additionalFee) <= 0) {
      toast({
        title: 'Ongkir tambahan tidak valid',
        description: 'Masukkan nilai ongkir tambahan yang valid',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/orders/propose-additional-fee', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId,
          additionalFee: parseFloat(additionalFee),
          note: note.trim() || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to propose additional fee');
      }

      toast({
        title: 'Ongkir tambahan diajukan',
        description: 'Menunggu persetujuan pelanggan',
      });

      setOpen(false);
      setAdditionalFee('');
      setNote('');
      router.refresh();
    } catch (error: any) {
      toast({
        title: 'Gagal mengajukan ongkir tambahan',
        description: error.message || 'Terjadi kesalahan',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const newTotal = currentTotal + (parseFloat(additionalFee) || 0);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Package className="h-4 w-4 mr-2" />
          Ajukan Ongkir Tambahan
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ajukan Ongkir Tambahan</DialogTitle>
          <DialogDescription>
            Ajukan ongkir tambahan jika alamat pengantaran agak jauh. Pelanggan akan diminta persetujuan.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="additionalFee">Tambahan Ongkir (Rp) *</Label>
            <Input
              id="additionalFee"
              type="number"
              min="0"
              step="1000"
              value={additionalFee}
              onChange={(e) => setAdditionalFee(e.target.value)}
              placeholder="Contoh: 5000"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="note">Catatan untuk Pelanggan</Label>
            <Textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Contoh: Alamat agak jauh ya kak"
              rows={3}
            />
          </div>
          {additionalFee && parseFloat(additionalFee) > 0 && (
            <div className="p-3 bg-muted rounded-lg">
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span>Total Awal:</span>
                  <span>Rp {currentTotal.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tambahan Ongkir:</span>
                  <span>+ Rp {parseFloat(additionalFee).toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between font-bold pt-2 border-t">
                  <span>Total Baru:</span>
                  <span className="text-primary">Rp {newTotal.toLocaleString('id-ID')}</span>
                </div>
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Batal
          </Button>
          <Button onClick={handlePropose} disabled={loading}>
            {loading ? 'Mengajukan...' : 'Ajukan'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

