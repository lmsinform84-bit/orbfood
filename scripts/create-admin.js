/**
 * Script untuk membuat admin user secara otomatis
 * 
 * Cara penggunaan:
 * 1. Install dependencies: npm install
 * 2. Buat file .env.local dengan SUPABASE_SERVICE_ROLE_KEY
 * 3. Jalankan: node scripts/create-admin.js admin@example.com "Admin Name" "password123"
 * 
 * Atau edit langsung email, name, dan password di bawah ini
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Config - Edit ini sesuai kebutuhan
const ADMIN_EMAIL = process.argv[2] || 'admin@example.com';
const ADMIN_NAME = process.argv[3] || 'Admin User';
const ADMIN_PASSWORD = process.argv[4] || 'Admin123!@#';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Error: SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY harus di-set di .env.local');
  console.error('\nTambahkan ke .env.local:');
  console.error('NEXT_PUBLIC_SUPABASE_URL=your_supabase_url');
  console.error('SUPABASE_SERVICE_ROLE_KEY=your_service_role_key');
  console.error('\nService Role Key bisa ditemukan di:');
  console.error('Supabase Dashboard > Settings > API > service_role key');
  process.exit(1);
}

// Create Supabase admin client (menggunakan service_role untuk admin access)
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createAdminUser() {
  try {
    console.log('🚀 Membuat admin user...');
    console.log(`📧 Email: ${ADMIN_EMAIL}`);
    console.log(`👤 Name: ${ADMIN_NAME}`);
    
    // Step 1: Create user di auth.users
    console.log('\n📝 Step 1: Membuat user di Supabase Auth...');
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name: ADMIN_NAME
      }
    });

    if (authError) {
      if (authError.message.includes('already registered')) {
        console.log('⚠️  User sudah ada di auth.users, melanjutkan ke step 2...');
      } else {
        throw authError;
      }
    } else {
      console.log('✅ User berhasil dibuat di auth.users');
      console.log(`   User ID: ${authData.user.id}`);
    }

    // Step 2: Get user ID (jika sudah ada atau baru dibuat)
    let userId;
    if (authData?.user?.id) {
      userId = authData.user.id;
    } else {
      const { data: existingUser } = await supabaseAdmin.auth.admin.getUserByEmail(ADMIN_EMAIL);
      if (existingUser?.user) {
        userId = existingUser.user.id;
      } else {
        throw new Error('User tidak ditemukan di auth.users');
      }
    }

    // Step 3: Create atau update profile di public.users dengan role admin
    console.log('\n📝 Step 2: Membuat/update profile di public.users dengan role admin...');
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('users')
      .upsert({
        id: userId,
        email: ADMIN_EMAIL,
        full_name: ADMIN_NAME,
        role: 'admin'
      }, {
        onConflict: 'id'
      })
      .select()
      .single();

    if (profileError) {
      throw profileError;
    }

    console.log('✅ Profile admin berhasil dibuat/updated');
    console.log(`   Role: ${profileData.role}`);

    // Step 4: Verifikasi
    console.log('\n🔍 Verifikasi admin user...');
    const { data: verifyData, error: verifyError } = await supabaseAdmin
      .from('users')
      .select('id, email, full_name, role')
      .eq('email', ADMIN_EMAIL)
      .single();

    if (verifyError) {
      throw verifyError;
    }

    console.log('\n✅ ========================================');
    console.log('✅ ADMIN USER BERHASIL DIBUAT!');
    console.log('✅ ========================================');
    console.log(`📧 Email: ${verifyData.email}`);
    console.log(`👤 Name: ${verifyData.full_name}`);
    console.log(`🔑 Role: ${verifyData.role}`);
    console.log(`🆔 User ID: ${verifyData.id}`);
    console.log('\n📝 Credentials untuk login:');
    console.log(`   Email: ${ADMIN_EMAIL}`);
    console.log(`   Password: ${ADMIN_PASSWORD}`);
    console.log('\n🔐 Simpan credentials ini dengan aman!');
    console.log('🌐 Login di: http://localhost:3000/login');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('\nDetail error:', error);
    process.exit(1);
  }
}

// Jalankan script
createAdminUser();

