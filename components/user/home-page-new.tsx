'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { getImageUrl } from '@/lib/utils/image';
import { 
  UtensilsCrossed, 
  Store, 
  MapPin, 
  Search
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

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
    area: {
      id: string;
      name: string;
    } | null;
  };
}

interface HomePageNewProps {
  selectedAreaId?: string | null;
  selectedAreaName?: string | null;
}

export function HomePageNew({ selectedAreaId, selectedAreaName }: HomePageNewProps) {
  const [products, setProducts] = useState<ProductWithStore[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        // First, get approved and open stores
        // Query stores without area_id first (to avoid error if column doesn't exist)
        let storesQuery = supabase
          .from('stores')
          .select('id, name, address, status, is_open')
          .eq('status', 'approved')
          .eq('is_open', true);

        const { data: storesData, error: storesError } = await storesQuery;

        if (storesError) {
          console.error('Error fetching stores:', storesError);
          console.error('Error details:', {
            code: storesError.code,
            message: storesError.message,
            details: storesError.details,
            hint: storesError.hint,
          });
          setProducts([]);
          setLoading(false);
          return;
        }

        if (!storesData || storesData.length === 0) {
          setProducts([]);
          setLoading(false);
          return;
        }

        // Filter by area if selected (using address matching for now)
        // TODO: Use area_id column after migration is applied
        let filteredStores = storesData;
        if (selectedAreaId) {
          // For now, filter by address contains area name
          // After migration, this should use area_id
          filteredStores = storesData.filter((s: any) => 
            s.address?.toLowerCase().includes(selectedAreaId.toLowerCase())
          );
        }

        if (filteredStores.length === 0) {
          setProducts([]);
          setLoading(false);
          return;
        }

        const storeIds = filteredStores.map((s: any) => s.id);

        // Then get products from those stores
        let productsQuery = supabase
          .from('products')
          .select(`
            id,
            name,
            description,
            price,
            image_url,
            stock,
            category,
            store:stores!inner(
              id,
              name,
              address,
              area_id
            )
          `)
          .in('store_id', storeIds)
          .eq('is_available', true)
          .gt('stock', 0)
          .order('created_at', { ascending: false })
          .limit(50);

        const { data: productsData, error: productsError } = await productsQuery;

        if (productsError) {
          console.error('Error fetching products:', productsError);
          console.error('Error details:', {
            code: productsError.code,
            message: productsError.message,
            details: productsError.details,
            hint: productsError.hint,
          });
          setProducts([]);
          setLoading(false);
          return;
        }

        // Fetch areas if any store has area_id
        const areaIds = [...new Set((productsData || [])
          .map((p: any) => p.store?.area_id)
          .filter(Boolean))];
        
        let areasMap: Record<string, { id: string; name: string }> = {};
        
        if (areaIds.length > 0) {
          const { data: areasData, error: areasError } = await supabase
            .from('areas')
            .select('id, name')
            .in('id', areaIds);
          
          if (!areasError && areasData) {
            areasMap = areasData.reduce((acc, area) => {
              acc[area.id] = area;
              return acc;
            }, {} as Record<string, { id: string; name: string }>);
          }
        }

        // Map products data with area
        const productsWithStore = (productsData || []).map((product: any) => ({
          ...product,
          store: {
            ...product.store,
            area: product.store?.area_id && areasMap[product.store.area_id]
              ? areasMap[product.store.area_id]
              : null,
          },
        }));

        setProducts(productsWithStore as ProductWithStore[]);
      } catch (error) {
        console.error('Error:', error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [selectedAreaId]);

  // Filter products by search query
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) {
      return products;
    }

    const query = searchQuery.toLowerCase();
    return products.filter((product) => {
      const matchesName = product.name.toLowerCase().includes(query);
      const matchesStore = product.store.name.toLowerCase().includes(query);
      const matchesCategory = product.category?.toLowerCase().includes(query);
      return matchesName || matchesStore || matchesCategory;
    });
  }, [products, searchQuery]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20">
      {/* Search Bar */}
      <div className="container mx-auto px-4 pt-4 pb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Cari makanan atau toko..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12 rounded-xl border-gray-200 bg-white shadow-sm"
          />
        </div>
      </div>

      {/* Section Makanan */}
      <div className="container mx-auto px-4 py-4">
        <div className="mb-4">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-1">
            {selectedAreaName ? `Toko ${selectedAreaName}` : 'Semua Makanan'}
          </h2>
          {searchQuery && (
            <p className="text-sm text-gray-600">
              Menampilkan {filteredProducts.length} hasil untuk "{searchQuery}"
            </p>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <EmptyState searchQuery={searchQuery} />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ProductCard({ product }: { product: ProductWithStore }) {
  return (
    <Link 
      href={`/user/stores/${product.store.id}?productId=${product.id}`}
      className="block"
    >
      <Card className="rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-200 bg-white overflow-hidden h-full flex flex-col">
        {/* Product Image */}
        <div className="relative h-32 md:h-40 w-full bg-gradient-to-br from-gray-100 to-gray-200">
          {product.image_url ? (
            <Image
              src={getImageUrl(product.image_url, 'medium') || '/placeholder-food.jpg'}
              alt={product.name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <UtensilsCrossed className="h-12 w-12 text-gray-400" />
            </div>
          )}
          {product.stock <= 5 && product.stock > 0 && (
            <div className="absolute top-2 right-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded-full font-medium">
              Stok terbatas
            </div>
          )}
        </div>

        <CardContent className="p-3 md:p-4 flex-1 flex flex-col">
          {/* Store Name */}
          <div className="flex items-center gap-1.5 mb-1.5">
            <Store className="h-3 w-3 text-gray-400 flex-shrink-0" />
            <span className="text-xs text-gray-500 truncate">{product.store.name}</span>
          </div>

          {/* Product Name */}
          <h3 className="font-semibold text-sm md:text-base text-gray-900 mb-2 line-clamp-2 flex-1">
            {product.name}
          </h3>

          {/* Price */}
          <div className="mt-auto">
            <div className="flex items-center justify-between">
              <span className="text-base md:text-lg font-bold text-[#1E3A8A]">
                Rp {product.price.toLocaleString('id-ID')}
              </span>
              {product.stock === 0 && (
                <span className="text-xs text-red-500 font-medium">Habis</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function ProductCardSkeleton() {
  return (
    <Card className="rounded-2xl border border-gray-200 bg-white overflow-hidden h-full flex flex-col">
      <Skeleton className="h-32 md:h-40 w-full" />
      <CardContent className="p-3 md:p-4 flex-1 flex flex-col">
        <Skeleton className="h-3 w-20 mb-2" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-3/4 mb-3 flex-1" />
        <Skeleton className="h-5 w-24" />
      </CardContent>
    </Card>
  );
}

function EmptyState({ searchQuery }: { searchQuery: string }) {
  return (
    <Card className="rounded-2xl border border-gray-200 bg-white">
      <CardContent className="py-12 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="bg-gray-100 rounded-full p-4">
            <UtensilsCrossed className="h-12 w-12 text-gray-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {searchQuery ? 'Tidak ada hasil ditemukan' : 'Belum ada makanan tersedia'}
            </h3>
            <p className="text-sm text-gray-600">
              {searchQuery 
                ? 'Coba kata kunci lain atau pilih wilayah lain'
                : 'Pilih wilayah lain atau coba lagi nanti'
              }
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
