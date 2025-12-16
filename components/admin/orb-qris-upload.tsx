'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { QrCode, Upload, CheckCircle2, AlertCircle } from 'lucide-react';
import Image from 'next/image';
import { getImageUrl } from '@/lib/utils/image';
import { supabase } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { compressImage } from '@/lib/utils/image';

export function ORBQRISUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

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

      // Validate file size (max 2MB)
      if (selectedFile.size > 2 * 1024 * 1024) {
        toast({
          title: 'File terlalu besar',
          description: 'Ukuran file maksimal 2MB',
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

  const handleUpload = async () => {
    if (!file) {
      toast({
        title: 'Pilih file terlebih dahulu',
        description: 'Harap pilih file QRIS ORBfood',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      // Compress image
      const compressedFile = await compressImage(file, 0.8);

      // Upload to Supabase Storage
      const fileExt = compressedFile.name.split('.').pop();
      const fileName = `qris/orb/orb-qris-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('store-uploads')
        .upload(fileName, compressedFile, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Update ALL stores with this ORB QRIS
      const { error: updateError } = await supabase
        .from('stores')
        .update({ orb_qris_url: fileName })
        .not('id', 'is', null);

      if (updateError) throw updateError;

      toast({
        title: 'QRIS ORBfood berhasil diupload',
        description: 'QRIS telah diperbarui untuk semua toko',
      });

      setFile(null);
      // Keep preview to show current QRIS
    } catch (error: any) {
      console.error('Error uploading ORB QRIS:', error);
      toast({
        title: 'Gagal upload QRIS ORBfood',
        description: error.message || 'Terjadi kesalahan saat upload',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <QrCode className="h-5 w-5" />
          Upload QRIS ORBfood
        </CardTitle>
        <CardDescription>
          QRIS ini akan tersedia untuk semua toko untuk transfer fee
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {preview && (
          <div className="flex justify-center">
            <div className="relative w-48 h-48 bg-white p-4 rounded-lg border-2">
              <Image
                src={preview}
                alt="QRIS ORBfood Preview"
                fill
                className="object-contain"
              />
            </div>
          </div>
        )}

        <div>
          <Label htmlFor="orb-qris-file">Upload QRIS ORBfood Baru</Label>
          <Input
            id="orb-qris-file"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="mt-2"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Format: JPG, PNG (maks. 2MB)
          </p>
        </div>

        {file && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              File terpilih: {file.name} ({(file.size / 1024).toFixed(2)} KB)
            </AlertDescription>
          </Alert>
        )}

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-xs">
            <strong>Penting:</strong> QRIS yang diupload akan menggantikan QRIS ORBfood untuk semua toko.
            Pastikan QRIS yang diupload valid dan dapat menerima pembayaran.
          </AlertDescription>
        </Alert>

        <Button
          onClick={handleUpload}
          disabled={!file || loading}
          className="w-full"
        >
          <Upload className="h-4 w-4 mr-2" />
          {loading ? 'Mengupload...' : 'Upload QRIS ORBfood'}
        </Button>
      </CardContent>
    </Card>
  );
}

