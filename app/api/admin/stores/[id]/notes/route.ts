import { createAdminClient } from '@/lib/supabase/admin-server';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// GET - Get all admin notes for a store
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createAdminClient();
    const storeId = params.id;

    // For now, we'll use a simple approach: store notes in a JSONB column or text field
    // If admin_notes table doesn't exist, we'll use stores.admin_notes field
    const { data: store, error } = await supabase
      .from('stores')
      .select('admin_notes')
      .eq('id', storeId)
      .single();

    if (error) {
      console.error('Error fetching admin notes:', error);
      return NextResponse.json(
        { error: 'Gagal mengambil catatan admin' },
        { status: 500 }
      );
    }

    // Parse admin_notes if it's a JSON string, otherwise return empty array
    let notes: Array<{ id: string; note: string; created_at: string; created_by?: string }> = [];
    
    if (store?.admin_notes) {
      try {
        notes = typeof store.admin_notes === 'string' 
          ? JSON.parse(store.admin_notes) 
          : store.admin_notes;
      } catch (e) {
        // If parsing fails, treat as empty
        notes = [];
      }
    }

    return NextResponse.json({ notes: notes || [] });
  } catch (error: any) {
    console.error('Error in GET admin notes:', error);
    return NextResponse.json(
      { error: error.message || 'Terjadi kesalahan' },
      { status: 500 }
    );
  }
}

// POST - Add a new admin note
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createAdminClient();
    const storeId = params.id;
    const body = await request.json();
    const { note } = body;

    if (!note || !note.trim()) {
      return NextResponse.json(
        { error: 'Catatan tidak boleh kosong' },
        { status: 400 }
      );
    }

    // Get current admin notes
    const { data: store, error: fetchError } = await supabase
      .from('stores')
      .select('admin_notes')
      .eq('id', storeId)
      .single();

    if (fetchError) {
      console.error('Error fetching store:', fetchError);
      return NextResponse.json(
        { error: 'Gagal mengambil data toko' },
        { status: 500 }
      );
    }

    // Parse existing notes
    let notes: Array<{ id: string; note: string; created_at: string; created_by?: string }> = [];
    
    if (store?.admin_notes) {
      try {
        notes = typeof store.admin_notes === 'string' 
          ? JSON.parse(store.admin_notes) 
          : store.admin_notes;
      } catch (e) {
        notes = [];
      }
    }

    // Add new note
    const newNote = {
      id: Date.now().toString(),
      note: note.trim(),
      created_at: new Date().toISOString(),
      created_by: 'Admin', // TODO: Get from session
    };

    notes.push(newNote);

    // Update store with new notes
    const { error: updateError } = await supabase
      .from('stores')
      .update({ admin_notes: JSON.stringify(notes) })
      .eq('id', storeId);

    if (updateError) {
      console.error('Error updating admin notes:', updateError);
      return NextResponse.json(
        { error: 'Gagal menyimpan catatan admin' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      note: newNote,
      message: 'Catatan admin berhasil disimpan' 
    });
  } catch (error: any) {
    console.error('Error in POST admin notes:', error);
    return NextResponse.json(
      { error: error.message || 'Terjadi kesalahan' },
      { status: 500 }
    );
  }
}

