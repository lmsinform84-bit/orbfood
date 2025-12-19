'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getImageUrl } from '@/lib/utils/image';
import { AddToCartButton } from './add-to-cart-button';
import { UtensilsCrossed } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  stock: number;
}

interface StoreMenuDisplayProps {
  products: Product[];
  selectedProductId?: string | null;
}

export function StoreMenuDisplay({ products, selectedProductId }: StoreMenuDisplayProps) {
  const selectedRef = useRef<HTMLDivElement>(null);

  // Get featured products (3-5 products, with selected product first if exists)
  const getFeaturedProducts = () => {
    const selectedProduct = selectedProductId 
      ? products.find(p => p.id === selectedProductId)
      : null;

    const otherProducts = products.filter(p => p.id !== selectedProductId);
    
    // Take up to 4 more products for featured (total 5 max)
    const featuredOthers = otherProducts.slice(0, 4);
    
    if (selectedProduct) {
      return [selectedProduct, ...featuredOthers];
    }
    
    return otherProducts.slice(0, 5);
  };

  const featuredProducts = getFeaturedProducts();
  const otherProducts = products.filter(p => 
    !featuredProducts.some(fp => fp.id === p.id)
  );

  useEffect(() => {
    // Scroll to selected product when component mounts
    if (selectedRef.current && selectedProductId) {
      selectedRef.current.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center',
        inline: 'center'
      });
    }
  }, [selectedProductId]);

  if (products.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Belum ada menu yang tersedia.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div>
      {/* Featured Products Section - Portrait Cards, Horizontal Scroll */}
      {featuredProducts.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Menu Unggulan</h2>
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
            {featuredProducts.map((product, index) => {
              const isSelected = product.id === selectedProductId;
              return (
                <div
                  key={product.id}
                  ref={isSelected ? selectedRef : null}
                  className="flex-shrink-0"
                >
                  <Card className={`w-48 h-80 flex flex-col ${isSelected ? 'border-2 border-primary shadow-lg' : ''}`}>
                    {/* Product Image - Portrait (3:4 ratio) */}
                    <div className="relative w-full h-48 bg-gradient-to-br from-gray-100 to-gray-200">
                      {product.image_url ? (
                        <Image
                          src={getImageUrl(product.image_url, 'medium') || '/placeholder-food.jpg'}
                          alt={product.name}
                          fill
                          className="object-cover rounded-t-lg"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center rounded-t-lg">
                          <UtensilsCrossed className="h-12 w-12 text-gray-400" />
                        </div>
                      )}
                      {isSelected && (
                        <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full font-medium">
                          Dipilih
                        </div>
                      )}
                    </div>
                    <CardHeader className="pb-2">
                      <CardTitle className="line-clamp-2 text-base">{product.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0 flex-1 flex flex-col justify-between">
                      <div>
                        <span className="text-xl font-bold text-primary">
                          Rp {product.price.toLocaleString('id-ID')}
                        </span>
                        {product.stock === 0 && (
                          <span className="text-xs text-destructive ml-2">Habis</span>
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
            })}
          </div>
        </div>
      )}

      {/* Other Products Section - Landscape Cards, Vertical List */}
      {otherProducts.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-4">Menu Lainnya</h2>
          <div className="space-y-4">
            {otherProducts.map((product) => (
              <Card key={product.id} className="overflow-hidden">
                <div className="flex flex-row">
                  {/* Product Image - Landscape */}
                  <div className="relative w-32 h-32 flex-shrink-0 bg-gradient-to-br from-gray-100 to-gray-200">
                    {product.image_url ? (
                      <Image
                        src={getImageUrl(product.image_url, 'medium') || '/placeholder-food.jpg'}
                        alt={product.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <UtensilsCrossed className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <CardContent className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <CardTitle className="line-clamp-1 mb-1">{product.name}</CardTitle>
                      <CardDescription className="line-clamp-2 text-sm mb-2">
                        {product.description || 'Menu lezat dari toko kami'}
                      </CardDescription>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xl font-bold text-primary">
                          Rp {product.price.toLocaleString('id-ID')}
                        </span>
                        {product.stock === 0 && (
                          <span className="text-xs text-destructive ml-2">Habis</span>
                        )}
                      </div>
                      <AddToCartButton
                        product={product}
                        disabled={product.stock === 0}
                      />
                    </div>
                  </CardContent>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

