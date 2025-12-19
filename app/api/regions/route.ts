import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const parentId = searchParams.get('parent_id');
    const id = searchParams.get('id');

    let query = supabase
      .from('regions')
      .select('id, name, type, parent_id, created_at, updated_at')
      .order('name', { ascending: true });

    // If id is provided, fetch by id
    if (id) {
      query = query.eq('id', id);
    } else {
      if (type) {
        query = query.eq('type', type);
      }

      if (parentId) {
        query = query.eq('parent_id', parentId);
      } else if (type === 'desa' || type === 'kelurahan') {
        // If requesting desa/kelurahan without parent_id, return empty
        // They should always have a parent (kecamatan)
        return NextResponse.json([]);
      }
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching regions:', error);
      return NextResponse.json(
        { error: 'Failed to fetch regions' },
        { status: 500 }
      );
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Error in regions API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

