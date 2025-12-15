'use client';

import { useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import { getImageUrl } from '@/lib/utils/image';
import { AddToCartButton } from './add-to-cart-button';
import { CheckCircle2 } from 'lucide-react';

interface ProductHighlightProps {
  product: {
    id: string;
    name: string;
    description: string | null;
    price: number;
    image_url: string | null;
    stock: number;
  };
}

export function ProductHighlight({ product }: ProductHighlightProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to product when component mounts
    if (cardRef.current) {
      cardRef.current.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
    }
  }, []);

  return (
    <div ref={cardRef} className="mb-6">
      <Card className="border-2 border-primary shadow-lg">
        <div className="flex items-center gap-2 p-3 bg-primary/10 border-b">
          <CheckCircle2 className="h-5 w-5 text-primary" />
          <p className="text-sm font-medium text-primary">Makanan yang Anda pilih</p>
        </div>
        <div className="relative h-64 w-full">
          {product.image_url ? (
            <Image
              src={getImageUrl(product.image_url, 'medium') || '/placeholder-food.jpg'}
              alt={product.name}
              fill
              className="object-cover rounded-t-lg"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-900 dark:to-red-900 flex items-center justify-center rounded-t-lg">
              <span className="text-6xl">🍽️</span>
            </div>
          )}
        </div>
        <CardHeader>
          <CardTitle className="text-2xl">{product.name}</CardTitle>
          <CardDescription className="text-base">
            {product.description || 'Menu lezat dari toko kami'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <span className="text-3xl font-bold text-primary">
              Rp {product.price.toLocaleString('id-ID')}
            </span>
            {product.stock > 0 ? (
              <span className="text-sm text-muted-foreground">Stok: {product.stock}</span>
            ) : (
              <span className="text-sm text-destructive">Habis</span>
            )}
          </div>
          <AddToCartButton
            product={product}
            disabled={product.stock === 0}
          />
        </CardContent>
      </Card>
    </div>
  );
}
