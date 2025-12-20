'use client';

import { useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { CheckCircle2, LogIn, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

interface StoreApprovalAlertProps {
  storeName: string;
  storeStatus: string;
  userRole: string;
}

export function StoreApprovalAlert({ storeName, storeStatus, userRole }: StoreApprovalAlertProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  // Tampilkan alert jika store approved tapi role masih 'user'
  if (storeStatus !== 'approved' || userRole === 'toko') {
    return null;
  }

  const handleRelogin = async () => {
    setLoading(true);
    try {
      // Logout
      const { error: logoutError } = await supabase.auth.signOut();
      
      if (logoutError) {
        throw logoutError;
      }

      toast({
        title: 'Logout berhasil',
        description: 'Silakan login kembali untuk mengaktifkan role toko.',
      });

      // Redirect ke login dengan message
      router.push('/login?message=Toko Anda telah disetujui! Silakan login kembali untuk mengaktifkan akses toko.');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Gagal logout',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Alert className="mb-6 border-green-500 bg-green-50">
      <CheckCircle2 className="h-4 w-4 text-green-600" />
      <AlertTitle className="text-green-800">
        🎉 Toko Anda Telah Disetujui!
      </AlertTitle>
      <AlertDescription className="text-green-700 mt-2">
        <p className="mb-3">
          Selamat! Toko <strong>{storeName}</strong> telah disetujui oleh admin. 
          Anda sekarang memiliki akses sebagai pemilik toko.
        </p>
        <p className="mb-4 text-sm">
          Silakan login ulang untuk mengaktifkan akses dashboard toko dan mulai mengelola menu serta pesanan.
        </p>
        <Button
          onClick={handleRelogin}
          disabled={loading}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Memproses...
            </>
          ) : (
            <>
              <LogIn className="mr-2 h-4 w-4" />
              Login Ulang
            </>
          )}
        </Button>
      </AlertDescription>
    </Alert>
  );
}
