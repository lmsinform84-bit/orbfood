import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { EditProductForm } from '@/components/toko/edit-product-form';

async function getProduct(productId: string, userId: string) {
  const supabase = await createClient();
  
  // Verify product belongs to user's store
  const { data: store } = await supabase
    .from('stores')
    .select('id')
    .eq('user_id', userId)
    .single();

  if (!store) return null;

  const { data: product } = await supabase
    .from('products')
    .select('*')
    .eq('id', productId)
    .eq('store_id', store.id)
    .single();

  return product;
}

export default async function EditProductPage({ params }: { params: { id: string } }) {
  const user = await requireAuth();
  const product = await getProduct(params.id, user.id);

  if (!product) {
    redirect('/toko/menu');
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Edit Menu</h1>
      <EditProductForm product={product} />
    </div>
  );
}

