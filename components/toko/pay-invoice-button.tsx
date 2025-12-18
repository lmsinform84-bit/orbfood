'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { CreditCard, Upload, CheckCircle2, AlertCircle, QrCode } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/lib/supabase/client';
import { compressImage } from '@/lib/utils/image';
import Image from 'next/image';
import { getImageUrl } from '@/lib/utils/image';

interface PayInvoiceButtonProps {
  orderId: string;
  feeAmount: number;
  orbQrisUrl?: string | null;
  onPaymentSuccess?: () => void;
}

export function PayInvoiceButton({ orderId, feeAmount, orbQrisUrl: initialOrbQrisUrl, onPaymentSuccess }: PayInvoiceButtonProps) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [orbQrisUrl, setOrbQrisUrl] = useState<string | null>(initialOrbQrisUrl || null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchORBQRIS = async () => {
      if (initialOrbQrisUrl) {
        setOrbQrisUrl(initialOrbQrisUrl);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('stores')
          .select('orb_qris_url')
          .not('orb_qris_url', 'is', null)
          .limit(1)
          .maybeSingle();

        if (!error && data?.orb_qris_url) {
          setOrbQrisUrl(data.orb_qris_url);
        }
      } catch (error) {
        console.error('Error fetching ORB QRIS:', error);
      }
    };

    if (open) {
      fetchORBQRIS();
    }
  }, [open, initialOrbQrisUrl]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      
      // Validate file type
      if (!selectedFile.type.startsWith('image/')) {
        toast({
          title: 'File tidak valid',
          description: 'Harap upload file gambar (JPG, PNG, dll)',
          variant: 'destructive',
        });
        return;
      }

      // Validate file size (max 5MB)
      if (selectedFile.size > 5 * 1024 * 1024) {
        toast({
          title: 'File terlalu besar',
          description: 'Ukuran file maksimal 5MB',
          variant: 'destructive',
        });
        return;
      }

      setFile(selectedFile);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handlePayAndUpload = async () => {
    if (!file) {
      toast({
        title: 'Pilih file terlebih dahulu',
        description: 'Harap upload bukti pembayaran',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Compress image (max width 1200px for payment proofs)
      const compressedFile = await compressImage(file, 1200);

      // Upload to Supabase Storage
      const fileExt = compressedFile.name.split('.').pop();
      const fileName = `invoice-payments/${orderId}-${Date.now()}.${fileExt}`;

      console.log('Attempting to upload payment proof:', {
        bucket: 'store-uploads',
        fileName,
        fileSize: compressedFile.size,
        fileType: compressedFile.type,
      });

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('store-uploads')
        .upload(fileName, compressedFile, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        console.error('Upload error details:', {
          message: uploadError.message,
          statusCode: uploadError.statusCode,
          error: uploadError,
        });
        
        // Provide more helpful error message
        if (uploadError.message?.includes('Bucket not found')) {
          throw new Error('Bucket "store-uploads" belum dibuat. Silakan hubungi admin untuk membuat bucket terlebih dahulu.');
        } else if (uploadError.message?.includes('new row violates row-level security policy')) {
          throw new Error('Anda tidak memiliki izin untuk upload. Pastikan Anda login sebagai toko dan memiliki akses yang benar.');
        } else if (uploadError.message?.includes('The resource already exists')) {
          throw new Error('File dengan nama yang sama sudah ada. Silakan coba lagi.');
        }
        
        throw uploadError;
      }

      console.log('Upload successful:', uploadData);

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('store-uploads')
        .getPublicUrl(fileName);

      // Save payment proof to database
      try {
        const response = await fetch('/api/invoices/upload-proof', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            orderId: orderId, // API will get or create invoice for this order
            paymentProofUrl: urlData.publicUrl,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to save payment proof');
        }
      } catch (error: any) {
        console.error('Error saving payment proof to database:', error);
        // Continue anyway - file is uploaded, just database update failed
      }

      toast({
        title: 'Pembayaran berhasil',
        description: 'Bukti pembayaran telah diupload. Admin akan memverifikasi pembayaran Anda.',
      });

      setOpen(false);
      setFile(null);
      setPreview(null);
      
      // Call success callback to refresh invoice list
      if (onPaymentSuccess) {
        onPaymentSuccess();
      }
    } catch (error: any) {
      console.error('Error processing payment:', error);
      toast({
        title: 'Gagal memproses pembayaran',
        description: error.message || 'Terjadi kesalahan saat upload bukti pembayaran',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full" variant="default">
          <CreditCard className="h-4 w-4 mr-2" />
          Bayar Invoice
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bayar Invoice & Upload Bukti</DialogTitle>
          <DialogDescription>
            Upload bukti pembayaran fee ORB sebesar{' '}
            <span className="font-bold text-primary">
              Rp {feeAmount.toLocaleString('id-ID')}
            </span>
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* QRIS ORBfood Display */}
          {orbQrisUrl && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <QrCode className="h-4 w-4" />
                QRIS ORBfood
              </Label>
              <div className="flex justify-center p-4 bg-white rounded-lg border-2">
                <div className="relative w-48 h-48">
                  <Image
                    src={getImageUrl(orbQrisUrl, 'medium') || orbQrisUrl}
                    alt="QRIS ORBfood"
                    fill
                    className="object-contain"
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Scan QRIS ini untuk transfer fee ke ORBfood
              </p>
            </div>
          )}

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              <strong>Instruksi:</strong>
              <ol className="list-decimal list-inside mt-1 space-y-1">
                <li>Scan QRIS di atas menggunakan aplikasi e-wallet atau mobile banking</li>
                <li>Transfer sesuai dengan jumlah fee: <strong>Rp {feeAmount.toLocaleString('id-ID')}</strong></li>
                <li>Setelah transfer, upload bukti pembayaran di bawah ini</li>
              </ol>
            </AlertDescription>
          </Alert>

          <div>
            <Label htmlFor="proof-file">Upload Bukti Pembayaran</Label>
            <Input
              id="proof-file"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Format: JPG, PNG (maks. 5MB)
            </p>
          </div>

          {preview && (
            <div className="space-y-2">
              <Label>Preview Bukti Pembayaran</Label>
              <div className="relative w-full h-48 border rounded-lg overflow-hidden">
                <img
                  src={preview}
                  alt="Preview bukti pembayaran"
                  className="w-full h-full object-contain"
                />
              </div>
              {file && (
                <p className="text-xs text-muted-foreground">
                  File: {file.name} ({(file.size / 1024).toFixed(2)} KB)
                </p>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Batal
            </Button>
            <Button 
              onClick={handlePayAndUpload} 
              disabled={!file || loading}
            >
              {loading ? (
                <>
                  <Upload className="h-4 w-4 mr-2 animate-spin" />
                  Mengupload...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Konfirmasi & Upload
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

