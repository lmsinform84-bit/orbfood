'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Product } from '@/types/database';
import { Plus, Minus } from 'lucide-react';

interface AddToCartButtonProps {
  product: Product;
  disabled?: boolean;
}

export function AddToCartButton({ product, disabled }: AddToCartButtonProps) {
  const [quantity, setQuantity] = useState(1);
  const [open, setOpen] = useState(false);

  const maxQuantity = Math.min(product.stock, 10);

  const handleAddToCart = () => {
    // Get existing cart from localStorage
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    
    // Check if product already exists in cart
    const existingIndex = cart.findIndex((item: any) => item.productId === product.id);
    
    if (existingIndex >= 0) {
      // Update quantity
      cart[existingIndex].quantity += quantity;
    } else {
      // Add new item
      cart.push({
        productId: product.id,
        storeId: product.store_id,
        name: product.name,
        price: product.price,
        imageUrl: product.image_url,
        quantity,
      });
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    setOpen(false);
    setQuantity(1);
    
    // Show toast notification
    const event = new CustomEvent('cartUpdated');
    window.dispatchEvent(event);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full" disabled={disabled}>
          {disabled ? 'Stok Habis' : 'Tambah ke Keranjang'}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{product.name}</DialogTitle>
          <DialogDescription>
            {product.description || 'Menu lezat dari toko kami'}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-muted-foreground">Harga per item</span>
            <span className="text-xl font-bold text-primary">
              Rp {product.price.toLocaleString('id-ID')}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Jumlah</span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <Input
                type="number"
                min={1}
                max={maxQuantity}
                value={quantity}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 1;
                  setQuantity(Math.min(Math.max(1, val), maxQuantity));
                }}
                className="w-20 text-center"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => setQuantity(Math.min(maxQuantity, quantity + 1))}
                disabled={quantity >= maxQuantity}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Subtotal</span>
              <span className="text-xl font-bold text-primary">
                Rp {(product.price * quantity).toLocaleString('id-ID')}
              </span>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleAddToCart} className="w-full">
            Tambah ke Keranjang
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

