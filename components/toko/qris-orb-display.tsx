'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { QrCode, AlertCircle } from 'lucide-react';
import Image from 'next/image';
import { getImageUrl } from '@/lib/utils/image';
import { supabase } from '@/lib/supabase/client';

interface QRISORBDisplayProps {
  orbQrisUrl?: string | null;
}

export function QRISORBDisplay({ orbQrisUrl: initialOrbQrisUrl }: QRISORBDisplayProps) {
  const [orbQrisUrl, setOrbQrisUrl] = useState<string | null>(initialOrbQrisUrl || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchORBQRIS = async () => {
      try {
        // Get ORB QRIS from any store (since admin uploads it and it's shared)
        const { data, error } = await supabase
          .from('stores')
          .select('orb_qris_url')
          .not('orb_qris_url', 'is', null)
          .limit(1)
          .single();

        if (!error && data?.orb_qris_url) {
          setOrbQrisUrl(data.orb_qris_url);
        }
      } catch (error) {
        console.error('Error fetching ORB QRIS:', error);
      } finally {
        setLoading(false);
      }
    };

    if (!initialOrbQrisUrl) {
      fetchORBQRIS();
    } else {
      setLoading(false);
    }
  }, [initialOrbQrisUrl]);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Memuat QRIS ORBfood...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <QrCode className="h-5 w-5" />
          QRIS ORBfood
        </CardTitle>
        <CardDescription>
          Scan QRIS ini untuk transfer fee ke ORBfood
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {orbQrisUrl ? (
          <>
            <div className="flex justify-center">
              <div className="relative w-64 h-64 bg-white p-4 rounded-lg border-2">
                <Image
                  src={getImageUrl(orbQrisUrl, 'medium') || orbQrisUrl}
                  alt="QRIS ORBfood"
                  fill
                  className="object-contain"
                />
              </div>
            </div>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                <strong>Instruksi Pembayaran:</strong>
                <ol className="list-decimal list-inside mt-2 space-y-1">
                  <li>Scan QRIS di atas menggunakan aplikasi e-wallet atau mobile banking Anda</li>
                  <li>Transfer sesuai dengan jumlah fee yang tertera di invoice</li>
                  <li>Setelah transfer, klik tombol "Bayar Invoice" dan upload bukti pembayaran</li>
                  <li>Admin akan memverifikasi pembayaran Anda</li>
                </ol>
              </AlertDescription>
            </Alert>
          </>
        ) : (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              QRIS ORBfood belum tersedia. Silakan hubungi admin untuk informasi lebih lanjut.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
