'use client';

import { useState } from 'react';
import Image from 'next/image';
import { X, Plus, Minus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { getImageUrl } from '@/lib/utils/image';
import { Product } from '@/types/database';
import { UtensilsCrossed } from 'lucide-react';

interface ProductDetailModalProps {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddToCart: (product: Product, quantity: number, notes?: string) => void;
}

export function ProductDetailModal({
  product,
  open,
  onOpenChange,
  onAddToCart,
}: ProductDetailModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');

  if (!product) return null;

  const maxQuantity = Math.min(product.stock, 10);
  const isOutOfStock = product.stock === 0;

  const handleAddToCart = () => {
    onAddToCart(product, quantity, notes);
    setQuantity(1);
    setNotes('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto p-0">
        <div className="relative">
          {/* Close Button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 z-10 bg-white/90 hover:bg-white"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-5 w-5" />
          </Button>

          {/* Product Image */}
          <div className="relative w-full h-64 bg-gradient-to-br from-gray-100 to-gray-200">
            {product.image_url ? (
              <Image
                src={getImageUrl(product.image_url, 'medium') || '/placeholder-food.jpg'}
                alt={product.name}
                fill
                className="object-cover"
                sizes="100vw"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <UtensilsCrossed className="h-20 w-20 text-gray-400" />
              </div>
            )}
            {isOutOfStock && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <span className="text-white font-bold text-xl bg-destructive px-6 py-3 rounded-lg">
                  Stok Habis
                </span>
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="p-6 space-y-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {product.name}
              </h2>
              {product.description && (
                <p className="text-gray-600 leading-relaxed">
                  {product.description}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold text-primary">
                Rp {product.price.toLocaleString('id-ID')}
              </span>
              {product.stock > 0 && (
                <span className="text-sm text-gray-500">
                  Stok: {product.stock}
                </span>
              )}
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Catatan (Opsional)</Label>
              <Textarea
                id="notes"
                placeholder="Contoh: Tidak pedas, tambah sambal, dll..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>

            {/* Quantity Selector */}
            <div className="flex items-center justify-between">
              <Label>Jumlah</Label>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-10 w-10"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-12 text-center font-semibold text-lg">
                  {quantity}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-10 w-10"
                  onClick={() => setQuantity(Math.min(maxQuantity, quantity + 1))}
                  disabled={quantity >= maxQuantity}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Add to Cart Button */}
            <Button
              className="w-full"
              size="lg"
              onClick={handleAddToCart}
              disabled={isOutOfStock}
            >
              {isOutOfStock ? 'Stok Habis' : `Tambah ke Keranjang - Rp ${(product.price * quantity).toLocaleString('id-ID')}`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

