'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { getImageUrl } from '@/lib/utils/image';
import { Search, UtensilsCrossed } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ProductWithStore {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  stock: number;
  category: string | null;
  store: {
    id: string;
    name: string;
    address: string;
  };
}

interface HomePageClientProps {
  initialProducts: ProductWithStore[];
}

export function HomePageClient({ initialProducts }: HomePageClientProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedArea, setSelectedArea] = useState<string>('all');

  // Extract unique categories
  const categories = useMemo(() => {
    const cats = new Set<string>();
    initialProducts.forEach((p) => {
      if (p.category) cats.add(p.category);
    });
    return Array.from(cats).sort();
  }, [initialProducts]);

  // Extract unique areas (from store address - simplified)
  const areas = useMemo(() => {
    const areaSet = new Set<string>();
    initialProducts.forEach((p) => {
      if (p.store.address) {
        // Extract first part of address as area (simplified)
        const parts = p.store.address.split(',');
        if (parts.length > 0) {
          areaSet.add(parts[0].trim());
        }
      }
    });
    return Array.from(areaSet).sort();
  }, [initialProducts]);

  // Filter products
  const filteredProducts = useMemo(() => {
    return initialProducts.filter((product) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = product.name.toLowerCase().includes(query);
        const matchesStore = product.store.name.toLowerCase().includes(query);
        if (!matchesName && !matchesStore) return false;
      }

      // Category filter
      if (selectedCategory !== 'all') {
        if (product.category !== selectedCategory) return false;
      }

      // Area filter
      if (selectedArea !== 'all') {
        if (!product.store.address.includes(selectedArea)) return false;
      }

      return true;
    });
  }, [initialProducts, searchQuery, selectedCategory, selectedArea]);

  if (initialProducts.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <UtensilsCrossed className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Belum ada menu yang tersedia saat ini.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div>
      {/* Search and Filters */}
      <div className="mb-6 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari toko atau menu..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex flex-wrap gap-4">
          {/* Area/Region Selector */}
          <Select value={selectedArea} onValueChange={setSelectedArea}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Pilih Wilayah" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Wilayah</SelectItem>
              {areas.map((area) => (
                <SelectItem key={area} value={area}>
                  {area}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Category Filter */}
          {categories.length > 0 && (
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Kategori</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Clear filters */}
          {(searchQuery || selectedCategory !== 'all' || selectedArea !== 'all') && (
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
                setSelectedArea('all');
              }}
            >
              Reset Filter
            </Button>
          )}
        </div>
      </div>

      {/* Results count */}
      {filteredProducts.length !== initialProducts.length && (
        <div className="mb-4 text-sm text-muted-foreground">
          Menampilkan {filteredProducts.length} dari {initialProducts.length} menu
        </div>
      )}

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <UtensilsCrossed className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Tidak ada menu yang sesuai dengan filter Anda.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredProducts.map((product) => (
            <Link
              key={product.id}
              href={`/user/stores/${product.store.id}?productId=${product.id}`}
            >
              <Card className="h-full hover:shadow-lg transition-all cursor-pointer hover:scale-[1.02]">
                <div className="relative h-48 w-full">
                  {product.image_url ? (
                    <Image
                      src={getImageUrl(product.image_url, 'medium') || '/placeholder-food.jpg'}
                      alt={product.name}
                      fill
                      className="object-cover rounded-t-lg"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-900 dark:to-red-900 flex items-center justify-center rounded-t-lg">
                      <span className="text-5xl">🍽️</span>
                    </div>
                  )}
                </div>
                <CardHeader className="pb-2">
                  <CardTitle className="line-clamp-1 text-lg">{product.name}</CardTitle>
                  <CardDescription className="line-clamp-1 text-xs">
                    {product.store.name}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold text-primary">
                      Rp {product.price.toLocaleString('id-ID')}
                    </span>
                    {product.stock > 0 ? (
                      <span className="text-xs text-muted-foreground">Stok: {product.stock}</span>
                    ) : (
                      <span className="text-xs text-destructive">Habis</span>
                    )}
                  </div>
                  {product.description && (
                    <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                      {product.description}
                    </p>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}





























