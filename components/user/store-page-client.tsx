'use client';

import { useEffect, useState, useMemo } from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getImageUrl } from '@/lib/utils/image';
import { StoreHeader } from './store-header';
import { MenuTabs } from './menu-tabs';
import { MenuList } from './menu-list';
import { MiniCart } from './mini-cart';
import { Store, Product } from '@/types/database';
import { MapPin, Phone, Mail } from 'lucide-react';

interface StorePageClientProps {
  store: Store & { 
    area?: { name: string } | null;
    settings?: { 
      delivery_fee: number;
      payment_methods: string[] | null;
      cod_max_limit: number | null;
    } | null;
  };
  products: Product[];
  selectedProductId?: string | null;
}

export function StorePageClient({ 
  store, 
  products, 
  selectedProductId 
}: StorePageClientProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>('all');

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Filter products by category
  const filteredProducts = useMemo(() => {
    if (activeCategory === 'all') return products;
    return products.filter(p => p.category === activeCategory);
  }, [products, activeCategory]);

  // Get featured products (selected product first, then others)
  const featuredProducts = useMemo(() => {
    const selected = selectedProductId 
      ? products.find(p => p.id === selectedProductId)
      : null;
    
    const others = products
      .filter(p => p.id !== selectedProductId)
      .slice(0, 4);
    
    return selected ? [selected, ...others] : others.slice(0, 5);
  }, [products, selectedProductId]);

  // Get other products (not in featured)
  const otherProducts = useMemo(() => {
    return filteredProducts.filter(p => 
      !featuredProducts.some(fp => fp.id === p.id)
    );
  }, [filteredProducts, featuredProducts]);

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Sticky Header */}
      <StoreHeader store={store} isScrolled={isScrolled} />

      {/* Banner - Responsive: 3:2 on mobile, smaller on desktop */}
      <div className="relative w-full overflow-hidden">
        <div className="relative w-full h-[200px] md:h-[150px]">
          {store.banner_url ? (
            <Image
              src={getImageUrl(store.banner_url, 'medium') || '/placeholder-store.jpg'}
              alt={store.name}
              fill
              className="object-cover"
              sizes="100vw"
              priority
            />
          ) : (
              <div className="w-full h-full bg-gradient-to-br from-orange-200 via-orange-100 to-red-200 flex items-center justify-center">
              <span className="text-4xl md:text-5xl text-foreground">
                {store.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Store Info Card */}
      {(store.address || store.phone || store.email || store.description) && (
        <div className="container mx-auto px-4 -mt-6 relative z-10">
          <Card className="border border-gray-200 shadow-md">
            <CardContent className="p-3">
              <div className="space-y-2.5">
                {/* Address */}
                {store.address && (
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-foreground leading-relaxed">
                      {store.address}
                    </p>
                  </div>
                )}

                {/* Phone */}
                {store.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <a 
                      href={`tel:${store.phone}`}
                      className="text-sm text-primary hover:underline font-medium"
                    >
                      {store.phone}
                    </a>
                  </div>
                )}

                {/* Email */}
                {store.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <a 
                      href={`mailto:${store.email}`}
                      className="text-sm text-primary hover:underline font-medium break-all"
                    >
                      {store.email}
                    </a>
                  </div>
                )}

                {/* Description */}
                {store.description && (
                  <div className="pt-2 border-t border-gray-100">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {store.description}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Menu Tabs */}
      <MenuTabs 
        products={products} 
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
      />

      {/* Featured Products (Portrait) */}
      {featuredProducts.length > 0 && (
        <div className="container mx-auto px-4 py-4">
          <h2 className="text-lg font-bold mb-3">Menu</h2>
          <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4 snap-x snap-mandatory">
            {featuredProducts.map((product) => (
              <div
                key={product.id}
                className="flex-shrink-0 snap-start w-40"
              >
                <Card className="flex flex-col border border-gray-200">
                  <div className="relative w-full h-36 bg-gradient-to-br from-gray-100 to-gray-200">
                    {product.image_url && (
                      <Image
                        src={getImageUrl(product.image_url, 'medium') || '/placeholder-food.jpg'}
                        alt={product.name}
                        fill
                        sizes="160px"
                        className="object-cover"
                      />
                    )}
                  </div>
                  <CardContent className="p-2.5">
                    <h3 className="font-semibold text-xs line-clamp-2 mb-1.5">
                      {product.name}
                    </h3>
                    <p className="text-base font-bold text-primary">
                      Rp {product.price.toLocaleString('id-ID')}
                    </p>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Menu List (Landscape) */}
      <div className="container mx-auto px-4 py-6">
        {otherProducts.length > 0 && (
          <>
            <h2 className="text-xl font-bold mb-4">Menu Lainnya</h2>
            <MenuList 
              products={otherProducts}
              selectedProductId={selectedProductId}
            />
          </>
        )}
        {otherProducts.length === 0 && filteredProducts.length > 0 && (
          <MenuList 
            products={filteredProducts}
            selectedProductId={selectedProductId}
          />
        )}
      </div>

      {/* Mini Cart */}
      <MiniCart />
    </div>
  );
}
