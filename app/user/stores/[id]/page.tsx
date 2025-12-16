import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import { getImageUrl } from '@/lib/utils/image';
import { AddToCartButton } from '@/components/user/add-to-cart-button';
import { ProductHighlight } from '@/components/user/product-highlight';
import { MapPin, Phone, Mail, Clock, CreditCard } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

async function getStore(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('stores')
    .select(`
      *,
      settings:store_settings(delivery_fee, payment_methods)
    `)
    .eq('id', id)
    .eq('status', 'approved')
    .single();

  if (error || !data) {
    return null;
  }

  return data;
}

async function getProducts(storeId: string) {
  const supabase = await createClient();
  
  // First try with is_available filter
  let { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('store_id', storeId)
    .eq('is_available', true)
    .order('created_at', { ascending: false });

  // If no products found, try without is_available filter (in case field is null)
  if ((!data || data.length === 0) && !error) {
    const { data: allData, error: allError } = await supabase
      .from('products')
      .select('*')
      .eq('store_id', storeId)
      .order('created_at', { ascending: false });
    
    if (!allError && allData) {
      // Filter manually to include null is_available as available
      data = allData.filter((p: any) => p.is_available !== false);
      error = null;
    } else {
      error = allError;
    }
  }

  if (error) {
    console.error('Error fetching products:', error);
    return [];
  }

  return data || [];
}

export default async function StorePage({ 
  params, 
  searchParams 
}: { 
  params: { id: string };
  searchParams: { productId?: string };
}) {
  const store = await getStore(params.id);
  const products = await getProducts(params.id);

  if (!store) {
    redirect('/user/home');
  }

  // Get selected product if productId is provided
  const selectedProduct = searchParams.productId 
    ? products.find((p: any) => p.id === searchParams.productId)
    : null;

  return (
    <div>
      <div className="mb-8">
        <div className="relative h-64 w-full mb-4 rounded-lg overflow-hidden">
          {store.banner_url ? (
            <Image
              src={getImageUrl(store.banner_url, 'medium') || '/placeholder-store.jpg'}
              alt={store.name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-orange-200 to-red-200 dark:from-orange-900 dark:to-red-900 flex items-center justify-center">
              <span className="text-6xl">🏪</span>
            </div>
          )}
        </div>
        <div className="flex items-start justify-between mb-2">
          <div>
            <h1 className="text-3xl font-bold mb-2">{store.name}</h1>
            {store.description && (
              <p className="text-muted-foreground mb-4">{store.description}</p>
            )}
          </div>
          <Badge variant={store.is_open ? 'default' : 'secondary'} className="ml-4">
            {store.is_open ? 'Buka' : 'Tutup'}
          </Badge>
        </div>
        
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            <span>{store.address}</span>
          </div>
          {store.phone && (
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              <span>{store.phone}</span>
            </div>
          )}
          {store.email && (
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              <span>{store.email}</span>
            </div>
          )}
        </div>

        {/* Payment Methods */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Metode Pembayaran
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {(store as any).settings?.payment_methods ? (
                JSON.parse((store as any).settings.payment_methods || '[]').map((method: string) => (
                  <Badge key={method} variant="outline">
                    {method === 'COD' ? 'COD (Bayar di Tempat)' : 
                     method === 'TRANSFER' ? 'Transfer Bank' :
                     method === 'QRIS' ? 'QRIS' : method}
                  </Badge>
                ))
              ) : (
                <>
                  <Badge variant="outline">COD (Bayar di Tempat)</Badge>
                  <Badge variant="outline">Transfer Bank</Badge>
                  <Badge variant="outline">QRIS</Badge>
                </>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              💡 Pembayaran dilakukan langsung ke toko, bukan melalui aplikasi.
            </p>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-4">Menu</h2>
        
        {/* Show selected product highlight at the top */}
        {selectedProduct && (
          <ProductHighlight product={selectedProduct} />
        )}

        {products.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Belum ada menu yang tersedia.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => {
              const isSelected = selectedProduct?.id === product.id;
              return (
                <Card 
                  key={product.id}
                  className={isSelected ? 'border-2 border-primary shadow-md' : ''}
                >
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
                        <span className="text-4xl">🍽️</span>
                      </div>
                    )}
                  </div>
                  <CardHeader>
                    <CardTitle className="line-clamp-1">{product.name}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {product.description || 'Menu lezat dari toko kami'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-2xl font-bold text-primary">
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
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

