import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { StoreSettingsForm } from '@/components/toko/store-settings-form';

async function getStore(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('stores')
    .select('*')
    .eq('user_id', userId)
    .single();

  return data;
}

async function getStoreSettings(storeId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('store_settings')
    .select('*')
    .eq('store_id', storeId)
    .single();

  return data;
}

export default async function SettingsPage() {
  const user = await requireAuth();
  const store = await getStore(user.id);
  const settings = store ? await getStoreSettings(store.id) : null;

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Pengaturan Toko</h1>
      <StoreSettingsForm store={store} settings={settings} />
    </div>
  );
}

