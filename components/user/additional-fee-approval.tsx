'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

interface AdditionalFeeApprovalProps {
  orderId: string;
  currentTotal: number;
  additionalFee: number;
  note: string | null;
}

export function AdditionalFeeApproval({
  orderId,
  currentTotal,
  additionalFee,
  note,
}: AdditionalFeeApprovalProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const newTotal = currentTotal + additionalFee;

  const handleApprove = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/orders/approve-additional-fee', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId,
          approved: true,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to approve additional fee');
      }

      toast({
        title: 'Ongkir tambahan disetujui',
        description: 'Pesanan akan diproses oleh toko',
      });

      router.refresh();
    } catch (error: any) {
      toast({
        title: 'Gagal menyetujui',
        description: error.message || 'Terjadi kesalahan',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/orders/approve-additional-fee', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId,
          approved: false,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reject additional fee');
      }

      toast({
        title: 'Pesanan dibatalkan',
        description: 'Anda telah menolak ongkir tambahan',
      });

      router.refresh();
    } catch (error: any) {
      toast({
        title: 'Gagal membatalkan',
        description: error.message || 'Terjadi kesalahan',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="mb-6 border-orange-500">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-700">
          <AlertCircle className="h-5 w-5" />
          Toko Mengajukan Ongkir Tambahan
        </CardTitle>
        <CardDescription>
          Toko mengajukan ongkir tambahan untuk pesanan Anda. Silakan setujui atau tolak.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {note && (
          <Alert className="bg-orange-50 border-orange-200">
            <AlertCircle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-sm text-orange-700">
              <strong>Catatan toko:</strong> {note}
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-2 p-4 bg-muted rounded-lg">
          <div className="flex justify-between text-sm">
            <span>Total Awal:</span>
            <span>Rp {currentTotal.toLocaleString('id-ID')}</span>
          </div>
          <div className="flex justify-between text-sm text-orange-600">
            <span>Tambahan Ongkir:</span>
            <span>+ Rp {additionalFee.toLocaleString('id-ID')}</span>
          </div>
          <div className="flex justify-between font-bold text-lg pt-2 border-t">
            <span>Total Baru:</span>
            <span className="text-primary">Rp {newTotal.toLocaleString('id-ID')}</span>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            onClick={handleApprove}
            disabled={loading}
            className="flex-1"
            variant="default"
          >
            {loading ? (
              'Memproses...'
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Setujui & Lanjutkan
              </>
            )}
          </Button>
          <Button
            onClick={handleReject}
            disabled={loading}
            className="flex-1"
            variant="destructive"
          >
            {loading ? (
              'Memproses...'
            ) : (
              <>
                <XCircle className="h-4 w-4 mr-2" />
                Batalkan Pesanan
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

