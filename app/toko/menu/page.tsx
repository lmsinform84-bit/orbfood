import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { ProductList } from '@/components/toko/product-list';

async function getStore(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('stores')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching store:', error);
    return null;
  }

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
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">Menu</h1>
        <p className="text-muted-foreground">
          Kelola menu dan produk Anda
        </p>
        </div>

      <ProductList products={products} />

      {/* Floating Action Button for Mobile */}
      <Link href="/toko/menu/new" className="md:hidden">
        <Button
          size="lg"
          className="fixed bottom-24 right-4 rounded-full h-14 w-14 shadow-lg z-[60] p-0 flex items-center justify-center"
          aria-label="Tambah menu baru"
        >
          <Plus className="h-6 w-6" />
        </Button>
      </Link>
      
      {/* Desktop Button */}
      <div className="hidden md:block mt-6">
        <Link href="/toko/menu/new">
          <Button className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Tambah Menu
          </Button>
        </Link>
      </div>
    </div>
  );
}

