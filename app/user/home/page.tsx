import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { getImageUrl } from '@/lib/utils/image';
import { MapPin, Store, UtensilsCrossed } from 'lucide-react';
import { StoreApprovalAlert } from '@/components/user/store-approval-alert';

async function getProducts() {
  const supabase = await createClient();
  
  // Get products with store info using join
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      store:stores!inner(id, name, address, status, is_open)
    `)
    .eq('store.status', 'approved')
    .eq('store.is_open', true)
    .eq('is_available', true)
    .gt('stock', 0)
    .order('created_at', { ascending: false })
    .limit(24);

  if (error) {
    console.error('❌ Error fetching products:', error);
    // Fallback: try without join
    const { data: stores } = await supabase
      .from('stores')
      .select('id')
      .eq('status', 'approved')
      .eq('is_open', true);
    
    if (stores && stores.length > 0) {
      const storeIds = stores.map(s => s.id);
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .in('store_id', storeIds)
        .eq('is_available', true)
        .gt('stock', 0)
        .order('created_at', { ascending: false })
        .limit(24);
      
      if (productsError) {
        return [];
      }
      
      // Fetch store info separately
      const productsWithStore = await Promise.all(
        (productsData || []).map(async (product) => {
          const { data: storeData } = await supabase
            .from('stores')
            .select('id, name, address')
            .eq('id', product.store_id)
            .single();
          return { ...product, store: storeData };
        })
      );
      
      return productsWithStore;
    }
    
    return [];
  }

  return data || [];
}

export default async function UserHomePage() {
  const products = await getProducts();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  // Check if user has a store
  let userStore = null;
  let userProfile = null;
  if (user) {
    const [storeData, profileData] = await Promise.all([
      supabase
        .from('stores')
        .select('id, name, status')
        .eq('user_id', user.id)
        .maybeSingle(),
      supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single(),
    ]);
    userStore = storeData.data;
    userProfile = profileData.data;
  }

  return (
    <div>
      {/* Show approval alert if store is approved but user role is still 'user' */}
      {user && userStore && userStore.status === 'approved' && userProfile && userProfile.role === 'user' && (
        <div className="mb-6">
          <StoreApprovalAlert
            storeName={userStore.name}
            storeStatus={userStore.status}
            userRole={userProfile.role}
          />
        </div>
      )}
      
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Menu Makanan</h1>
            <p className="text-muted-foreground">
              Pilih makanan favorit Anda dan pesan langsung dari toko
            </p>
          </div>
          {user && !userStore && (
            <Link href="/user/open-store">
              <Button>
                <Store className="mr-2 h-4 w-4" />
                Buka Toko
              </Button>
            </Link>
          )}
          {user && userStore && userStore.status === 'pending' && (
            <div className="text-sm text-muted-foreground">
              <p>Toko Anda sedang menunggu persetujuan admin</p>
            </div>
          )}
        </div>
      </div>

      {products.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <UtensilsCrossed className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Belum ada menu yang tersedia saat ini.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((product: any) => (
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

