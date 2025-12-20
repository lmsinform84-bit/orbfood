'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Star } from 'lucide-react';
import { getImageUrl } from '@/lib/utils/image';
import { Product } from '@/types/database';
import { UtensilsCrossed } from 'lucide-react';
import { ProductDetailModal } from './product-detail-modal';
import { useToast } from '@/hooks/use-toast';

interface MenuListProps {
  products: Product[];
  selectedProductId?: string | null;
}

export function MenuList({ products, selectedProductId }: MenuListProps) {
  const { toast } = useToast();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const handleCardClick = (product: Product) => {
    setSelectedProduct(product);
    setModalOpen(true);
  };

  const handleQuickAdd = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    addToCart(product, 1);
  };

  const addToCart = (product: Product, quantity: number, notes?: string) => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    
    // Check if product already exists in cart
    const existingIndex = cart.findIndex((item: any) => item.productId === product.id);
    
    if (existingIndex >= 0) {
      cart[existingIndex].quantity += quantity;
    } else {
      cart.push({
        productId: product.id,
        storeId: product.store_id,
        name: product.name,
        price: product.price,
        imageUrl: product.image_url,
        quantity,
        notes: notes || '',
      });
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    
    // Dispatch event
    window.dispatchEvent(new CustomEvent('cartUpdated'));
    
    toast({
      title: 'Ditambahkan ke keranjang',
      description: `${product.name} x${quantity}`,
    });
  };

  const handleAddToCart = (product: Product, quantity: number, notes?: string) => {
    addToCart(product, quantity, notes);
  };

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Belum ada menu yang tersedia.</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {products.map((product) => {
          const isSelected = product.id === selectedProductId;
          const isOutOfStock = product.stock === 0;
          
          return (
            <Card
              key={product.id}
              className={`overflow-hidden hover:shadow-lg transition-all duration-200 border-2 cursor-pointer ${
                isSelected 
                  ? 'border-primary shadow-md ring-2 ring-primary/20' 
                  : 'border-gray-200 hover:border-primary/50'
              }`}
              onClick={() => handleCardClick(product)}
            >
              <div className="flex flex-row h-full">
                {/* Product Image - Landscape */}
                <div className="relative w-24 h-24 md:w-32 md:h-32 flex-shrink-0 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                  {product.image_url ? (
                    <Image
                      src={getImageUrl(product.image_url, 'medium') || '/placeholder-food.jpg'}
                      alt={product.name}
                      fill
                      sizes="(max-width: 768px) 96px, 128px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <UtensilsCrossed className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                  {isOutOfStock && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="text-white text-xs font-bold bg-destructive px-2 py-1 rounded">
                        Habis
                      </span>
                    </div>
                  )}
                  {product.stock <= 5 && product.stock > 0 && (
                    <div className="absolute top-1 right-1 bg-yellow-500 text-white text-xs px-1.5 py-0.5 rounded-full font-medium">
                      Stok terbatas
                    </div>
                  )}
                </div>

                <CardContent className="p-3 md:p-4 flex-1 flex flex-col justify-between min-w-0">
                  <div className="mb-2">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-bold text-base md:text-lg text-foreground line-clamp-2 flex-1">
                        {product.name}
                      </h3>
                      {isSelected && (
                        <Badge variant="default" className="text-xs flex-shrink-0">
                          ⭐ Dipilih
                        </Badge>
                      )}
                    </div>
                    {product.description && (
                      <p className="text-xs text-muted-foreground line-clamp-1 mb-2">
                        {product.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        4.7
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className="text-lg md:text-xl font-bold text-primary">
                      Rp {product.price.toLocaleString('id-ID')}
                    </span>
                    <Button
                      size="sm"
                      className="h-8 w-8 p-0 flex-shrink-0"
                      onClick={(e) => handleQuickAdd(e, product)}
                      disabled={isOutOfStock}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </div>
            </Card>
          );
        })}
      </div>

      <ProductDetailModal
        product={selectedProduct}
        open={modalOpen}
        onOpenChange={setModalOpen}
        onAddToCart={handleAddToCart}
      />
    </>
  );
}

