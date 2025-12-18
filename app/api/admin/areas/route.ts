import { createAdminClient } from '@/lib/supabase/admin-server';
import { NextRequest, NextResponse } from 'next/server';

// GET - Fetch all areas
export async function GET() {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('areas')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching areas:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: data || [] });
  } catch (error: any) {
    console.error('Error in GET /api/admin/areas:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create new area
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Nama area wajib diisi' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('areas')
      .insert({
        name: name.trim(),
        description: description?.trim() || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating area:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ data });
  } catch (error: any) {
    console.error('Error in POST /api/admin/areas:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update area
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, description } = body;

    if (!id || !name || !name.trim()) {
      return NextResponse.json(
        { error: 'ID dan nama area wajib diisi' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    const { error } = await supabase
      .from('areas')
      .update({
        name: name.trim(),
        description: description?.trim() || null,
      })
      .eq('id', id);

    if (error) {
      console.error('Error updating area:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error in PUT /api/admin/areas:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete area
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'ID area wajib diisi' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    
    // Check if area has stores
    const { data: stores, error: checkError } = await supabase
      .from('stores')
      .select('id')
      .eq('area_id', id)
      .limit(1);

    if (checkError) {
      console.error('Error checking stores:', checkError);
    }

    if (stores && stores.length > 0) {
      return NextResponse.json(
        { error: `Area ini masih digunakan oleh ${stores.length} toko. Hapus atau pindahkan toko terlebih dahulu.` },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('areas')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting area:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error in DELETE /api/admin/areas:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

