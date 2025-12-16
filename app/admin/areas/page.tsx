import { createAdminClient } from '@/lib/supabase/admin-server';
import { AreasListClient } from '@/components/admin/areas-list-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin } from 'lucide-react';

async function getAreas() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('areas')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching areas:', error);
    return [];
  }

  return data || [];
}

async function getStoreCountsByArea() {
  const supabase = createAdminClient();
  const { data: storesData, error } = await supabase
    .from('stores')
    .select('area_id');

  if (error) {
    console.error('Error fetching stores for count:', error);
    return {};
  }

  const storeCountsByArea: Record<string, number> = {};
  storesData?.forEach((store: any) => {
    if (store.area_id) {
      storeCountsByArea[store.area_id] = (storeCountsByArea[store.area_id] || 0) + 1;
    }
  });

  return storeCountsByArea;
}

export default async function AdminAreasPage() {
  const [areas, storeCounts] = await Promise.all([
    getAreas(),
    getStoreCountsByArea(),
  ]);

  const areasWithCounts = areas.map((area: any) => ({
    ...area,
    store_count: storeCounts[area.id] || 0,
  }));

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <MapPin className="h-6 w-6 text-primary" />
          <h1 className="text-2xl md:text-3xl font-bold">Kelola Wilayah/Area</h1>
        </div>
        <p className="text-muted-foreground">
          Kelola wilayah/area untuk filtering toko dan pelanggan
        </p>
      </div>

      <AreasListClient initialAreas={areasWithCounts} />
    </div>
  );
}

