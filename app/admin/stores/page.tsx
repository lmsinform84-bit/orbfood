import { createAdminClient } from '@/lib/supabase/admin-server';
import { StoresListClient } from '@/components/admin/stores-list-client';

async function getStores() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('stores')
    .select(`
      *,
      user:users(id, full_name, email)
    `)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    console.error('❌ Error fetching stores:', error);
    return [];
  }

  // Debug logging (hanya di development)
  if (process.env.NODE_ENV === 'development' && data) {
    console.log('📊 Stores fetched:', data.length);
    data.forEach((store: any) => {
      console.log(`  - ${store.name}: status=${store.status}, id=${store.id}`);
    });
  }

  return data || [];
}

export default async function AdminStoresPage() {
  const stores = await getStores();

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Kelola Toko</h1>
      <StoresListClient initialStores={stores} />
    </div>
  );
}

