'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { compressImage } from '@/lib/utils/image';

interface PaymentProofUploadProps {
  orderId: string;
  onUploadSuccess?: () => void;
}

export function PaymentProofUpload({ orderId, onUploadSuccess }: PaymentProofUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const { toast } = useToast();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file type
    if (!selectedFile.type.startsWith('image/')) {
      toast({
        title: 'File tidak valid',
        description: 'Hanya file gambar yang diperbolehkan',
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
  };

  const handleUpload = async () => {
    if (!file) {
      toast({
        title: 'Pilih file terlebih dahulu',
        description: 'Harap pilih file bukti pembayaran',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Compress image
      const compressedFile = await compressImage(file, 1200);

      // Upload to Supabase Storage
      const fileExt = compressedFile.name.split('.').pop();
      const fileName = `order-payments/${orderId}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('store-uploads')
        .upload(fileName, compressedFile, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('store-uploads')
        .getPublicUrl(fileName);

      // Update order with payment proof URL
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          payment_proof_url: urlData.publicUrl,
          payment_proof_uploaded_at: new Date().toISOString(),
        })
        .eq('id', orderId);

      if (updateError) throw updateError;

      setUploaded(true);
      toast({
        title: 'Bukti pembayaran berhasil diupload',
        description: 'Toko akan memverifikasi pembayaran Anda',
      });

      if (onUploadSuccess) {
        onUploadSuccess();
      }
    } catch (error: any) {
      console.error('Error uploading payment proof:', error);
      toast({
        title: 'Gagal upload bukti pembayaran',
        description: error.message || 'Terjadi kesalahan saat upload',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = () => {
    setFile(null);
    setPreview(null);
  };

  if (uploaded) {
    return (
      <Alert>
        <CheckCircle2 className="h-4 w-4" />
        <AlertDescription>
          Bukti pembayaran telah diupload. Toko akan memverifikasi pembayaran Anda.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="payment-proof">Upload Bukti Pembayaran</Label>
        <div className="flex items-center gap-2">
          <Input
            id="payment-proof"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="flex-1"
            disabled={loading}
          />
          {file && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRemove}
              disabled={loading}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Upload foto bukti transfer/pembayaran (maks. 5MB, format: JPG, PNG)
        </p>
      </div>

      {preview && (
        <div className="relative w-full h-48 border rounded-lg overflow-hidden bg-muted">
          <Image
            src={preview}
            alt="Preview bukti pembayaran"
            fill
            className="object-contain"
          />
        </div>
      )}

      {file && (
        <Button
          className="w-full"
          onClick={handleUpload}
          disabled={loading}
        >
          {loading ? (
            'Mengupload...'
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Upload Bukti Pembayaran
            </>
          )}
        </Button>
      )}

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="text-xs">
          Pastikan foto bukti pembayaran jelas dan terlihat nominal serta rekening tujuan.
        </AlertDescription>
      </Alert>
    </div>
  );
}

