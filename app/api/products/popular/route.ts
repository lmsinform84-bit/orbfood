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

    // Fetch areas if any store has area_id
    const areaIds = [...new Set(productsData
      .map((p: any) => p.store?.area_id)
      .filter(Boolean))];

    let areasMap: Record<string, { id: string; name: string }> = {};

    if (areaIds.length > 0) {
      const { data: areasData } = await supabase
        .from('areas')
        .select('id, name')
        .in('id', areaIds);

      if (areasData) {
        areasMap = areasData.reduce((acc, area) => {
          acc[area.id] = area;
          return acc;
        }, {} as Record<string, { id: string; name: string }>);
      }
    }

    // Map products with area data
    const productsWithStore = productsData.map((product: any) => ({
      ...product,
      store: {
        ...product.store,
        area: product.store?.area_id && areasMap[product.store.area_id]
          ? areasMap[product.store.area_id]
          : null,
      },
    }));

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

