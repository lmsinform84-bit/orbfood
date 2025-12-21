import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { StorePageClient } from '@/components/user/store-page-client';

async function getStore(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('stores')
    .select(`
      *,
      area:areas(id, name),
      settings:store_settings(delivery_fee, payment_methods, cod_max_limit)
    `)
    .eq('id', id)
    .eq('status', 'approved')
    .single();

  if (error) {
    console.error('Error fetching store:', error);
    console.error('Store ID:', id);
    return null;
  }

  if (!data) {
    console.log('Store not found or not approved. Store ID:', id);
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
  console.log('StorePage - params.id:', params.id);
  console.log('StorePage - searchParams.productId:', searchParams.productId);
  
  const store = await getStore(params.id);
  const products = await getProducts(params.id);

  if (!store) {
    console.log('Store not found, redirecting to /user/home');
    redirect('/user/home');
  }
  
  console.log('Store found:', store.name);
  console.log('Products count:', products.length);

  // Get selected product if productId is provided
  const selectedProductId = searchParams.productId || null;

  return (
    <StorePageClient
      store={store}
          products={products} 
      selectedProductId={selectedProductId}
        />
  );
}

