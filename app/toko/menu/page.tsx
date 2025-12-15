import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { ProductList } from '@/components/toko/product-list';

async function getStore(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('stores')
    .select('id')
    .eq('user_id', userId)
    .single();

  return data;
}

async function getProducts(storeId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('store_id', storeId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching products:', error);
    return [];
  }

  return data || [];
}

export default async function MenuPage() {
  const user = await requireAuth();
  const store = await getStore(user.id);

  if (!store) {
    return (
      <div>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">
              Anda perlu membuat profil toko terlebih dahulu.
            </p>
            <Link href="/toko/settings">
              <Button>Buat Profil Toko</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const products = await getProducts(store.id);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Kelola Menu</h1>
          <p className="text-muted-foreground">Tambahkan, edit, atau hapus menu produk Anda</p>
        </div>
        <Link href="/toko/menu/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Tambah Menu
          </Button>
        </Link>
      </div>

      <ProductList products={products} />
    </div>
  );
}

