'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { QrCode, AlertCircle, CheckCircle2 } from 'lucide-react';
import Image from 'next/image';
import { getImageUrl } from '@/lib/utils/image';
import { supabase } from '@/lib/supabase/client';

interface QRISDisplayProps {
  storeId: string;
  amount: number;
  onPaymentConfirmed?: () => void;
}

export function QRISDisplay({ storeId, amount, onPaymentConfirmed }: QRISDisplayProps) {
  const [qrisUrl, setQrisUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);

  useEffect(() => {
    const fetchQRIS = async () => {
      try {
        const { data, error } = await supabase
          .from('stores')
          .select('qris_url')
          .eq('id', storeId)
          .single();

        if (error) throw error;

        if (data?.qris_url) {
          setQrisUrl(data.qris_url);
        }
      } catch (error) {
        console.error('Error fetching QRIS:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchQRIS();
  }, [storeId]);

  const handleConfirmPayment = () => {
    setPaymentConfirmed(true);
    if (onPaymentConfirmed) {
      onPaymentConfirmed();
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">Memuat QRIS...</p>
        </CardContent>
      </Card>
    );
  }

  if (!qrisUrl) {
    return (
      <Card>
        <CardContent className="py-8">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Toko belum mengunggah QRIS. Silakan pilih metode pembayaran lain atau hubungi toko.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <QrCode className="h-5 w-5" />
          QRIS Toko
        </CardTitle>
        <CardDescription>
          Scan QR code berikut untuk melakukan pembayaran
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-center">
          <div className="relative w-64 h-64 bg-white p-4 rounded-lg border-2 border-dashed">
            <Image
              src={getImageUrl(qrisUrl, 'medium') || qrisUrl}
              alt="QRIS Toko"
              fill
              className="object-contain"
            />
          </div>
        </div>

        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">Total Pembayaran</p>
          <p className="text-2xl font-bold text-primary">
            Rp {amount.toLocaleString('id-ID')}
          </p>
        </div>

        {paymentConfirmed ? (
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>
              Terima kasih! Konfirmasi pembayaran Anda telah direkam. Toko akan memverifikasi pembayaran.
            </AlertDescription>
          </Alert>
        ) : (
          <Button
            className="w-full"
            onClick={handleConfirmPayment}
            variant="default"
          >
            Saya Sudah Membayar
          </Button>
        )}

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-xs">
            Pastikan nominal pembayaran sesuai dengan total pesanan. Setelah melakukan pembayaran, klik tombol "Saya Sudah Membayar" di atas.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}

