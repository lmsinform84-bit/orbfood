'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getImageUrl } from '@/lib/utils/image';
import { AddToCartButton } from './add-to-cart-button';
import { UtensilsCrossed } from 'lucide-react';
import { Product } from '@/types/database';

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
      // Delay to ensure DOM is ready
      setTimeout(() => {
        selectedRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center',
          inline: 'center'
        });
      }, 300);
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
    <div className="space-y-12 md:space-y-16">
      {/* Featured Products Section - Portrait Cards, Horizontal Scroll */}
      {featuredProducts.length > 0 && (
        <div>
          <div className="flex items-center gap-4 mb-8">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900">
              Menu Unggulan
            </h2>
            {selectedProductId && (
              <Badge variant="default" className="text-sm md:text-base px-4 py-1.5 font-semibold shadow-md animate-pulse">
                ⭐ Produk yang Anda pilih
              </Badge>
            )}
          </div>
          <div className="flex gap-5 md:gap-6 lg:gap-8 overflow-x-auto pb-6 scrollbar-hide -mx-4 px-4 snap-x snap-mandatory">
            {featuredProducts.map((product, index) => {
              const isSelected = product.id === selectedProductId;
              return (
                <div
                  key={product.id}
                  ref={isSelected ? selectedRef : null}
                  className="flex-shrink-0 snap-start"
                  id={isSelected ? `product-${product.id}` : undefined}
                >
                  <Card className={`w-72 md:w-80 lg:w-96 h-[460px] md:h-[520px] lg:h-[560px] flex flex-col transition-all duration-300 bg-white border-2 ${isSelected ? 'border-primary shadow-2xl scale-[1.03] ring-4 ring-primary/30' : 'border-gray-200 shadow-lg hover:shadow-2xl hover:scale-[1.02] hover:border-primary/50'}`}>
                    {/* Product Image - Portrait (3:4 ratio) */}
                    <div className="relative w-full h-72 md:h-80 lg:h-96 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden rounded-t-lg">
                      {product.image_url ? (
                        <Image
                          src={getImageUrl(product.image_url, 'medium') || '/placeholder-food.jpg'}
                          alt={product.name}
                          fill
                          sizes="(max-width: 768px) 288px, (max-width: 1024px) 320px, 384px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <UtensilsCrossed className="h-20 w-20 text-gray-400" />
                        </div>
                      )}
                      {isSelected && (
                        <div className="absolute top-4 left-4 bg-gradient-to-r from-primary to-primary/80 text-white text-sm md:text-base px-4 py-2 rounded-full font-bold shadow-xl flex items-center gap-2 animate-pulse z-10">
                          <span>⭐</span>
                          <span>Dipilih</span>
                        </div>
                      )}
                      {product.stock <= 5 && product.stock > 0 && (
                        <div className="absolute top-4 right-4 bg-yellow-500 text-white text-xs md:text-sm px-3 py-1.5 rounded-full font-semibold shadow-lg">
                          Stok terbatas
                        </div>
                      )}
                      {product.stock === 0 && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm">
                          <span className="text-white font-bold text-xl md:text-2xl bg-destructive px-6 py-3 rounded-xl shadow-xl">
                            Stok Habis
                          </span>
                        </div>
                      )}
                    </div>
                    <CardHeader className="pb-3 px-5 pt-5">
                      <CardTitle className="line-clamp-2 text-xl md:text-2xl font-bold text-gray-900 min-h-[3.5rem] leading-tight">
                        {product.name}
                      </CardTitle>
                      {product.description && (
                        <CardDescription className="line-clamp-2 text-sm md:text-base mt-2 text-gray-600">
                          {product.description}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent className="pt-0 px-5 pb-5 flex-1 flex flex-col justify-between">
                      <div className="mb-5">
                        <span className="text-3xl md:text-4xl font-bold text-primary">
                          Rp {product.price.toLocaleString('id-ID')}
                        </span>
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
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-8 text-gray-900">
            Menu Lainnya
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
            {otherProducts.map((product) => (
              <Card 
                key={product.id} 
                className="overflow-hidden hover:shadow-xl transition-all duration-300 border-2 border-gray-200 bg-white group hover:border-primary/50"
              >
                <div className="flex flex-row h-full">
                  {/* Product Image - Landscape */}
                  <div className="relative w-36 md:w-40 h-36 md:h-40 flex-shrink-0 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                    {product.image_url ? (
                      <Image
                        src={getImageUrl(product.image_url, 'medium') || '/placeholder-food.jpg'}
                        alt={product.name}
                        fill
                        sizes="(max-width: 768px) 144px, 160px"
                        className="object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <UtensilsCrossed className="h-12 w-12 text-gray-400" />
                      </div>
                    )}
                    {product.stock === 0 && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-sm">
                        <span className="text-white text-sm font-bold bg-destructive px-3 py-1.5 rounded-lg shadow-lg">
                          Habis
                        </span>
                      </div>
                    )}
                    {product.stock <= 5 && product.stock > 0 && (
                      <div className="absolute top-2 right-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded-full font-semibold shadow-md">
                        Stok terbatas
                      </div>
                    )}
                  </div>
                  <CardContent className="p-4 md:p-5 flex-1 flex flex-col justify-between min-w-0">
                    <div className="mb-4">
                      <CardTitle className="line-clamp-2 text-base md:text-lg font-bold text-gray-900 mb-2 leading-tight">
                        {product.name}
                      </CardTitle>
                      {product.description && (
                        <CardDescription className="line-clamp-2 text-xs md:text-sm text-gray-600 mb-3">
                          {product.description}
                        </CardDescription>
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <span className="text-xl md:text-2xl font-bold text-primary block mb-1">
                          Rp {product.price.toLocaleString('id-ID')}
                        </span>
                      </div>
                      <div className="flex-shrink-0">
                        <AddToCartButton
                          product={product}
                          disabled={product.stock === 0}
                        />
                      </div>
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

