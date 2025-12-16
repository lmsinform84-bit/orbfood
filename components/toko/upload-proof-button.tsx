'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase/client';
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

interface UploadProofButtonProps {
  orderId: string;
  onUploadSuccess?: () => void;
}

export function UploadProofButton({ orderId, onUploadSuccess }: UploadProofButtonProps) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast({
        title: 'Pilih file terlebih dahulu',
        description: 'Harap pilih file bukti transfer',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Upload file to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `payment-proofs/${orderId}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('store-uploads')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('store-uploads')
        .getPublicUrl(fileName);

      // TODO: Save payment proof record to database
      // For now, just show success message
      toast({
        title: 'Bukti transfer berhasil diupload',
        description: 'Admin akan memverifikasi pembayaran Anda',
      });

      setOpen(false);
      setFile(null);
      if (onUploadSuccess) {
        onUploadSuccess();
      }
    } catch (error: any) {
      console.error('Error uploading proof:', error);
      toast({
        title: 'Gagal upload bukti transfer',
        description: error.message || 'Terjadi kesalahan saat upload',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" size="sm" className="gap-2">
          <Upload className="h-4 w-4" />
          <span className="hidden sm:inline">Upload Bukti</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload Bukti Transfer</DialogTitle>
          <DialogDescription>
            Upload bukti transfer untuk invoice #{orderId.substring(0, 8).toUpperCase()}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="proof-file">File Bukti Transfer</Label>
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
          {file && (
            <div className="text-sm text-muted-foreground">
              File terpilih: {file.name} ({(file.size / 1024).toFixed(2)} KB)
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleUpload} disabled={!file || loading}>
              {loading ? 'Mengupload...' : 'Upload'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

