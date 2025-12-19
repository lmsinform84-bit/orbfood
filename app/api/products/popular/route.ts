import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export const revalidate = 60; // Revalidate every 60 seconds

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const areaId = searchParams.get('area_id');
    const limit = parseInt(searchParams.get('limit') || '50');

    // First, get approved and open stores
    let storesQuery = supabase
      .from('stores')
      .select('id')
      .eq('status', 'approved')
      .eq('is_open', true);

    if (areaId) {
      storesQuery = storesQuery.eq('area_id', areaId);
    }

    const { data: storesData, error: storesError } = await storesQuery;

    if (storesError || !storesData || storesData.length === 0) {
      return NextResponse.json([]);
    }

    const storeIds = storesData.map((s) => s.id);

    // Get products from those stores with store info
    const { data: productsData, error: productsError } = await supabase
      .from('products')
      .select(`
        id,
        name,
        description,
        price,
        image_url,
        stock,
        category,
        store:stores!inner(
          id,
          name,
          address,
          region_id,
          area_id
        )
      `)
      .in('store_id', storeIds)
      .eq('is_available', true)
      .gt('stock', 0)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (productsError || !productsData) {
      return NextResponse.json([]);
    }

    // Fetch regions if any store has region_id
    const regionIds = [...new Set(productsData
      .map((p: any) => p.store?.region_id)
      .filter(Boolean))];

    let regionsMap: Record<string, any> = {};
    let parentRegionsMap: Record<string, any> = {};

    if (regionIds.length > 0) {
      const { data: regionsData } = await supabase
        .from('regions')
        .select('id, name, type, parent_id')
        .in('id', regionIds);

      if (regionsData) {
        regionsMap = regionsData.reduce((acc, region) => {
          acc[region.id] = region;
          return acc;
        }, {} as Record<string, any>);

        const parentIds = [...new Set(regionsData
          .map((r: any) => r.parent_id)
          .filter(Boolean))];

        if (parentIds.length > 0) {
          const { data: parentData } = await supabase
            .from('regions')
            .select('id, name')
            .in('id', parentIds);

          if (parentData) {
            parentRegionsMap = parentData.reduce((acc, parent) => {
              acc[parent.id] = parent;
              return acc;
            }, {} as Record<string, any>);
          }
        }
      }
    }

    // Map products with region data
    const productsWithStore = productsData.map((product: any) => {
      const region = product.store?.region_id && regionsMap[product.store.region_id]
        ? regionsMap[product.store.region_id]
        : null;

      const parentRegion = region?.parent_id && parentRegionsMap[region.parent_id]
        ? parentRegionsMap[region.parent_id]
        : null;

      return {
        ...product,
        store: {
          ...product.store,
          region: region ? {
            id: region.id,
            name: region.name,
            type: region.type,
            parent: parentRegion ? {
              id: parentRegion.id,
              name: parentRegion.name,
            } : null,
          } : null,
        },
      };
    });

    return NextResponse.json(productsWithStore, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    });
  } catch (error) {
    console.error('Error in popular products API:', error);
    return NextResponse.json([], { status: 500 });
  }
}

