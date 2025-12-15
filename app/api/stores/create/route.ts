import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * API Route untuk membuat store dari user yang sudah login
 * User harus sudah login (authenticated)
 * Store akan dibuat dengan status 'pending'
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Anda harus login terlebih dahulu' },
        { status: 401 }
      );
    }

    // Check if user already has a store
    const { data: existingStore, error: checkError } = await supabase
      .from('stores')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking store:', checkError);
      return NextResponse.json(
        { error: 'Gagal memeriksa toko' },
        { status: 500 }
      );
    }

    if (existingStore) {
      return NextResponse.json(
        { error: 'Anda sudah memiliki toko terdaftar' },
        { status: 400 }
      );
    }

    // Get request body
    const body = await request.json();
    const { name, description, address, phone, email } = body;

    // Validate input
    if (!name || !address) {
      return NextResponse.json(
        { error: 'Nama toko dan alamat harus diisi' },
        { status: 400 }
      );
    }

    // Get user profile untuk mendapatkan full_name dan phone
    const { data: userProfile } = await supabase
      .from('users')
      .select('full_name, phone')
      .eq('id', user.id)
      .single();

    // Create store dengan status 'pending'
    const storePayload = {
      user_id: user.id,
      name: name.trim(),
      description: description?.trim() || null,
      address: address.trim(),
      phone: phone?.trim() || userProfile?.phone || null,
      email: email?.trim() || user.email || null,
      status: 'pending', // Status awal: pending, perlu approval admin
      is_open: false,
    };

    console.log('📝 Creating store with payload:', { ...storePayload, user_id: user.id });

    const { data: storeData, error: storeError } = await supabase
      .from('stores')
      .insert(storePayload)
      .select()
      .single();

    if (storeError) {
      console.error('❌ Error creating store:', storeError);
      console.error('❌ Store payload:', storePayload);
      return NextResponse.json(
        { error: storeError.message || 'Gagal membuat toko' },
        { status: 500 }
      );
    }

    console.log('✅ Store created successfully:', {
      id: storeData.id,
      name: storeData.name,
      status: storeData.status,
    });

    return NextResponse.json({
      success: true,
      message: 'Toko berhasil didaftarkan. Menunggu persetujuan admin.',
      store: {
        id: storeData.id,
        name: storeData.name,
        status: storeData.status,
      },
    });
  } catch (error: any) {
    console.error('❌ Unexpected error:', error);
    return NextResponse.json(
      { error: error.message || 'Terjadi kesalahan saat membuat toko' },
      { status: 500 }
    );
  }
}
