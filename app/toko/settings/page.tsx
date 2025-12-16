import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth';
import { StoreSettingsForm } from '@/components/toko/store-settings-form';
import { Card, CardContent } from '@/components/ui/card';

async function getStore(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('stores')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching store:', error);
    return null;
  }

  return data;
}

async function getStoreSettings(storeId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('store_settings')
    .select('*')
    .eq('store_id', storeId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching store settings:', error);
    return null;
  }

  return data;
}

export default async function SettingsPage() {
  const user = await requireAuth();
  
  // Ensure user has toko role
  if (user.role !== 'toko') {
    return (
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">
              Akses ditolak. Hanya toko yang dapat mengakses halaman ini.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const store = await getStore(user.id);
  const settings = store ? await getStoreSettings(store.id) : null;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">Profil & Pengaturan</h1>
        <p className="text-muted-foreground">
          Kelola informasi toko, QRIS toko, dan pengaturan operasional
        </p>
      </div>

      <StoreSettingsForm store={store} settings={settings} />
    </div>
  );
}

