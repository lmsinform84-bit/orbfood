import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { getImageUrl } from '@/lib/utils/image';
import { MapPin, Clock, Store } from 'lucide-react';
import { StoreApprovalAlert } from '@/components/user/store-approval-alert';

async function getStores() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('stores')
    .select('*')
    .eq('status', 'approved')
    .eq('is_open', true)
    .order('created_at', { ascending: false })
    .limit(12);

  if (error) {
    console.error('Error fetching stores:', error);
    return [];
  }

  return data || [];
}

export default async function UserHomePage() {
  const stores = await getStores();
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
        <h1 className="text-3xl font-bold mb-2">Daftar Toko</h1>
        <p className="text-muted-foreground">
          Pilih toko favorit Anda dan pesan makanan lezat
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

      {stores.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Belum ada toko yang tersedia saat ini.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stores.map((store) => (
            <Link key={store.id} href={`/user/stores/${store.id}`}>
              <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                <div className="relative h-48 w-full">
                  {store.banner_url ? (
                    <Image
                      src={getImageUrl(store.banner_url, 'medium') || '/placeholder-store.jpg'}
                      alt={store.name}
                      fill
                      className="object-cover rounded-t-lg"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-orange-200 to-red-200 dark:from-orange-900 dark:to-red-900 flex items-center justify-center rounded-t-lg">
                      <span className="text-4xl">🏪</span>
                    </div>
                  )}
                </div>
                <CardHeader>
                  <CardTitle className="line-clamp-1">{store.name}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {store.description || 'Toko makanan terpercaya'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span className="line-clamp-1">{store.address}</span>
                    </div>
                    {store.phone && (
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>{store.phone}</span>
                      </div>
                    )}
                  </div>
                  <Button className="w-full mt-4">Lihat Menu</Button>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

