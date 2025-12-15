'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Trash2 } from 'lucide-react';

interface DeleteProductButtonProps {
  productId: string;
  productName: string;
}

export function DeleteProductButton({ productId, productName }: DeleteProductButtonProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      // First, get product to get image URL
      const { data: product, error: fetchError } = await supabase
        .from('products')
        .select('image_url')
        .eq('id', productId)
        .single();

      if (fetchError) throw fetchError;

      // Delete image from storage if exists
      if (product?.image_url) {
        try {
          // Extract file path from URL
          // URL format: https://...supabase.co/storage/v1/object/public/product-images/products/{store_id}/{filename}
          const url = new URL(product.image_url);
          const pathParts = url.pathname.split('/');
          const bucketIndex = pathParts.findIndex(part => part === 'product-images');
          
          if (bucketIndex !== -1 && bucketIndex < pathParts.length - 1) {
            // Get path after 'product-images' (should be 'products/{store_id}/{filename}')
            const filePath = pathParts.slice(bucketIndex + 1).join('/');
            console.log('🗑️ Deleting image from storage:', filePath);
            
            const { error: deleteImageError } = await supabase.storage
              .from('product-images')
              .remove([filePath]);
            
            if (deleteImageError) {
              console.warn('⚠️ Failed to delete image from storage:', deleteImageError);
              // Continue with database deletion even if image deletion fails
            } else {
              console.log('✅ Image deleted from storage');
            }
          } else {
            console.warn('⚠️ Could not extract file path from URL:', product.image_url);
          }
        } catch (imageError) {
          console.warn('⚠️ Error deleting image:', imageError);
          // Continue with database deletion
        }
      }

      // Delete product from database
      const { error: deleteError } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (deleteError) throw deleteError;

      toast({
        title: 'Menu dihapus',
        description: `${productName} berhasil dihapus dari database`,
      });

      router.refresh();
    } catch (error: any) {
      console.error('Delete error:', error);
      toast({
        title: 'Gagal menghapus',
        description: error.message || 'Terjadi kesalahan saat menghapus menu',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="icon" className="text-destructive">
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Hapus Menu?</AlertDialogTitle>
          <AlertDialogDescription>
            Apakah Anda yakin ingin menghapus <strong>{productName}</strong>? Tindakan ini tidak
            dapat dibatalkan.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Batal</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={loading}>
            {loading ? 'Menghapus...' : 'Hapus'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

